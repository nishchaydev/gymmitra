import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBaseUrl } from '@/lib/utils'
import { sendWelcomeEmail } from '@/app/actions/trial'
import { sendWhatsAppTemplate } from '@/lib/whatsapp'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { SupabaseClient, User } from '@supabase/supabase-js'

// ── Types ──

interface GymProfile {
    id: string
    name: string
    slug: string | null
    email: string
    phone: string
    ownerName: string | null
    isVerified: boolean
    tempPassword: string | null
    onboardingEmailsSentAt: Date | null
    emailVerifiedAt: Date | null
    trialExpiresAt: Date | null
    saasPlan: string
    onboardingStep: number
}

interface StaffProfile {
    isFirstLogin: boolean
    gym: { slug: string; saasPlan: string; trialExpiresAt: Date | null; isVerified: boolean; onboardingStep: number }
}

// ── Helpers ──

/** Verify the auth code/token from the callback URL. Returns user or redirects on error. */
async function verifyAuth(
    supabase: SupabaseClient,
    params: { code: string | null; token_hash: string | null; type: EmailOtpType | null },
    baseUrl: string
): Promise<{ user: User } | { redirect: NextResponse }> {
    const { code, token_hash, type } = params

    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (error) {
            console.error('[Auth Callback] OTP verification failed:', error)
            return { redirect: NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent(error.message || "Verification failed or link expired.")}`) }
        }
    } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            console.error('[Auth Callback] Code exchange failed:', { message: error.message, status: error.status, code: error.code })
            return { redirect: NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent(error.message || "Verification failed or link expired.")}`) }
        }
    } else {
        console.error('[Auth Callback] No code or token_hash provided')
        return { redirect: NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent("No verification code found in the link.")}`) }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('[Auth Callback] Auth succeeded but no user session found')
        return { redirect: NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent("Verification failed or link expired.")}`) }
    }

    return { user }
}

/** Resolve the user's gym or staff profile from the database. */
async function resolveProfile(userId: string): Promise<{ gym: GymProfile | null; staffProfile: StaffProfile | null }> {
    const { prisma } = await import('@/lib/prisma')

    const gym = await prisma.gymProfile.findFirst({
        where: { userId }
    }) as GymProfile | null

    const staffProfile = !gym ? await prisma.staffMember.findFirst({
        where: { userId, isActive: true },
        include: { gym: true }
    }) as StaffProfile | null : null

    return { gym, staffProfile }
}

/** Set session cookies (gym_onboarded + gym_session) for authenticated users. */
async function setSessionCookies(
    gym: GymProfile | null,
    staffProfile: StaffProfile | null,
    origin: string
): Promise<void> {
    const gymData = gym || staffProfile?.gym
    if (!gym?.isVerified && !staffProfile) return

    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1')

    cookieStore.set('gym_onboarded', 'true', {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
        secure: !isLocal,
        sameSite: 'lax'
    })

    // Cache gym session data for middleware (avoids DB queries on every request)
    if (gymData) {
        cookieStore.set('gym_session', JSON.stringify({
            saasPlan: gymData.saasPlan,
            trialExpiresAt: gymData.trialExpiresAt?.toISOString?.() ?? gymData.trialExpiresAt ?? null,
            isVerified: gymData.isVerified,
            onboardingStep: gymData.onboardingStep,
        }), {
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
            secure: !isLocal,
            sameSite: 'lax'
        })
    }
}

