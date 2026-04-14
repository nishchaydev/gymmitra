/**
 * redis-cache.ts — GymMitra data cache layer on top of Upstash Redis
 *
 * Pattern: Redis-First
 *   GET  → check Redis → HIT: return immediately (zero DB calls)
 *                      → MISS: hit Supabase → store in Redis → return
 *   POST/PUT/DELETE → write to DB → invalidate Redis → return
 *
 * TTL strategy:
 *   - Hot read data (members, renewals, at-risk) → short TTL
 *   - Static config (plans, products, settings) → 30-day TTL, busted on write
 *   - Dashboard → 1 min (matches SSR revalidate = 60)
 *
 * All functions are fail-open: if Redis is down the app works normally.
 */

import { Redis } from '@upstash/redis'

// ── TTL constants (seconds) ────────────────────────────────────────────────
export const CACHE_TTL = {
  MEMBERS_LIST:       2 * 60,              // 2 min
  MEMBERS_AT_RISK:   15 * 60,              // 15 min
  RENEWALS:           5 * 60,              // 5 min
  INVOICES_LIST:      2 * 60,              // 2 min
  PLANS:             30 * 24 * 60 * 60,    // 30 DAYS — plans almost never change
  PRODUCTS:          30 * 24 * 60 * 60,    // 30 DAYS — product catalog rarely changes
  SETTINGS:          30 * 24 * 60 * 60,    // 30 DAYS — gym settings rarely change
  DASHBOARD_SUMMARY:  1 * 60,              // 1 min
} as const

// ── Singleton Redis client ─────────────────────────────────────────────────
let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!_redis) {
    _redis = Redis.fromEnv()
  }
  return _redis
}

// ── Low-level operations ───────────────────────────────────────────────────

export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null
  try {
    const val = await client.get<T>(key)
    return val ?? null
  } catch {
    return null // fail-open: treat as cache miss
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    await client.set(key, value, { ex: ttlSeconds })
  } catch {
    // fail-open
  }
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  const client = getRedis()
  if (!client || keys.length === 0) return
  try {
    await client.del(...keys)
  } catch {
    // fail-open
  }
}

// ── Redis-First helper ────────────────────────────────────────────────────
/**
 * getOrFetch — core Redis-First function.
 *
 * Flow: check Redis → HIT: return immediately (zero DB calls)
 *                   → MISS: call fetcher() → store in Redis → return
 *
 * Usage:
 *   const { data, fromCache } = await getOrFetch(
 *     cacheKey.renewals(gymId),
 *     CACHE_TTL.RENEWALS,
 *     () => prisma.memberSubscription.findMany({ ... })
 *   )
 */
export async function getOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; fromCache: boolean }> {
  const cached = await getCached<T>(key)
  if (cached !== null) {
    return { data: cached, fromCache: true }
  }

  const fresh = await fetcher()
  // Fire-and-forget: don't block the response while storing
  setCached(key, fresh, ttlSeconds).catch(() => {})

  return { data: fresh, fromCache: false }
}

// ── Gym-level cache bust ─────────────────────────────────────────────────
/**
 * Busts ALL Redis cache for a specific gym.
 * Called by the dashboard refresh button and after large mutations.
 * Uses SCAN to safely delete all keys matching gym:{gymId}:*
 */
export async function invalidateGymCache(gymId: string): Promise<number> {
  const client = getRedis()
  if (!client) return 0

  let deleted = 0
  let cursor = 0

  try {
    do {
      const [nextCursor, keys] = await client.scan(cursor, {
        match: `gym:${gymId}:*`,
        count: 100,
      })
      cursor = Number(nextCursor)

      if ((keys as string[]).length > 0) {
        await client.del(...(keys as string[]))
        deleted += (keys as string[]).length
      }
    } while (cursor !== 0)
  } catch {
    // fail-open
  }

  return deleted
}

// ── Cache key builders ────────────────────────────────────────────────────
export const cacheKey = {
  membersList:      (gymId: string, params: string) => `gym:${gymId}:members:list:${params}`,
  membersCount:     (gymId: string)                  => `gym:${gymId}:members:count`,
  renewals:         (gymId: string)                  => `gym:${gymId}:renewals`,
  atRisk:           (gymId: string, days: number)    => `gym:${gymId}:at-risk:${days}`,
  invoicesList:     (gymId: string, params: string)  => `gym:${gymId}:invoices:list:${params}`,
  plans:            (gymId: string)                  => `gym:${gymId}:plans`,
  products:         (gymId: string, params: string)  => `gym:${gymId}:products:${params}`,
  settings:         (gymId: string)                  => `gym:${gymId}:settings`,
  dashboardSummary: (gymId: string)                  => `gym:${gymId}:dashboard:summary`,
}
