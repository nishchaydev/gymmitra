'use server'

import { prisma, withRetry } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { addDays } from 'date-fns'
import { getBaseUrl } from '@/lib/utils'
import { sendWhatsAppTemplate } from '@/lib/whatsapp'
import { encryptPassword } from '@/lib/crypto'
import { apiLimiter } from '@/lib/rate-limit'
import { sendEmail, FROM_EMAIL } from '@/lib/email'
import { env } from '@/lib/env'

// ── XSS Prevention ──────────────────────────────────────────────────
function escapeHtml(unsafe: string): string {
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

const trialSchema = z.object({
    gymName: z.string().min(2, 'Gym name is required'),
    ownerName: z.string().min(2, 'Owner name is required'),
    email: z.string().email('Valid email required'),
    phone: z.string().regex(/^\d{10}$/, 'Enter 10-digit mobile number'),
    city: z.string().min(2, 'City is required'),
    approxMembers: z.coerce.number().int().min(1).max(10000).optional(),
})

function toSlug(text: string): string {
    return (
        text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'gym'
    )
}

type TrialResult =
    | { success: true; slug: string; tempPassword?: string }
    | { success: false; error: string }

// ══════════════════════════════════════════════════════════════════════
// Shared Gym Factory — single source of truth for trial provisioning
// ══════════════════════════════════════════════════════════════════════

interface GymFactoryInput {
    gymName: string
    ownerName: string
    email: string
    phone: string
    city: string
    password: string
    emailRedirectUrl: string
}

/**
 * Core provisioning logic. Both self-serve and admin flows call this.
 * Handles: validation → duplicate check → auth → DB → cleanup on failure
 */
async function provisionGym(input: GymFactoryInput): Promise<{
    slug: string
    userId: string
    trialExpiresAt: Date
}> {
    const email = input.email.toLowerCase().trim()
    const normalizedPhone = input.phone.replace(/\D/g, '').slice(-10)

    // 1. Duplicate check — phone first (primary anti-abuse gate), then email
    const existingByPhone = await withRetry(() => prisma.gymProfile.findFirst({
        where: { phone: normalizedPhone, deletedAt: null },
    }))
    if (existingByPhone) {
        throw new ProvisioningError('This phone number is already registered. Please login instead.')
    }

    const existingByEmail = await withRetry(() => prisma.gymProfile.findFirst({
        where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
    }))
    if (existingByEmail) {
        throw new ProvisioningError('This email is already registered. Please login instead.')
    }

    // 2. Create Supabase user
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: input.password,
        options: { emailRedirectTo: input.emailRedirectUrl },
    })

    if (authError || !authData.user) {
        throw new ProvisioningError(authError?.message || 'Failed to create account.')
    }

    const userId = authData.user.id

    // 3. Generate slug + create GymProfile
    const baseSlug = toSlug(input.gymName)
    const suffix = randomBytes(2).toString('hex')
    const slug = `${baseSlug}-${suffix}`
    const trialExpiresAt = addDays(new Date(), 30)

    try {
        await prisma.gymProfile.create({
            data: {
                name: input.gymName,
                businessName: input.gymName,
                ownerName: input.ownerName,
                slug,
                email,
                phone: input.phone,
                city: input.city,
                userId,
                isVerified: false,
                onboardingStep: 0,
                saasPlan: 'TRIAL',
                planTier: 'TRIAL',
                trialExpiresAt,
                tempPassword: null,
            },
        })
    } catch (dbError) {
        console.error('[GymFactory] Failed to create GymProfile:', dbError)
        // Cleanup orphaned Supabase user
        try {
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
            if (serviceKey) {
                const adminAuthClient = createServiceClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    serviceKey
                )
                await adminAuthClient.auth.admin.deleteUser(userId)
            } else {
                console.error('[GymFactory] Missing SUPABASE_SERVICE_ROLE_KEY')
            }
        } catch (cleanupError) {
            console.error('[GymFactory] Failed to cleanup orphaned Auth user:', cleanupError)
        }
        throw new ProvisioningError('Failed to create gym profile. Please try again.')
    }

    return { slug, userId, trialExpiresAt }
}

