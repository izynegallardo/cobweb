import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getCountFromServer,
    writeBatch,
    onSnapshot,
    increment,
    query as firestoreQuery,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
} from 'firebase/firestore'
import { database } from '@/utils/firebase'
import { query, invalidateWith } from '@/utils/cache'
import { getLinkIconUrl } from '@/utils/logodev'

export async function createLink(uid, { title, url }) {
    try {
        const ref = collection(database, 'users', uid, 'links')

        const snapshot = await getDocs(ref)
        const order = snapshot.size
        const icon = getLinkIconUrl(url)

        const docRef = await addDoc(ref, {
            userId: uid,
            title,
            url,
            icon,
            order,
            isActive: true,
            clickCount: 0,
            createdAt: serverTimestamp(),
        })

        invalidateWith(`user:links:`)

        return {
            id: docRef.id,
            userId: uid,
            title,
            url,
            icon,
            order,
            isActive: true,
            clickCount: 0,
        }
    } catch (error) {
        console.error('<error> Dashboard.createLink', error)
        throw error
    }
}

export function createLinkQueryFn(uid, pageSize) {
    return async (lastDoc) => {
        const ref = collection(database, 'users', uid, 'links')
        const constraints = [orderBy('order', 'asc'), limit(pageSize)]
        if (lastDoc) constraints.push(startAfter(lastDoc))

        const snap = await getDocs(firestoreQuery(ref, ...constraints))
        return {
            items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
            lastDoc: snap.docs.at(-1) ?? null,
            done: snap.docs.length < pageSize,
        }
    }
}

/**
 * Returns the total number of links for a user.
 * Uses Firestore's aggregate count — costs exactly 1 read regardless of
 * how many documents exist.
 *
 * @param {string} uid
 * @returns {Promise<number>}
 */
export async function getLinkCount(uid) {
    const ref = collection(database, 'users', uid, 'links')
    const snapshot = await getCountFromServer(ref)
    return snapshot.data().count
}

/**
 * Reorder links by writing new order values in a single batch.
 * Items is an array of { id, order } — only the documents being
 * reordered need to be included.
 *
 * @param {string} uid
 * @param {Array<{ id: string, order: number }>} items
 */
export async function reorderLinks(uid, items) {
    const batch = writeBatch(database)
    items.forEach(({ id, order }) => {
        const ref = doc(database, 'users', uid, 'links', id)
        batch.update(ref, { order })
    })
    await batch.commit()
    invalidateWith('user:links:')
}

// ── Helpers ─────────────────────────────────────────────

/**
 * Update editable fields on a link document.
 * Only touches the fields explicitly passed in — no accidental overwrites.
 *
 * @param {string} uid
 * @param {string} linkId
 * @param {{ title?: string, url?: string, isActive?: boolean }} fields
 */
export async function updateLinkData(uid, linkId, fields) {
    if (!uid) throw new Error('User UID is required.')
    if (!linkId) throw new Error('Link ID is required.')

    try {
        const ref = doc(database, 'users', uid, 'links', linkId)

        // Rebuild icon only when the URL is changing
        const patch = { ...fields }
        if (fields.url) patch.icon = getLinkIconUrl(fields.url)

        await updateDoc(ref, patch)
        invalidateWith('user:links:')
    } catch (error) {
        console.error('<error> Dashboard.updateLinkData:', error)
        throw error
    }
}

/**
 * Permanently remove a link document from Firestore.
 *
 * @param {string} uid
 * @param {string} linkId
 */
export async function deleteLinkData(uid, linkId) {
    if (!uid) throw new Error('User UID is required.')
    if (!linkId) throw new Error('Link ID is required.')

    try {
        const ref = doc(database, 'users', uid, 'links', linkId)
        await deleteDoc(ref)
        invalidateWith('user:links:')
    } catch (error) {
        console.error('<error> Dashboard.deleteLinkData:', error)
        throw error
    }
}

/**
 * Subscribe to real-time changes on a user's links collection.
 * Fires onChange only for modified documents — the initial ADDED snapshot
 * is intentionally ignored since we already have that data from the first fetch.
 *
 * Returns the Firestore unsubscribe function. Call it to tear down the listener.
 *
 * @param {string}   uid
 * @param {Function} onChange  (id: string, clickCount: number, isActive: boolean) => void
 * @returns {Function} unsubscribe
 */
export function subscribeToLinkClicks(uid, onChange) {
    const ref = collection(database, 'users', uid, 'links')
    return onSnapshot(ref, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type !== 'modified') return
            const data = change.doc.data()
            onChange(change.doc.id, data.clickCount ?? 0, data.isActive ?? true)
        })
    })
}
