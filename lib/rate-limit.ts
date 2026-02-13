import { LRUCache } from 'lru-cache'

type RateLimitOptions = {
    interval: number  // Time window in ms
    uniqueTokenPerInterval: number  // Max unique tokens
}

export function rateLimit(options: RateLimitOptions) {
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

                return isRateLimited ? reject(new Error('Rate limit exceeded')) : resolve()
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
