import { doc, getDocFromServer } from 'firebase/firestore' // Changed getDoc to getDocFromServer
import { database } from './firebase'

let connectionPromise = null

export default async function ping() {
    if (connectionPromise) return connectionPromise

    connectionPromise = (async () => {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firebase connection timed out')), 4000),
        )

        const networkRead = (async () => {
            const testRef = doc(database, '_status_', 'ping')
            // Forces Firestore to wait for a real server network handshake
            await getDocFromServer(testRef)
            return true
        })()

        try {
            await Promise.race([networkRead, timeout])
            console.log('Conneted to Firebase!')
            return true
        } catch (error) {
            connectionPromise = null // Reset cache on failure
            console.error('Ping error:', error)
            throw error
        }
    })()

    return connectionPromise
}
