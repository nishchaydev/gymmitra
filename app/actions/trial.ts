'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { addDays } from 'date-fns'
import { getBaseUrl } from '@/lib/utils'
import { sendWhatsAppTemplate } from '@/lib/whatsapp'
import { encryptPassword } from '@/lib/crypto'

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
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: autoPassword,
        options: { emailRedirectTo: `${getBaseUrl()}/auth/callback` },
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
                tempPassword: encryptPassword(autoPassword),
            },
        })
    } catch (dbError) {
        // Cleanup orphaned Supabase user
        try { await supabase.auth.admin.deleteUser(userId) } catch { /* best-effort */ }
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
        password: autoPassword,
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
    password: string
    slug: string
    trialExpiresAt: Date
}) {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)
    const baseUrl = getBaseUrl()
    const trialEnd = params.trialExpiresAt.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
    })

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'GymMitra <Admin@mail.emitra.dev>',
        to: params.email,
        subject: `Welcome to GymMitra, ${params.ownerName}! 🏋️`,
        html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
                <h1 style="font-size: 24px; margin-bottom: 8px;">Welcome to GymMitra! 🎉</h1>
                <p>Hi ${params.ownerName},</p>
                <p><strong>${params.gymName}</strong> is now set up with a <strong>30-day free trial</strong> (valid until ${trialEnd}).</p>

                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin: 16px 0;">
                    <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px; color: #334155;">🔐 Your Login Credentials</p>
                    <p style="margin: 4px 0; font-size: 14px;">Email: <strong>${params.email}</strong></p>
                    <p style="margin: 4px 0; font-size: 14px;">Password: <strong>${params.password}</strong></p>
                </div>

                <p>Now that your email is verified, complete your gym setup in just a few minutes:</p>
                <a href="${baseUrl}/login" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                    Log In & Complete Setup →
                </a>
                <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                    Your dashboard: <a href="${baseUrl}/${params.slug}/dashboard">${baseUrl}/${params.slug}/dashboard</a>
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

const ADMIN_EMAILS = ['nikhilpal525@gmail.com', 'nishchaygupta54@gmail.com']

async function sendAdminNotification(params: {
    ownerName: string
    gymName: string
    email: string
    phone: string
    city: string
    password: string
    slug: string
}) {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)
    const baseUrl = getBaseUrl()
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
                    <tr style="background: #f8fafc;"><td style="padding: 6px 12px; color: #64748b;">Password</td><td style="padding: 6px 12px; font-weight: 600; font-family: monospace;">${params.password}</td></tr>
                    <tr><td style="padding: 6px 12px; color: #64748b;">Slug</td><td style="padding: 6px 12px;"><a href="${baseUrl}/${params.slug}/dashboard">${params.slug}</a></td></tr>
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
                tempPassword: encryptPassword(tempPassword),
            },
        })
    } catch {
        try { await supabase.auth.admin.deleteUser(userId) } catch { /* best-effort */ }
        return { success: false, error: 'Failed to create gym profile.' }
    }

    // Send welcome (non-blocking)
    sendWelcomeEmail({
        ownerName: data.ownerName,
        gymName: data.gymName,
        email,
        slug,
        password: tempPassword,
        trialExpiresAt,
    }).catch(() => {})

    return { success: true, slug, tempPassword }
}
