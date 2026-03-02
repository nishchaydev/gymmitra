import { PrismaClient } from '@prisma/client'

const SOFT_DELETE_MODELS = ['Member', 'Invoice', 'GymProfile']

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient()

  // ── Soft-Delete Middleware ──────────────────────────────────────────
  // Intercepts queries on Member and Invoice to:
  // 1. Auto-filter out soft-deleted records on reads
  // 2. Convert delete operations to updates setting deletedAt

  // READ middleware: auto-filter deletedAt = null
  client.$use(async (params, next) => {
    if (params.model && SOFT_DELETE_MODELS.includes(params.model)) {
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        // findUnique → findFirst so we can add deletedAt filter
        params.action = 'findFirst'
        params.args.where = { ...params.args.where, deletedAt: null }
      }
      if (params.action === 'findMany') {
        if (!params.args) params.args = {}
        if (!params.args.where) params.args.where = {}
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null
        }
      }
      if (params.action === 'count' || params.action === 'aggregate' || params.action === 'groupBy') {
        if (!params.args) params.args = {}
        if (!params.args.where) params.args.where = {}
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null
        }
      }
    }
    return next(params)
  })

  // DELETE middleware: convert to soft-delete
  client.$use(async (params, next) => {
    if (params.model && SOFT_DELETE_MODELS.includes(params.model)) {
      if (params.model === 'GymProfile' && (params.action === 'delete' || params.action === 'deleteMany')) {
        const queryWhere = params.args?.where || {}

        // Find exactly which gyms are targeted by this delete/deleteMany
        const targetedGyms = await client.gymProfile.findMany({
          where: queryWhere,
          select: { id: true },
        })
        const targetedGymIds = targetedGyms.map(g => g.id)

        if (targetedGymIds.length > 0) {
          const invoices = await client.invoice.findFirst({
            where: {
              gymId: { in: targetedGymIds },
              deletedAt: null
            }
          })
          if (invoices) {
            throw new Error('Cannot delete GymProfile with existing invoices')
          }
        }
      }
      if (params.action === 'delete') {
        params.action = 'update'
        params.args.data = { deletedAt: new Date() }
      }
      if (params.action === 'deleteMany') {
        params.action = 'updateMany'
        if (!params.args) params.args = {}
        params.args.data = { deletedAt: new Date() }
      }
    }
    return next(params)
  })

  return client
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Retries a database operation (like a Serializable transaction) on serialization failure (P2034)
 * with linear backoff plus jitter.
 */
export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let attempts = 0
  while (true) {
    attempts++
    try {
      return await fn()
    } catch (error: any) {
      if (error?.code === 'P2034' && attempts < maxAttempts) {
        // Linear backoff with jitter: 100ms, 200ms, 300ms...
        const delay = attempts * 100 + Math.random() * 50
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}