/** Typed error for provisioning failures */
class ProvisioningError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ProvisioningError'
    }
}

// ══════════════════════════════════════════════════════════════════════
// Public: Self-serve trial signup
// ══════════════════════════════════════════════════════════════════════

export async function createTrialGym(raw: {
    gymName: string
    ownerName: string
    email: string
    phone: string
    city: string
    approxMembers?: number
}): Promise<TrialResult> {
    // 1. Validate
    const parsed = trialSchema.safeParse(raw)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }
    const data = parsed.data

    try {
        await apiLimiter.check(5, `create-trial-gym:${data.phone.replace(/\D/g, '').slice(-10)}`)
    } catch {
        return { success: false, error: 'Too many trial requests from this phone number. Please try again later.' }
    }

    // 2. Get origin for redirect
    const headerList = await headers()
    const host = headerList.get('host')
    const protocol = headerList.get('x-forwarded-proto') || 'https'
    const origin = `${protocol}://${host}`

    try {
        const autoPassword = randomBytes(6).toString('base64url')
        const { slug } = await provisionGym({
            gymName: data.gymName,
            ownerName: data.ownerName,
            email: data.email,
            phone: data.phone,
            city: data.city,
            password: autoPassword,
            emailRedirectUrl: `${origin}/auth/callback`,
        })

        // Admin notification (non-blocking)
        sendAdminNotification({
            ownerName: data.ownerName,
            gymName: data.gymName,
            email: data.email.toLowerCase().trim(),
            phone: data.phone,
            city: data.city,
            slug,
        }).catch(() => { /* swallow — non-critical */ })

        return { success: true, slug }
    } catch (e) {
        if (e instanceof ProvisioningError) {
            return { success: false, error: e.message }
        }
        console.error('[Trial Signup] Unexpected error:', e)
        return { success: false, error: 'An unexpected error occurred. Please try again.' }
    }
}

// ══════════════════════════════════════════════════════════════════════
// Public: Admin-only manual onboard
// ══════════════════════════════════════════════════════════════════════

export async function adminCreateTrialGym(raw: {
    gymName: string
    ownerName: string
    email: string
    phone: string
    city: string
    approxMembers?: number
}): Promise<
    | { success: true; slug: string; tempPassword: string }
    | { success: false; error: string }
> {
    // Admin auth gate
    const supabaseClient = await createClient()
    const { data: { user: adminUser } } = await supabaseClient.auth.getUser()
    if (!adminUser || !env.isAdmin(adminUser.email ?? '')) {
        return { success: false, error: 'Unauthorized: Admin access only' }
    }

    const parsed = trialSchema.safeParse(raw)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }
    const data = parsed.data

    try {
        const tempPassword = randomBytes(4).toString('hex')
        const { slug, trialExpiresAt } = await provisionGym({
            gymName: data.gymName,
            ownerName: data.ownerName,
            email: data.email,
            phone: data.phone,
            city: data.city,
            password: tempPassword,
            emailRedirectUrl: `${getBaseUrl()}/auth/callback`,
        })

        // Welcome email (non-blocking)
        sendWelcomeEmail({
            ownerName: data.ownerName,
            gymName: data.gymName,
            email: data.email.toLowerCase().trim(),
            slug,
            resetUrl: `${getBaseUrl()}/forgot-password`,
            trialExpiresAt,
        }).catch(() => { })

        return { success: true, slug, tempPassword }
    } catch (e) {
        if (e instanceof ProvisioningError) {
            return { success: false, error: e.message }
        }
        console.error('[Admin Trial Signup] Unexpected error:', e)
        return { success: false, error: 'Failed to create gym profile.' }
    }
}

