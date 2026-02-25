import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Retries a database operation (like a Serializable transaction) on serialization failure (P2034)
 * with exponential backoff.
 */
export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let attempts = 0
  while (true) {
    attempts++
    try {
      return await fn()
    } catch (error: any) {
      if (error?.code === 'P2034' && attempts < maxAttempts) {
        // Exponential backoff: 100ms, 200ms, ...
        const delay = attempts * 100 + Math.random() * 50
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}
