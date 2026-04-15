/**
 * lib/email.ts — Centralized email gateway for GymMitra ERP
 *
 * Single Resend instance, single FROM address, single entry point.
 * Replaces 5 separate `new Resend()` instantiations across the codebase.
 *
 * All functions are fail-open: email failures never crash the caller.
 */

import { Resend, type CreateEmailOptions } from 'resend'

// ── Constants ──────────────────────────────────────────────────────────
export const FROM_EMAIL = 'GymMitra <hello@mail.emitra.dev>'
const BATCH_SIZE = 100 // Resend API limit per batch call

// ── Singleton ──────────────────────────────────────────────────────────
let _resend: Resend | null = null

function getResend(): Resend | null {
    const key = process.env.RESEND_API_KEY
    if (!key) return null
    if (!_resend) {
        _resend = new Resend(key)
    }
    return _resend
}

// ── Single email ───────────────────────────────────────────────────────
export async function sendEmail(
    options: CreateEmailOptions
): Promise<{ id?: string; error?: string }> {
    const resend = getResend()
    if (!resend) {
        console.warn('[email] RESEND_API_KEY not configured — skipping email')
        return { error: 'RESEND_API_KEY not configured' }
    }

    try {
        const { data, error } = await resend.emails.send({
            ...options,
            from: options.from || FROM_EMAIL,
        })

        if (error) {
            console.error('[email] Send failed:', error)
            return { error: error.message }
        }

        return { id: data?.id }
    } catch (e: any) {
        console.error('[email] Send exception:', e)
        return { error: e.message || 'Unknown email error' }
    }
}

// ── Batch email ────────────────────────────────────────────────────────
export interface BatchResult {
    sent: number
    failed: number
    results: Array<{ id?: string; error?: string }>
}

export async function sendBatch(
    emails: CreateEmailOptions[]
): Promise<BatchResult> {
    const resend = getResend()
    if (!resend || emails.length === 0) {
        return { sent: 0, failed: 0, results: [] }
    }

    let sent = 0
    let failed = 0
    const results: Array<{ id?: string; error?: string }> = []

    // Fill in FROM_EMAIL default for all emails
    const prepared = emails.map(e => ({
        ...e,
        from: e.from || FROM_EMAIL,
    }))

    const chunkCount = Math.ceil(prepared.length / BATCH_SIZE)

    for (let i = 0; i < chunkCount; i++) {
        const chunk = prepared.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)

        try {
            const response = await resend.batch.send(chunk)

            if (response.error) {
                console.error('[email] Batch error:', response.error)
                failed += chunk.length
                chunk.forEach(() => results.push({ error: response.error?.message || 'Batch error' }))
            } else if (response.data?.data) {
                response.data.data.forEach((result: any) => {
                    if (!result || result.error || !result.id) {
                        failed++
                        results.push({ error: result?.error || 'No ID returned' })
                    } else {
                        sent++
                        results.push({ id: result.id })
                    }
                })
            }
        } catch (e: any) {
            console.error('[email] Batch exception:', e)
            failed += chunk.length
            chunk.forEach(() => results.push({ error: e.message || 'Exception' }))
        }
    }

    return { sent, failed, results }
}