/** Handle first-time email verification: send welcome email + WhatsApp, mark as verified. */
async function handleFirstVerification(gym: GymProfile, baseUrl: string): Promise<void> {
    const { prisma } = await import('@/lib/prisma')

    if (gym.onboardingEmailsSentAt) {
        // Already sent — just mark email as verified and clear temp password
        try {
            await prisma.gymProfile.updateMany({
                where: { id: gym.id },
                data: { emailVerifiedAt: new Date(), tempPassword: null }
            })
        } catch (updateError) {
            console.error(`[Auth Callback] DB update failed for gym ${gym.id}:`, updateError)
        }
        return
    }

    // First verification — send credentials and welcome notifications
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabaseAdmin = createAdminClient()
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: gym.email,
            options: { redirectTo: `${baseUrl}/auth/callback?next=/reset-password` }
        })
        const resetUrl = linkData?.properties?.action_link || `${baseUrl}/reset-password`

        // Atomic check-and-update to prevent race conditions
        const updateClaim = await prisma.gymProfile.updateMany({
            where: { id: gym.id, onboardingEmailsSentAt: null },
            data: {
                tempPassword: null,
                onboardingEmailsSentAt: new Date(),
                emailVerifiedAt: new Date()
            }
        })

        if (updateClaim.count > 0) {
            // Fire-and-forget: email + WhatsApp (non-blocking via allSettled)
            const [emailRef, whatsappRef] = await Promise.allSettled([
                sendWelcomeEmail({
                    ownerName: gym.ownerName ?? gym.name,
                    gymName: gym.name,
                    email: gym.email,
                    resetUrl,
                    slug: gym.slug ?? gym.id,
                    trialExpiresAt: gym.trialExpiresAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                }),
                sendWhatsAppTemplate({
                    to: gym.phone,
                    templateName: 'gymmitra_welcome_trial_final',
                    languageCode: 'en',
                    components: [{
                        type: 'body',
                        parameters: [
                            { type: 'text', text: gym.ownerName ?? gym.name },
                            { type: 'text', text: gym.name },
                            { type: 'text', text: gym.email },
                            { type: 'text', text: `${baseUrl}/login` },
                        ],
                    }],
                })
            ])

            if (emailRef.status === 'rejected') {
                console.error(`[Auth Callback] Welcome email failed for gym ${gym.id}:`, (emailRef as PromiseRejectedResult).reason)
            }
            if (whatsappRef.status === 'rejected') {
                console.error(`[Auth Callback] WhatsApp failed for gym ${gym.id}:`, (whatsappRef as PromiseRejectedResult).reason)
            }
        }
    } catch (notifyError) {
        console.error(`[Auth Callback] Notification failed for gym ${gym.id}:`, notifyError)
    }
}

// ── Main Handler ──

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/dashboard'
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
    const baseUrl = origin.replace(/\/$/, '')

    // 1. Block prefetch requests from email clients
    if (request.headers.get('purpose') === 'prefetch' || request.headers.get('x-purpose') === 'preview') {
        return new Response(null, { status: 204 })
    }

    // 2. Handle explicit Supabase errors
    if (errorParam || errorDescription) {
        console.error('[Auth Callback] Supabase redirect error:', { error: errorParam, description: errorDescription })
        const msg = errorDescription || errorParam || "Authentication failed"
        return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent(msg)}`)
    }

    // 3. Verify authentication
    const supabase = await createClient()
    const authResult = await verifyAuth(supabase, { code, token_hash, type }, baseUrl)
    if ('redirect' in authResult) return authResult.redirect
    const { user } = authResult

    console.log('[Auth Callback] Auth successful for user:', user.id)

    // 4. Password recovery flow
    if (next === '/reset-password') {
        return NextResponse.redirect(`${baseUrl}/reset-password`)
    }
    if (user.recovery_sent_at) {
        const recoverySentAt = new Date(user.recovery_sent_at).getTime()
        if (recoverySentAt > Date.now() - 60 * 60 * 1000) {
            return NextResponse.redirect(`${baseUrl}/reset-password`)
        }
    }

    // 5. Admin check
    const { env } = await import('@/lib/env')
    if (user.email && env.isAdmin(user.email)) {
        return NextResponse.redirect(`${baseUrl}/admin`)
    }

    // 6. Resolve profile and set cookies
    const { gym, staffProfile } = await resolveProfile(user.id)
    await setSessionCookies(gym, staffProfile, origin)

    // 7. Staff routing
    if (staffProfile?.isFirstLogin) {
        return NextResponse.redirect(`${baseUrl}/${staffProfile.gym.slug}/first-login`)
    }
    if (staffProfile) {
        return NextResponse.redirect(`${baseUrl}/${staffProfile.gym.slug}/dashboard`)
    }

    // 8. First-time verification for unverified gyms
    if (gym && !gym.isVerified) {
        await handleFirstVerification(gym, baseUrl)
    }

    return NextResponse.redirect(`${baseUrl}/email-verified`)
}

