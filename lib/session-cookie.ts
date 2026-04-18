/**
 * session-cookie.ts — HMAC-signed gym session cookie
 *
 * Security: The gym_session cookie controls trial/onboarding enforcement
 * in middleware. Since cookies are client-writable, we HMAC-sign the payload
 * to detect tampering. If the signature doesn't match, middleware treats it
 * as a cache miss and redirects to /api/auth/sync-cookie to re-derive from DB.
 *
 * Format: base64(JSON) + '.' + hmac_hex
 */

import { createHmac } from 'crypto'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GymSessionPayload {
    saasPlan: string
    trialExpiresAt: string | null
    isVerified: boolean
    onboardingStep: number
}

// ── HMAC Signing ─────────────────────────────────────────────────────────────

const COOKIE_NAME = 'gym_session'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

/**
 * Get the HMAC secret. Falls back to NEXTAUTH_SECRET, then a development-only default.
 * In production, GYM_SESSION_SECRET MUST be set.
 */
function getSecret(): string {
    const secret = process.env.GYM_SESSION_SECRET || process.env.NEXTAUTH_SECRET
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            console.error('[session-cookie] CRITICAL: GYM_SESSION_SECRET is not set in production!')
        }
        // Dev fallback — never use in production
        return 'dev-only-gym-session-secret-DO-NOT-USE-IN-PROD'
    }
    return secret
}

/** Sign a payload with HMAC-SHA256. Returns: base64(json).hmac_hex */
function sign(payload: GymSessionPayload): string {
    const json = JSON.stringify(payload)
    const encoded = Buffer.from(json).toString('base64')
    const hmac = createHmac('sha256', getSecret()).update(encoded).digest('hex')
    return `${encoded}.${hmac}`
}

/** Verify and parse a signed cookie. Returns null if tampered or malformed. */
function verify(raw: string): GymSessionPayload | null {
    const dotIdx = raw.lastIndexOf('.')
    if (dotIdx === -1) return null

    const encoded = raw.slice(0, dotIdx)
    const providedHmac = raw.slice(dotIdx + 1)

    const expectedHmac = createHmac('sha256', getSecret()).update(encoded).digest('hex')

    // Timing-safe comparison to prevent timing attacks
    if (providedHmac.length !== expectedHmac.length) return null
    const a = Buffer.from(providedHmac, 'hex')
    const b = Buffer.from(expectedHmac, 'hex')
    if (a.length !== b.length) return null

    // Use timingSafeEqual for constant-time comparison
    const { timingSafeEqual } = require('crypto')
    if (!timingSafeEqual(a, b)) return null

    try {
        const json = Buffer.from(encoded, 'base64').toString('utf-8')
        return JSON.parse(json) as GymSessionPayload
    } catch {
        return null
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create the signed cookie value from gym data.
 * Use this everywhere you set the gym_session cookie.
 */
export function createSignedSessionValue(data: GymSessionPayload): string {
    return sign(data)
}

/**
 * Parse and verify a signed gym_session cookie value.
 * Returns null if the cookie is missing, tampered, or malformed.
 */
export function parseSignedSession(rawCookieValue: string | undefined): GymSessionPayload | null {
    if (!rawCookieValue) return null
    return verify(rawCookieValue)
}

/**
 * Helper: set the signed gym_session cookie via Next.js cookies() API.
 * Call this from server actions, route handlers, etc.
 */
export async function setGymSessionCookie(data: GymSessionPayload): Promise<void> {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const isLocal = process.env.NODE_ENV !== 'production'

    cookieStore.set(COOKIE_NAME, createSignedSessionValue(data), {
        maxAge: COOKIE_MAX_AGE,
        path: '/',
        secure: !isLocal,
        sameSite: 'lax',
        httpOnly: true, // Prevent JS access — extra security
    })
}

/**
 * Helper: build the GymSessionPayload from a gym-like object.
 * Works with Prisma GymProfile, staff gym, or any object with these fields.
 */
export function buildSessionPayload(gym: {
    saasPlan: string
    trialExpiresAt: Date | string | null
    isVerified: boolean
    onboardingStep: number
}): GymSessionPayload {
    return {
        saasPlan: gym.saasPlan,
        trialExpiresAt: gym.trialExpiresAt
            ? (typeof gym.trialExpiresAt === 'string' ? gym.trialExpiresAt : gym.trialExpiresAt.toISOString())
            : null,
        isVerified: gym.isVerified,
        onboardingStep: gym.onboardingStep,
    }
}

// Re-export constants
export { COOKIE_NAME, COOKIE_MAX_AGE }
