import {
    collection,
    doc,
    addDoc,
    updateDoc,
    increment,
    getDocs,
    getCountFromServer,
    query as firestoreQuery,
    orderBy,
    where,
    limit,
    startAfter,
    serverTimestamp,
} from 'firebase/firestore'
import { CACHE_KEYS } from '@/configs/cache-keys'
import { database } from '@/utils/firebase'
import { query } from '@/utils/cache'
import { getLinkIconUrl } from '@/utils/logodev'

export async function getCurrentUserLinks(uid) {
    return query(CACHE_KEYS.links(uid), async () => {
        const ref = collection(database, 'users', uid, 'links')
        const q = firestoreQuery(ref, orderBy('order', 'asc'))
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    })
}

/**
 * Returns a queryFn compatible with createPaginator.
 *
 * Usage:
 *   const paginator = createPaginator({
 *       pageSize: PAGE_SIZE,
 *       queryFn: createLinkQueryFn(uid, PAGE_SIZE),
 *   })
 *
 * @param {string} uid
 * @param {number} pageSize
 * @returns {Function} async (lastDoc) => { items, lastDoc, done }
 */
/**
 * Public variant — filters to isActive === true only.
 * Use this on the public /{username} page so unauthenticated visitors
 * never receive inactive links, and the Firestore `list: if true` rule
 * stays safe (the query itself enforces the active-only constraint).
 *
 * @param {string} uid
 * @param {number} pageSize
 * @returns {Function} async (lastDoc) => { items, lastDoc, done }
 */
export function createPublicLinkQueryFn(uid, pageSize) {
    return async (lastDoc) => {
        const ref = collection(database, 'users', uid, 'links')
        const constraints = [
            where('isActive', '==', true),
            orderBy('order', 'asc'),
            limit(pageSize),
        ]
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
 * Count of active (public) links only.
 * Costs 1 Firestore read regardless of document count.
 *
 * @param {string} uid
 * @returns {Promise<number>}
 */
export async function getPublicLinkCount(uid) {
    const ref = collection(database, 'users', uid, 'links')
    const q = firestoreQuery(ref, where('isActive', '==', true))
    const snapshot = await getCountFromServer(q)
    return snapshot.data().count
}

/**
 * Atomically increment a link's click counter by 1.
 * Called fire-and-forget from the public profile page.
 * Never throws to the caller — a failed write should never block navigation.
 *
 * @param {string} uid
 * @param {string} linkId
 */
export async function incrementLinkClick(uid, linkId) {
    const ref = doc(database, 'users', uid, 'links', linkId)
    await updateDoc(ref, { clickCount: increment(1) })
}

// ── Helpers ──────────────────────────────────────────────
