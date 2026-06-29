/**
 * Paginator factory — cursor-based Firestore pagination with in-memory accumulation.
 *
 * Pages already fetched are kept in memory, so navigating backward costs zero
 * Firestore reads. Forward navigation only hits the database when the next page
 * hasn't been fetched yet.
 *
 * TanStack Query parallel: useInfiniteQuery
 *
 * Two render patterns:
 *   Prev / Next / Jump  →  render getPageItems()   (current page slice only)
 *   Show more           →  render getAllFetched()   (all accumulated items)
 *
 * Phase 2 migration: replace with useInfiniteQuery — queryFn signature is identical.
 *
 * @param {Object}   opts
 * @param {number}   [opts.pageSize=12]
 * @param {Function} opts.queryFn  — async (lastDoc) => { items, lastDoc, done }
 */
export function createPaginator({ pageSize = 12, queryFn }) {
    let allItems = []
    let lastDoc = null
    let _hasMore = true
    let currentPage = -1 // -1 = before first fetch; 0 = first page

    function getPageItems() {
        if (currentPage < 0) return []
        const start = currentPage * pageSize
        return allItems.slice(start, start + pageSize)
    }

    /**
     * Advance to the next page.
     * - If the page is already in memory, returns it instantly (no Firestore call).
     * - Otherwise fetches the next batch from Firestore via queryFn.
     */
    async function nextPage() {
        const nextIndex = currentPage + 1
        const nextStart = nextIndex * pageSize

        if (nextStart < allItems.length) {
            currentPage = nextIndex
            return getPageItems()
        }

        if (!_hasMore) return getPageItems()

        const { items, lastDoc: newLastDoc, done } = await queryFn(lastDoc)
        lastDoc = newLastDoc
        _hasMore = !done
        allItems.push(...items)
        currentPage = nextIndex
        return getPageItems()
    }

    /**
     * Go back one page. Always free — no Firestore read.
     */
    function prevPage() {
        if (currentPage <= 0) return getPageItems()
        currentPage--
        return getPageItems()
    }

    /**
     * Jump to any page by index (0-based).
     * - Pages already in memory are instant (no Firestore read).
     * - Pages beyond what's fetched are loaded sequentially and cached.
     */
    async function goToPage(targetPage) {
        if (targetPage < 0) return getPageItems()
        if (targetPage === currentPage) return getPageItems()

        // Already in memory — free
        if ((targetPage + 1) * pageSize <= allItems.length) {
            currentPage = targetPage
            return getPageItems()
        }

        // Fetch forward sequentially, caching each page along the way
        while (currentPage < targetPage && _hasMore) {
            const nextIndex = currentPage + 1
            const { items, lastDoc: newLastDoc, done } = await queryFn(lastDoc)
            lastDoc = newLastDoc
            _hasMore = !done
            allItems.push(...items)
            currentPage = nextIndex
        }

        return getPageItems()
    }

    /**
     * Reset all state. Call after mutations (add / delete / reorder) so the
     * next nextPage() re-fetches fresh data from Firestore.
     */
    function reset() {
        allItems = []
        lastDoc = null
        _hasMore = true
        currentPage = -1
    }

    return {
        nextPage,
        prevPage,
        goToPage,
        reset,
        getPageItems,
        appendItem(item) {
            allItems.push(item)
        },
        updateItem(id, patch) {
            const index = allItems.findIndex((item) => item.id === id)
            if (index !== -1) allItems[index] = { ...allItems[index], ...patch }
        },
        /**
         * Reorder the current page's slice in allItems to match the new visual
         * order after a drag-and-drop save. Also updates each item's `order`
         * field so backward navigation renders the correct sequence without a
         * Firestore re-fetch.
         *
         * @param {Array<{ id: string, order: number }>} orderedItems
         *   Items in their new positional order with freshly assigned `order` values.
         */
        reorderCurrentPage(orderedItems) {
            const start = currentPage * pageSize
            const lookup = Object.fromEntries(allItems.map((item) => [item.id, item]))
            orderedItems.forEach((reorderedItem, slotIndex) => {
                const existing = lookup[reorderedItem.id]
                if (existing) {
                    allItems[start + slotIndex] = { ...existing, order: reorderedItem.order }
                }
            })
        },
        /** All items fetched so far. Use with the "show more" pattern. */
        getAllFetched: () => [...allItems],
        /** True if Firestore has more pages beyond what's been fetched. */
        get hasMore() { return _hasMore },
        /** True if a next page exists — either in memory or in Firestore. */
        get hasNextPage() {
            return _hasMore || (currentPage + 1) * pageSize < allItems.length
        },
        /** True when the user is on the first page. */
        get isFirstPage() { return currentPage <= 0 },
        /** Current page index (0-based). -1 before the first fetch. */
        get currentPage() { return currentPage },
    }
}
