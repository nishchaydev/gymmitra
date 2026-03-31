'use server'

import { prisma } from '@/lib/prisma'
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
    | { success: true; slug: string }
    | { success: false; error: string }

/**
 * Self-serve trial signup.
 * Creates Supabase user (auto-generated password) + GymProfile with 30-day trial.
 * Sends welcome email via Resend and WhatsApp template via Meta Cloud API.
 */
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
    const email = data.email.toLowerCase().trim()

    try {
        await apiLimiter.check(5, `create-trial-gym:${data.phone.replace(/\D/g, '').slice(-10)}`)
    } catch {
        return { success: false, error: 'Too many trial requests from this phone number. Please try again later.' }
    }

    // 2. Check duplicate by PHONE (primary anti-abuse gate) and email
    const normalizedPhone = data.phone.replace(/\D/g, '').slice(-10)
    const existingByPhone = await prisma.gymProfile.findFirst({
        where: { phone: normalizedPhone, deletedAt: null },
    })
    if (existingByPhone) {
        return { success: false, error: 'This phone number is already registered. Please login instead.' }
    }

    const existingByEmail = await prisma.gymProfile.findFirst({
        where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
    })
    if (existingByEmail) {
        return { success: false, error: 'This email is already registered. Please login instead.' }
    }

    // 3. Create Supabase user with auto-generated password
    const autoPassword = randomBytes(6).toString('base64url') // 8-char URL-safe
    // Get current origin for reliable redirect (fixes PKCE mismatch on custom domains)
    const headerList = await headers()
    const host = headerList.get('host')
    const protocol = headerList.get('x-forwarded-proto') || 'https'
    const origin = `${protocol}://${host}`

    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: autoPassword,
        options: { emailRedirectTo: `${origin}/auth/callback` },
    })

    if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Failed to create account.' }
    }

    const userId = authData.user.id

    // 4. Generate slug: kebab-case + 4-char random suffix
    const baseSlug = toSlug(data.gymName)
    const suffix = randomBytes(2).toString('hex') // 4 hex chars
    const slug = `${baseSlug}-${suffix}`
    const trialExpiresAt = addDays(new Date(), 30)

    // 5. Create GymProfile
    try {
        await prisma.gymProfile.create({
            data: {
                name: data.gymName,
                businessName: data.gymName,
                ownerName: data.ownerName,
                slug,
                email,
                phone: data.phone,
                city: data.city,
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
        console.error('[Trial Signup] Failed to create GymProfile in database:', dbError)
        // Cleanup orphaned Supabase user using Service Role Key
        try { 
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (serviceKey) {
                const adminAuthClient = createServiceClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    serviceKey
                )
                await adminAuthClient.auth.admin.deleteUser(userId)
            } else {
                console.error('[Trial Signup] Missing SUPABASE_SERVICE_ROLE_KEY, unable to delete user.');
            }
        } catch (cleanupError) { 
            console.error('[Trial Signup] Failed to delete orphaned Auth user:', cleanupError)
        }
        return { success: false, error: 'Failed to create gym profile. Please try again.' }
    }

    // Welcome email and WhatsApp with credentials will be sent upon email verification in the auth callback.

    // 8. Notify founders about new signup (non-blocking)
    sendAdminNotification({
        ownerName: data.ownerName,
        gymName: data.gymName,
        email,
        phone: data.phone,
        city: data.city,
        slug,
    }).catch(() => { /* swallow — non-critical */ })

    return { success: true, slug }
}

// ──────────────────────────────────────────────
// Welcome email via Resend
// ──────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
    ownerName: string
    gymName: string
    email: string
    resetUrl: string
    slug: string
    trialExpiresAt: Date
}) {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || getBaseUrl()
    const trialEnd = params.trialExpiresAt.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
    })

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'GymMitra <Admin@mail.emitra.dev>',
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
}

// ──────────────────────────────────────────────
// Admin notification — emails both founders
// ──────────────────────────────────────────────

const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(email => email.trim())
    .filter(Boolean) as string[]

async function sendAdminNotification(params: {
    ownerName: string
    gymName: string
    email: string
    phone: string
    city: string
    slug: string
}) {
    if (ADMIN_EMAILS.length === 0) return

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || getBaseUrl()
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'GymMitra <Admin@mail.emitra.dev>',
        to: ADMIN_EMAILS,
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

// ──────────────────────────────────────────────
// Admin-only: manual onboard
// ──────────────────────────────────────────────

/**
 * Nish can use this to onboard a gym in person.
 * Returns the auto-generated password so it can be shared with the owner.
 */
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
    // Admin auth gate — verify caller is an admin
    const supabaseClient = await createClient()
    const { data: { user: adminUser } } = await supabaseClient.auth.getUser()
    if (!adminUser || !ADMIN_EMAILS.includes(adminUser.email ?? '')) {
        return { success: false, error: 'Unauthorized: Admin access only' }
    }

    const tempPassword = randomBytes(4).toString('hex') // 8-char hex

    // Temporarily patch createTrialGym to use our password
    // We re-implement the flow here for control over the password
    const parsed = trialSchema.safeParse(raw)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }
    const data = parsed.data
    const email = data.email.toLowerCase().trim()

    // Check duplicate by phone first (anti-abuse), then email
    const normalizedPhone = data.phone.replace(/\D/g, '').slice(-10)
    const existingByPhone = await prisma.gymProfile.findFirst({
        where: { phone: normalizedPhone, deletedAt: null },
    })
    if (existingByPhone) {
        return { success: false, error: 'This phone number is already registered.' }
    }

    const existing = await prisma.gymProfile.findFirst({
        where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
    })
    if (existing) {
        return { success: false, error: 'This email is already registered.' }
    }

    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: { emailRedirectTo: `${getBaseUrl()}/auth/callback` },
    })

    if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Failed to create account.' }
    }

    const userId = authData.user.id
    const baseSlug = toSlug(data.gymName)
    const suffix = randomBytes(2).toString('hex')
    const slug = `${baseSlug}-${suffix}`
    const trialExpiresAt = addDays(new Date(), 30)

    try {
        await prisma.gymProfile.create({
            data: {
                name: data.gymName,
                businessName: data.gymName,
                ownerName: data.ownerName,
                slug,
                email,
                phone: data.phone,
                city: data.city,
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
        console.error('[Admin Trial Signup] Failed to create GymProfile in database:', dbError)
        try { 
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (serviceKey) {
                const adminAuthClient = createServiceClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    serviceKey
                )
                await adminAuthClient.auth.admin.deleteUser(userId)
            } else {
                console.error('[Admin Trial Signup] Missing SUPABASE_SERVICE_ROLE_KEY, unable to delete user.');
            }
        } catch (cleanupError) { 
            console.error('[Admin Trial Signup] Failed to delete orphaned Auth user:', cleanupError)
        }
        return { success: false, error: 'Failed to create gym profile.' }
    }

    // Send welcome (non-blocking)
    // For admin creation, we don't have a reliable resetUrl generated immediately here
    sendWelcomeEmail({
        ownerName: data.ownerName,
        gymName: data.gymName,
        email,
        slug,
        resetUrl: `${getBaseUrl()}/reset-password`,
        trialExpiresAt,
    }).catch(() => { })

    return { success: true, slug, tempPassword }
}
