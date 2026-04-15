/**
 * lib/with-gym-auth.ts — Unified API route middleware for GymMitra
 *
 * Replaces the 8-step boilerplate copy-pasted across 23+ route handlers:
 *   IP extraction → rate limit → Supabase auth → gym lookup → role check → handler
 *
 * Usage:
 *   export const GET = withGymAuth(async ({ gym, userId, ip, request }) => {
 *       const data = await prisma.member.findMany({ where: { gymId: gym.id } })
 *       return NextResponse.json({ data })
 *   }, { rateLimit: 100, roles: ['OWNER', 'MANAGER'] })
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthGym, checkRole, type AuthContext } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { getIsDemo } from '@/lib/demo'
import { isAppError } from '@/lib/errors'

// ── Types ──────────────────────────────────────────────────────────────

export interface GymAuthContext {
    gym: AuthContext['gym']
    userId: string
    role: AuthContext['role']
    staffId?: string
    ip: string
    request: NextRequest
}

export interface GymAuthOptions {
    /** Rate limit per minute. Default: 60 */
    rateLimit?: number
    /** Rate limit key suffix. Default: route path */
    rateLimitKey?: string
    /** Allowed roles. If omitted, any authenticated role is allowed */
    roles?: string[]
    /** If true, allows demo mode and calls demoHandler when in demo mode */
    allowDemo?: boolean
}

type RouteHandler = (ctx: GymAuthContext) => Promise<NextResponse>
type DemoAwareHandler = (
    ctx: GymAuthContext
) => Promise<NextResponse>

// ── IP extraction (reusable) ───────────────────────────────────────────
export function extractIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const real = request.headers.get('x-real-ip')
    const raw = real || forwarded || '127.0.0.1'
    return raw.split(',')[0].trim() || '127.0.0.1'
}

// ── Main middleware ────────────────────────────────────────────────────

/**
 * Wraps an API route handler with auth, rate limiting, and role checks.
 * Eliminates the repeated boilerplate across all route files.
 */
export function withGymAuth(
    handler: RouteHandler,
    options: GymAuthOptions = {}
) {
    const {
        rateLimit: limit = 60,
        rateLimitKey,
        roles,
    } = options

    return async (request: NextRequest, routeContext?: any): Promise<NextResponse> => {
        try {
            const ip = extractIp(request)

            // 1. Auth
            const auth = await getAuthGym()
            if (!auth) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            // 2. Role check
            if (roles && roles.length > 0) {
                const roleResult = checkRole(auth, roles)
                if (roleResult) return roleResult
            }

            // 3. Rate limit
            const key = rateLimitKey || `${auth.userId}:${request.nextUrl.pathname}`
            const rl = await guardRateLimit(limit, key)
            if (rl) return rl

            // 4. Execute handler
            return await handler({
                gym: auth.gym,
                userId: auth.userId,
                role: auth.role,
                staffId: auth.staffId,
                ip,
                request,
            })
        } catch (error: any) {
            // Structured error response for AppErrors
            if (isAppError(error)) {
                return NextResponse.json(
                    { error: error.message, code: error.code },
                    { status: error.statusCode }
                )
            }

            // Zod validation errors
            if (error?.name === 'ZodError') {
                return NextResponse.json(
                    { error: 'Validation failed', details: error.errors },
                    { status: 400 }
                )
            }

            console.error(`[API] ${request.nextUrl.pathname} error:`, {
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3).join('\n'),
            })
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }
    }
}

/**
 * Variant that supports demo mode.
 * When demo mode is active, calls demoHandler instead of the main handler.
 */
export function withGymAuthOrDemo(
    handler: RouteHandler,
    demoHandler: (request: NextRequest) => Promise<NextResponse>,
    options: GymAuthOptions = {}
) {
    const {
        rateLimit: limit = 60,
        rateLimitKey,
        roles,
    } = options

    return async (request: NextRequest, routeContext?: any): Promise<NextResponse> => {
        try {
            const { searchParams } = new URL(request.url)
            const auth = await getAuthGym()
            const slug = (searchParams.get('slug') || auth?.gym?.slug) || undefined
            const isDemo = await getIsDemo(slug)

            // Demo mode — rate limit then return mock data
            if (isDemo) {
                const ip = extractIp(request)
                const demoKey = `demo:${ip}:${request.nextUrl.pathname}`
                const rl = await guardRateLimit(limit, demoKey)
                if (rl) return rl
                return await demoHandler(request)
            }

            // Not demo — require auth
            if (!auth) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            // Role check
            if (roles && roles.length > 0) {
                const roleResult = checkRole(auth, roles)
                if (roleResult) return roleResult
            }

            // Rate limit
            const ip = extractIp(request)
            const key = rateLimitKey || `${auth.userId}:${request.nextUrl.pathname}`
            const rl = await guardRateLimit(limit, key)
            if (rl) return rl

            return await handler({
                gym: auth.gym,
                userId: auth.userId,
                role: auth.role,
                staffId: auth.staffId,
                ip,
                request,
            })
        } catch (error: any) {
            if (isAppError(error)) {
                return NextResponse.json(
                    { error: error.message, code: error.code },
                    { status: error.statusCode }
                )
            }
            if (error?.name === 'ZodError') {
                return NextResponse.json(
                    { error: 'Validation failed', details: error.errors },
                    { status: 400 }
                )
            }
            console.error(`[API] ${request.nextUrl.pathname} error:`, {
                message: error.message,
            })
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }
    }
}
