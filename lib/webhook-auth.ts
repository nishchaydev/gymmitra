/**
 * lib/webhook-auth.ts — Consolidated webhook/cron authentication
 *
 * Replaces 3 separate timing-safe comparison implementations across:
 * - app/api/cron/daily-reminders/route.ts
 * - app/api/cron/expire-subscriptions/route.ts
 * - app/api/webhooks/gym-activated/route.ts
 */

import crypto from 'crypto'
import { NextRequest } from 'next/server'

/**
 * Verify CRON_SECRET from Authorization header using timing-safe comparison.
 * Returns true if valid, false otherwise.
 */
export function verifyCronSecret(request: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
        console.error('[webhook-auth] CRON_SECRET not configured')
        return false
    }

    const authHeader = request.headers.get('authorization') || ''
    const expected = `Bearer ${cronSecret}`

    return timingSafeCompare(authHeader, expected, cronSecret)
}

/**
 * Verify x-webhook-secret header using timing-safe comparison.
 * Returns true if valid, false otherwise.
 */
export function verifyWebhookSecret(request: NextRequest): boolean {
    const webhookSecret = process.env.WEBHOOK_SECRET
    if (!webhookSecret) {
        console.error('[webhook-auth] WEBHOOK_SECRET not configured')
        return false
    }

    const provided = request.headers.get('x-webhook-secret') || ''
    return timingSafeCompare(provided, webhookSecret, webhookSecret)
}

/**
 * Constant-time comparison using HMAC digests to prevent length leakage.
 * Uses a shared key to normalize both values to fixed-length digests.
 */
function timingSafeCompare(a: string, b: string, key: string): boolean {
    if (!a || !b) return false
    try {
        const hmacA = crypto.createHmac('sha256', key).update(a).digest()
        const hmacB = crypto.createHmac('sha256', key).update(b).digest()
        return crypto.timingSafeEqual(hmacA, hmacB)
    } catch {
        return false
    }
}
