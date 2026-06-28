import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, database } from '@/utils/firebase'
import { query, invalidate } from '@/utils/cache'
import { CACHE_KEYS } from '@/configs/cache-keys.js'

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
 */
export async function updateProfileData(uid, formData) {
    if (!uid) throw new Error('User UID is required.')

    try {
        const textPayload = {
            displayName: formData.displayName,
            username: formData.username,
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
