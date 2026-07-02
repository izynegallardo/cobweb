import { auth, database, googleProvider, yahooProvider } from '@/utils/firebase'
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { signInWithPopup, signOut } from 'firebase/auth'
import { clearAll } from '@/utils/cache'
import { UsernameTakenError } from '@/utils/errors'

export async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
}

export async function loginWithYahoo() {
    const result = await signInWithPopup(auth, yahooProvider)
    return result.user
}

export async function logout() {
    clearAll()
    await signOut(auth)
}

export async function hasUsername(uid) {
    const snapshot = await getDoc(doc(database, 'users', uid))
    return snapshot.exists() && !!snapshot.data().username
}

export async function isUsernameTaken(username) {
    const snapshot = await getDoc(doc(database, 'usernames', username.toLowerCase()))
    return snapshot.exists()
}

/**
 * Creates the initial user doc set (public profile + private data) and
 * reserves the chosen username — atomically and race-safe.
 *
 * Uses a transaction rather than a plain batch: the availability check
 * (isUsernameTaken, used for fast UX feedback before calling this) has a
 * TOCTOU race if two people submit the same username at once. The
 * transaction re-reads usernameRef as its *last* word before committing,
 * so the second writer always loses cleanly with UsernameTakenError
 * instead of silently overwriting the first writer's reservation.
 *
 * @throws {UsernameTakenError} if the username was claimed concurrently
 */
export async function createUser(uid, { email, displayName, username, photoURL = null }) {
    const normalizedUsername = username.toLowerCase()
    const usernameRef = doc(database, 'usernames', normalizedUsername)
    const publicUserRef = doc(database, 'users', uid)
    const privateDataRef = doc(database, 'users', uid, 'private', 'data')

    await runTransaction(database, async (transaction) => {
        const usernameSnap = await transaction.get(usernameRef)
        if (usernameSnap.exists()) {
            throw new UsernameTakenError(normalizedUsername)
        }

        transaction.set(usernameRef, { uid })

        transaction.set(publicUserRef, {
            uid,
            displayName,
            username: normalizedUsername,
            photoURL,
            bio: '',
            createdAt: serverTimestamp(),
        })

        transaction.set(privateDataRef, {
            email: email,
        })
    })
}
