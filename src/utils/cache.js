/**
 * Lightweight in-memory query cache — inspired by TanStack Query.
 *
 * TanStack Query parallel:
 *   query(key, fn, opts)   →  useQuery({ queryKey, queryFn, staleTime })
 *   invalidate(key)        →  queryClient.invalidateQueries({ queryKey })
 *   invalidateWith(prefix) →  queryClient.invalidateQueries({ queryKey: ['user'] })
 *   clearAll()             →  queryClient.clear()
 *
 * Phase 2 migration: replace query() calls with useQuery() hooks — the
 * queryKey strings and queryFn signatures stay identical.
 */

const store = new Map()

/**
 * Named TTL presets (in seconds). Import and use these when defining CACHE_KEYS
 * in service files so every key's lifetime is declared in one place.
 *
 * For one-off values, pass a plain number — staleTime: 30 means 30 seconds.
 *
 *   SHORT   — frequently changing data (click counts, notifications)
 *   DEFAULT — standard profile/user data
 *   LONG    — rarely changing data (app config, static lookups)
 *   SESSION — never auto-expires; lives until page refresh or explicit invalidation
 */
export const TTL = {
    SHORT:   60,       //  1 minute
    DEFAULT: 5 * 60,   //  5 minutes
    LONG:    30 * 60,  // 30 minutes
    SESSION: Infinity, // never auto-expires within the session
}

/**
 * Resolve a key definition to its string key and staleTime.
 * Accepts either a plain string (backwards compatible) or a { key, staleTime } object.
 */
function resolve(keyOrDef) {
    if (typeof keyOrDef === 'string') return { key: keyOrDef, staleTime: TTL.DEFAULT }
    return { key: keyOrDef.key, staleTime: keyOrDef.staleTime ?? TTL.DEFAULT }
}

/**
 * Fetch data with caching.
 *
 * If a fresh (non-stale) entry exists in the store, it is returned
 * immediately without invoking `fn`. Otherwise `fn` is called, its
 * result is stored, and then returned.
 *
 * @param {string|{key:string, staleTime:number}} keyOrDef - Plain key string or a CACHE_KEYS definition object
 * @param {Function} fn        - Async function that returns the data
 * @param {Object}   [opts]
 * @param {number}   [opts.staleTime] - Override the key definition's staleTime for this call only
 */
export async function query(keyOrDef, fn, opts = {}) {
    const { key, staleTime: definedStaleTime } = resolve(keyOrDef)
    const staleTime = opts.staleTime ?? definedStaleTime
    const entry = store.get(key)

    // Cache HIT: entry exists and hasn't expired → skip the network call
    if (entry && Date.now() < entry.expiresAt) {
        return entry.data
    }

    // Cache MISS: call the real fetch function and store the result
    const data = await fn()
    store.set(key, {
        data,
        // TTL.SESSION (Infinity) means never auto-expire — entry lives until
        // invalidate() is called or the page is refreshed (clearing the in-memory store).
        expiresAt: staleTime === Infinity ? Infinity : Date.now() + staleTime * 1000,
    })
    return data
}

/**
 * Immediately mark a single cache entry as stale.
 * The next query() call for this key will re-fetch from the source.
 *
 * Call this after a successful mutation (save/update/delete).
 *
 * @param {string|{key:string}} keyOrDef - Plain key string or a CACHE_KEYS definition object
 */
export function invalidate(keyOrDef) {
    const { key } = resolve(keyOrDef)
    store.delete(key)
}

/**
 * Invalidate all keys that start with a given prefix.
 *
 * Useful for clearing an entire entity's cache:
 *   invalidateWith('user:')  →  busts user:profile:uid, user:links:uid, etc.
 *
 * @param {string} prefix
 */
export function invalidateWith(prefix) {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key)
    }
}

/**
 * Wipe the entire cache.
 * Call this on logout so a new user never sees stale data from the previous session.
 */
export function clearAll() {
    store.clear()
}
