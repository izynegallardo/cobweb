import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore'
import { auth, database } from '@/utils/firebase'
import { query, invalidate } from '@/utils/cache'
import { CACHE_KEYS } from '@/configs/cache-keys.js'
import { UsernameTakenError } from '@/utils/errors'

/**
 * Fetches the current user's profile.
 *
 * First call hits Firestore. Subsequent calls within 5 minutes
 * are served from the in-memory cache — zero extra reads.
 */
export async function getCurrentUserProfile() {
    try {
        const user = auth.currentUser
        if (!user) return null

        return query(CACHE_KEYS.profile(user.uid), async () => {
            const snapshot = await getDoc(doc(database, 'users', user.uid))

            if (snapshot.exists()) {
                const data = snapshot.data()
                return {
                    uid: user.uid,
                    email: user.email,
                    ...data,
                    // Firestore photoURL may be null if the doc was created before the
                    // OAuth photo was captured. Fall back to the provider photo.
                    photoURL: data.photoURL || user.photoURL || null,
                }
            }

            // Firestore doc doesn't exist yet (e.g. mid-setup)
            return { uid: user.uid, email: user.email }
        })
    } catch (error) {
        console.error('<error> User.getCurrentUserProfile:', error)
        throw error
    }
}

/**
 * Fetches a public profile by username (no auth required).
 * Used by the /:username page to render the public link-in-bio.
 */
export async function getProfileByUsername(username) {
    return query(CACHE_KEYS.publicProfile(username), async () => {
        const usernameSnap = await getDoc(doc(database, 'usernames', username.toLowerCase()))
        if (!usernameSnap.exists()) return null

        const { uid } = usernameSnap.data()
        const userSnap = await getDoc(doc(database, 'users', uid))
        if (!userSnap.exists()) return null

        return userSnap.data()
    })
}

// ── Mutations ─────────────────────────────────────────────────────────────────
//
// After every successful write to Firestore, invalidate the relevant cache key.
// The next read will fetch fresh data instead of serving stale cached values.

/**
 * Updates the textual profile fields in Firestore.
 *
 * Deliberately does NOT touch `username` — renames must go through
 * updateUsername(), which keeps the `usernames/{username}` reservation
 * doc in sync. Writing username here directly would desync it (the public
 * /:username page reads the usernames collection, not users/{uid}.username).
 */
export async function updateProfileData(uid, formData) {
    if (!uid) throw new Error('User UID is required.')

    try {
        const textPayload = {
            displayName: formData.displayName,
            bio: formData.bio,
        }

        await updateDoc(doc(database, 'users', uid), textPayload)

        // Bust the cache so the next read reflects the new values
        invalidate(CACHE_KEYS.profile(uid))

        return textPayload
    } catch (error) {
        console.error('<error> User.updateProfileData:', error)
        throw error
    }
}

/**
 * Renames a user's public username.
 *
 * The public /:username page resolves purely through the `usernames/{username}`
 * reservation collection (see getProfileByUsername above) — it is NOT derived
 * from users/{uid}.username. So a rename has to atomically:
 *   1. release the old `usernames/{oldUsername}` doc (so it becomes free again)
 *   2. claim the new `usernames/{newUsername}` doc
 *   3. update users/{uid}.username to match
 *
 * Wrapped in a transaction (not a batch) so the availability check and the
 * writes are atomic — closing the race where two users could both pass a
 * pre-check for the same new username and then both "win" the write.
 *
 * @param {string} uid
 * @param {string} newUsername - raw input; will be trimmed + lowercased
 * @param {string} currentUsername - the username currently on record, so we
 *                                    know what to release. Passed in rather
 *                                    than re-fetched so the transaction only
 *                                    needs one read (the new username's doc).
 * @throws {UsernameTakenError} if newUsername is already reserved by someone else
 * @returns {Promise<string>} the normalised (lowercased) username that was saved
 */
