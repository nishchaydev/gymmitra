import { LRUCache } from 'lru-cache'
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export class RateLimitError extends Error {
    public retryAfter: number

    constructor(message: string, retryAfter: number) {
        super(message)
        Object.setPrototypeOf(this, RateLimitError.prototype)
        this.name = 'RateLimitError'
        this.retryAfter = retryAfter
    }
}

type RateLimitOptions = {
    interval: number  // Time window in ms
    uniqueTokenPerInterval?: number  // Max unique tokens (for LRU sizing)
}

export function rateLimit(options: RateLimitOptions) {
    const isRedisConfigured = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN
    const redis = isRedisConfigured ? Redis.fromEnv() : null

    if (redis) {
        const limiterCache = new Map<number, Ratelimit>()
        return {
            check: async (limit: number, token: string) => {
                let limiter = limiterCache.get(limit)
                if (!limiter) {
                    limiter = new Ratelimit({
                        redis: redis!,
                        limiter: Ratelimit.slidingWindow(limit, `${options.interval / 1000} s`),
                        analytics: true,
                        prefix: "@gym-mitra/rate-limit",
                    })
                    limiterCache.set(limit, limiter)
                }

                const { success, reset } = await limiter.limit(token)

                if (!success) {
                    const retryAfter = Math.max(1, Math.floor((reset - Date.now()) / 1000))
                    throw new RateLimitError('Rate limit exceeded', retryAfter)
                }
                return
            }
        }
    }

    const tokenCache = new LRUCache<string, number[]>({
        max: options.uniqueTokenPerInterval || 500,
        ttl: options.interval || 60000,
    })

    return {
        check: (limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const tokenCount = tokenCache.get(token) || [0]
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount)
                }
                tokenCount[0] += 1

                const currentUsage = tokenCount[0]
                const isRateLimited = currentUsage > limit

                if (isRateLimited) {
                    const fallbackRetry = Math.max(1, Math.floor(options.interval / 1000))
                    const error = new RateLimitError('Rate limit exceeded', fallbackRetry)
                    return reject(error)
                }
                return resolve()
            }),
    }
}

export const apiLimiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
})

export const whatsappLimiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100,
})
