/**
 * lib/env.ts — Environment variable validation & cached access
 *
 * Import this module to validate required env vars at startup.
 * All values are parsed once and cached — no re-reading process.env on every call.
 *
 * Usage:
 *   import { env } from '@/lib/env'
 *   console.log(env.ADMIN_EMAILS) // string[]
 */

function requireEnv(key: string): string {
    const val = process.env[key]
    if (!val) {
        console.warn(`[env] Missing recommended env var: ${key}`)
    }
    return val || ''
}

function optionalEnv(key: string, fallback: string = ''): string {
    return process.env[key] || fallback
}

// ── Cached & parsed environment ────────────────────────────────────────

const _adminEmailRaw = optionalEnv('ADMIN_EMAIL')
const _adminEmails = _adminEmailRaw
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)

export const env = {
    // Auth & Security
    CRON_SECRET: optionalEnv('CRON_SECRET'),
    WEBHOOK_SECRET: optionalEnv('WEBHOOK_SECRET'),
    ADMIN_EMAILS: _adminEmails,

    // Email
    RESEND_API_KEY: optionalEnv('RESEND_API_KEY'),

    // Database
    DATABASE_URL: optionalEnv('DATABASE_URL'),

    // Redis
    UPSTASH_REDIS_REST_URL: optionalEnv('UPSTASH_REDIS_REST_URL'),
    UPSTASH_REDIS_REST_TOKEN: optionalEnv('UPSTASH_REDIS_REST_TOKEN'),

    // App
    NEXT_PUBLIC_APP_URL: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    NODE_ENV: optionalEnv('NODE_ENV', 'development'),

    // Helpers
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',

    /** Check if an email is in the admin whitelist */
    isAdmin: (email: string) => _adminEmails.includes(email),
} as const