export async function updateUsername(uid, newUsername, currentUsername) {
    if (!uid) throw new Error('User UID is required.')

    const normalizedNew = (newUsername || '').trim().toLowerCase()
    const normalizedOld = (currentUsername || '').trim().toLowerCase()

    // No-op: nothing to reserve or release
    if (normalizedNew === normalizedOld) return normalizedNew

    const newUsernameRef = doc(database, 'usernames', normalizedNew)
    const oldUsernameRef = normalizedOld ? doc(database, 'usernames', normalizedOld) : null
    const userRef = doc(database, 'users', uid)

    try {
        await runTransaction(database, async (transaction) => {
            const newUsernameSnap = await transaction.get(newUsernameRef)
            if (newUsernameSnap.exists()) {
                throw new UsernameTakenError(normalizedNew)
            }

            if (oldUsernameRef) transaction.delete(oldUsernameRef)
            transaction.set(newUsernameRef, { uid })
            transaction.update(userRef, { username: normalizedNew })
        })

        // Bust every cache entry this rename touches: the owner's private
        // profile, and BOTH the old (now 404s) and new public profile pages.
        invalidate(CACHE_KEYS.profile(uid))
        if (normalizedOld) invalidate(CACHE_KEYS.publicProfile(normalizedOld))
        invalidate(CACHE_KEYS.publicProfile(normalizedNew))

        return normalizedNew
    } catch (error) {
        if (error instanceof UsernameTakenError) throw error
        console.error('<error> User.updateUsername:', error)
        throw error
    }
}

/**
 * Migrates a Google OAuth photoURL to Cloudinary.
 * Fetches the image as a blob (works because the auth session is active),
 * uploads to Cloudinary, writes the permanent URL back to Firestore,
 * and busts the cache.
 *
 * Returns the Cloudinary URL on success, null on any failure.
 */
export async function migrateGoogleAvatar(uid, googleURL) {
    try {
        const res = await fetch(googleURL)
        if (!res.ok) return null

        const blob = await res.blob()

        const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        const UPLOAD_PRESET = 'avatar_preset'

        const formData = new FormData()
        formData.append('file', blob)
        formData.append('upload_preset', UPLOAD_PRESET)

        const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData },
        )
        if (!uploadRes.ok) return null

        const data = await uploadRes.json()
        const cloudinaryURL = data.secure_url ?? null
        if (!cloudinaryURL) return null

        await updateDoc(doc(database, 'users', uid), { photoURL: cloudinaryURL })
        invalidate(CACHE_KEYS.profile(uid))

        return cloudinaryURL
    } catch {
        return null
    }
}

/**
 * Fetches a remote image URL and uploads it to Cloudinary.
 * Used during setup to permanently host the OAuth provider photo.
 *
 * Returns the Cloudinary secure_url, or null if anything fails
 * (network blip, CORS block, etc.) so the caller can fall back gracefully.
 */
export async function uploadAvatarFromURL(url) {
    try {
        const response = await fetch(url)
        if (!response.ok) return null

        const blob = await response.blob()

        const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        const UPLOAD_PRESET = 'avatar_preset'

        const formData = new FormData()
        formData.append('file', blob)
        formData.append('upload_preset', UPLOAD_PRESET)

        const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData },
        )
        if (!uploadRes.ok) return null

        const data = await uploadRes.json()
        return data.secure_url ?? null
    } catch {
        return null
    }
}

/**
 * Uploads an avatar to Cloudinary and writes the photoURL to Firestore.
 */
export async function updateProfileAvatar(uid, fileBlob) {
    if (!uid) throw new Error('User UID is required.')
    if (!fileBlob) throw new Error('No image file provided.')

    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const UPLOAD_PRESET = 'avatar_preset'

    try {
        const formData = new FormData()
        formData.append('file', fileBlob)
        formData.append('upload_preset', UPLOAD_PRESET)

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) throw new Error('Cloudinary upload request failed.')

        const cloudinaryData = await response.json()
        const photoURL = cloudinaryData.secure_url

        await updateDoc(doc(database, 'users', uid), { photoURL })

        // Bust the cache so the next read has the new photoURL
        invalidate(CACHE_KEYS.profile(uid))

        return photoURL
    } catch (error) {
        console.error('<error> User.updateProfileAvatar:', error)
        throw error
    }
}
