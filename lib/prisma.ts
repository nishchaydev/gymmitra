import { PrismaClient } from '@prisma/client'

const SOFT_DELETE_MODELS = ['Member', 'Invoice', 'GymProfile', 'MemberSubscription', 'Sale']

function withSslMode(url: string): string {
  try {
    const u = new URL(url)
    if (!u.searchParams.get('sslmode')) u.searchParams.set('sslmode', 'require')
    return u.toString()
  } catch {
    return url
  }
}

function buildDirectSupabaseUrlFromPooler(databaseUrl: string): string | null {
  try {
    const u = new URL(databaseUrl)
    // IMPORTANT: URL.username / URL.password are already normalized; do not double-decode.
    // Preserve credentials exactly to avoid auth failures on derived URLs.
    const username = u.username || ''
    const password = u.password || ''
    const database = (u.pathname || '/').replace(/^\//, '') || 'postgres'

    const refFromUser = username.startsWith('postgres.') ? username.slice('postgres.'.length) : null
    const refFromSiteUrl = (() => {
      const site = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!site) return null
      try {
        const su = new URL(site)
        const host = su.hostname || ''
        // e.g. lguifuhryubjzxrayoiu.supabase.co → ref is first label
        const ref = host.split('.')[0]
        return ref || null
      } catch {
        return null
      }
    })()

    const ref = refFromUser || refFromSiteUrl
    if (!ref) return null

    // NOTE: We previously attempted to derive the direct DB host (db.<ref>.supabase.co),
    // but runtime evidence showed auth failures with current credentials.
    // Keep this helper around, but do not use it by default.
    const directHost = `db.${ref}.supabase.co`
    const direct = new URL(`postgresql://@${directHost}:5432/${database}`)
    direct.username = username
    direct.password = password
    direct.search = u.search
    direct.searchParams.delete('pgbouncer')
    return withSslMode(direct.toString())
  } catch {
    return null
  }
}

function normalizeSupabaseDirectUrl(url: string): string {
  try {
    const u = new URL(url)
    // Keep DIRECT_URL as-is; just ensure SSL and remove pgbouncer flag if present.
    u.searchParams.delete('pgbouncer')
    return withSslMode(u.toString())
  } catch {
    return withSslMode(url)
  }
}

function pickPrismaUrl(): { url: string; reason: string; host: string | null } {
  const rawDb = process.env.DATABASE_URL || ''
  const rawDirect = process.env.DIRECT_URL || ''

  const db = rawDb ? withSslMode(rawDb) : ''
  const direct = rawDirect ? withSslMode(rawDirect) : ''

  const getHost = (v: string) => {
    try {
      return new URL(v).hostname
    } catch {
      return null
    }
  }

  const dbHost = getHost(db)
  const directHost = getHost(direct)
  const describe = (v: string) => {
    try {
      const u = new URL(v)
      return { host: u.hostname || null, port: u.port || null }
    } catch {
      return { host: null, port: null }
    }
  }

  // In local dev, prefer DIRECT_URL when present (commonly port 5432).
  // Only derive a db.<ref>.supabase.co URL when DIRECT_URL is missing.
  const isPooler = (h: string | null) => (h || '').includes('pooler.supabase.com')

  if (process.env.NODE_ENV !== 'production') {
    if (direct) {
      // In dev, prefer DIRECT_URL exactly as configured (port 5432 in Supabase),
      // because the pooler (6543) can be unreachable on some networks.
      const normalized = normalizeSupabaseDirectUrl(direct)
      return { url: normalized, reason: 'dev:using normalized DIRECT_URL', host: getHost(normalized) }
    }
    // Do not derive db.<ref>.supabase.co automatically; it can fail auth depending on credentials.
  }

  if (db) return { url: db, reason: 'default:using DATABASE_URL', host: dbHost }
  if (direct) return { url: direct, reason: 'fallback:using DIRECT_URL', host: directHost }
  return { url: '', reason: 'missing DATABASE_URL/DIRECT_URL', host: null }
}

function createPrismaClient(): PrismaClient {
  const picked = pickPrismaUrl()



  const client = new PrismaClient(
    picked.url
      ? {
        datasources: {
          db: { url: picked.url }
        }
      }
      : undefined
  )

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
