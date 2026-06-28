import { TTL } from '@/utils/cache'

// ── Cache key factory ─────────────────────────────────────────────────────────
//
// Centralising key names here prevents typos across files.
// When you migrate to TanStack Query in Phase 2, these become your queryKey arrays:
//   CACHE_KEYS.profile(uid)  →  ['user', 'profile', uid]
//
export const CACHE_KEYS = {
    profile: (uid) => ({ key: `user:profile:${uid}`, staleTime: TTL.DEFAULT }),
    publicProfile: (username) => ({ key: `public:profile:${username}`, staleTime: TTL.SHORT }),
    links: (uid) => ({ key: `user:links:${uid}`, staleTime: TTL.SHORT }),
    publicLinks: (uid) => ({ key: `user:links:public:${uid}`, staleTime: TTL.SHORT }),
    // analytics: (uid) => ({ key: `user:analytics:${uid}`, staleTime: TTL.SHORT }),
}
