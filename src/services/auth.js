import { auth, database, googleProvider, yahooProvider } from '@/utils/firebase'
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { signInWithPopup, signOut } from 'firebase/auth'
import { clearAll } from '@/utils/cache'

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

export async function createUser(uid, { email, displayName, username, photoURL = null }) {
    const batch = writeBatch(database)
    const usernameRef = doc(database, 'usernames', username.toLowerCase())
    const publicUserRef = doc(database, 'users', uid)
    const privateDataRef = doc(database, 'users', uid, 'private', 'data')

    batch.set(usernameRef, { uid })

    batch.set(publicUserRef, {
        uid,
        displayName,
        username: username.toLowerCase(),
        photoURL,
        bio: '',
        createdAt: serverTimestamp(),
    })

    batch.set(privateDataRef, {
        email: email,
    })

    await batch.commit()
}