// ══════════════════════════════════════════════════════════════════════
// Email helpers — now use centralized lib/email.ts
// ══════════════════════════════════════════════════════════════════════

export async function sendWelcomeEmail(params: {
    ownerName: string
    gymName: string
    email: string
    resetUrl: string
    slug: string
    trialExpiresAt: Date
}) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || getBaseUrl()
    const trialEnd = params.trialExpiresAt.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
    })

    const result = await sendEmail({
        from: FROM_EMAIL,
        to: params.email,
        subject: `Welcome to GymMitra, ${escapeHtml(params.ownerName)}! 🏋️`,
        html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
                <h1 style="font-size: 24px; margin-bottom: 8px;">Welcome to GymMitra! 🎉</h1>
                <p>Hi ${escapeHtml(params.ownerName)},</p>
                <p><strong>${escapeHtml(params.gymName)}</strong> is now set up with a <strong>30-day free trial</strong> (valid until ${trialEnd}).</p>

                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin: 16px 0;">
                    <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px; color: #334155;">🔐 Set up your Login</p>
                    <p style="margin: 4px 0; font-size: 14px;">Email: <strong>${escapeHtml(params.email)}</strong></p>
                    <a href="${params.resetUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                        Set Your Password Here →
                    </a>
                </div>

                <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                    Your dashboard: <a href="${baseUrl}/${escapeHtml(params.slug)}/dashboard">${baseUrl}/${escapeHtml(params.slug)}/dashboard</a>
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px;">GymMitra · Smart Gym Management</p>
            </div>
        `,
    })

    if (result.error) {
        console.error('[Trial] Failed to send welcome email:', result.error)
    }
}

async function sendAdminNotification(params: {
    ownerName: string
    gymName: string
    email: string
    phone: string
    city: string
    slug: string
}) {
    if (env.ADMIN_EMAILS.length === 0) return

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || getBaseUrl()
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

    await sendEmail({
        from: FROM_EMAIL,
        to: env.ADMIN_EMAILS,
        subject: `🆕 New Trial Signup: ${params.gymName} (${params.city})`,
        html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
                <h2 style="font-size: 20px; margin-bottom: 16px;">🆕 New Trial Signup</h2>
                <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
                    <tr><td style="padding: 6px 12px; color: #64748b;">Gym Name</td><td style="padding: 6px 12px; font-weight: 600;">${params.gymName}</td></tr>
                    <tr style="background: #f8fafc;"><td style="padding: 6px 12px; color: #64748b;">Owner</td><td style="padding: 6px 12px; font-weight: 600;">${params.ownerName}</td></tr>
                    <tr><td style="padding: 6px 12px; color: #64748b;">Phone</td><td style="padding: 6px 12px; font-weight: 600;">${params.phone}</td></tr>
                    <tr style="background: #f8fafc;"><td style="padding: 6px 12px; color: #64748b;">Email</td><td style="padding: 6px 12px; font-weight: 600;">${params.email}</td></tr>
                    <tr><td style="padding: 6px 12px; color: #64748b;">City</td><td style="padding: 6px 12px; font-weight: 600;">${params.city}</td></tr>
                    <tr style="background: #f8fafc;"><td style="padding: 6px 12px; color: #64748b;">Role</td><td style="padding: 6px 12px; font-weight: 600; font-family: monospace;">Admin / Owner</td></tr>
                    <tr><td style="padding: 6px 12px; color: #64748b;">Slug</td><td style="padding: 6px 12px;"><a href="${baseUrl}/${escapeHtml(params.slug)}/dashboard">${escapeHtml(params.slug)}</a></td></tr>
                    <tr style="background: #f8fafc;"><td style="padding: 6px 12px; color: #64748b;">Signed Up</td><td style="padding: 6px 12px;">${now}</td></tr>
                </table>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px;">GymMitra Admin Alert</p>
            </div>
        `,
    })
}
