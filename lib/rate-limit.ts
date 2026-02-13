import { LRUCache } from 'lru-cache'
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

type RateLimitOptions = {
    interval: number  // Time window in ms
    uniqueTokenPerInterval: number  // Max unique tokens
}

// In-memory fallback for development or missing Redis credentials
const localCache = new Map<string, Ratelimit>()

export function rateLimit(options: RateLimitOptions) {
    const isRedisConfigured = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

    // Use Upstash Redis for distributed environments (Production)
    if (isRedisConfigured) {
        const redis = Redis.fromEnv()
        const limiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(options.uniqueTokenPerInterval, `${options.interval / 1000} s`),
            analytics: true,
            prefix: "@gym-mitra/rate-limit",
        })

        return {
            check: async (limit: number, token: string) => {
                const { success, limit: totalLimit, remaining, reset } = await limiter.limit(token)
                if (!success) {
                    const error = new Error('Rate limit exceeded') as any
                    error.retryAfter = Math.floor((reset - Date.now()) / 1000)
                    throw error
                }
            }
        }
    }

    // Local LRU Fallback for Development
    const tokenCache = new LRUCache<string, number[]>({
        max: options.uniqueTokenPerInterval || 500,
        ttl: options.interval || 60000,
    })

    return {
        check: (limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                // We use a single-element array [count] to act as a mutable reference 
                // stored in tokenCache. This allows us to increment the counter via 
                // tokenCount[0]++ without having to call tokenCache.set() again, 
                // effectively updating the cached value in place.
                const tokenCount = tokenCache.get(token) || [0]
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount)
                }
                tokenCount[0] += 1

                const currentUsage = tokenCount[0]
                const isRateLimited = currentUsage > limit

                if (isRateLimited) {
                    const error = new Error('Rate limit exceeded') as any
                    error.retryAfter = 60 // Default fallback for local
                    return reject(error)
                }
                return resolve()
            }),
    }
}

// Create limiters
export const apiLimiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
})

export const whatsappLimiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100,
})
