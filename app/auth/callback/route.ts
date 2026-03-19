import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBaseUrl } from '@/lib/utils'
import { sendWelcomeEmail } from '@/app/actions/trial'
import { sendWhatsAppTemplate } from '@/lib/whatsapp'
import { decryptPassword } from '@/lib/crypto'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/dashboard'
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Use production URL from env or fallback to request origin (ensuring no hardcoded localhost for prod)
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
    const baseUrl = origin.replace(/\/$/, '') // Remove trailing slash

    // 1. Prevent "Invalid or expired link" errors caused by browser/email pre-fetching
    if (request.headers.get('purpose') === 'prefetch' || request.headers.get('x-purpose') === 'preview') {
        return new Response(null, { status: 204 })
    }

    // Handle explicit errors from Supabase redirect (e.g. link expired, already used)
    if (errorParam || errorDescription) {
        console.error('[Auth Callback] Supabase redirect error:', {
            error: errorParam,
            description: errorDescription,
            userAgent: request.headers.get('user-agent'),
            purpose: request.headers.get('purpose'),
            xPurpose: request.headers.get('x-purpose')
        })
        const msg = errorDescription || errorParam || "Authentication failed"
        return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent(msg)}`)
    }

    const supabase = await createClient()

    // --- Auth verification: token_hash (mobile/non-PKCE) or code (PKCE) ---
    if (token_hash && type) {
        // Mobile / non-PKCE flow: verify OTP via token_hash
        console.log('[Auth Callback] Attempting OTP verification:', { type, token_hash: token_hash.slice(0, 5) + '...' })
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (error) {
            console.error('[Auth Callback] OTP verification failed:', error)
            return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent(error.message || "Verification failed or link expired.")}`)
        }
    } else if (code) {
        // Standard PKCE flow: exchange code for session
        console.log('[Auth Callback] Attempting code exchange:', {
            code: code.slice(0, 5) + '...',
            origin,
            baseUrl
        })
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            console.error('[Auth Callback] Code exchange failed:', {
                message: error.message,
                status: error.status,
                code: error.code
            })
            return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent(error.message || "Verification failed or link expired.")}`)
        }
    } else {
        console.error('[Auth Callback] No code or token_hash provided')
        return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent("No verification code found in the link.")}`)
    }

    // --- Auth succeeded, get user session ---
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error('[Auth Callback] Auth succeeded but no user session found')
        return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent("Verification failed or link expired.")}`)
    }

    console.log('[Auth Callback] Auth successful for user:', user.id)

    // Password recovery flow
    if (next === '/reset-password') {
        return NextResponse.redirect(`${baseUrl}/reset-password`)
    }

    if (user.recovery_sent_at) {
        const recoverySentAt = new Date(user.recovery_sent_at).getTime()
        const oneHourAgo = Date.now() - 60 * 60 * 1000
        if (recoverySentAt > oneHourAgo) {
            return NextResponse.redirect(`${baseUrl}/reset-password`)
        }
    }

    // Normal login / signup flow
    const { prisma } = await import('@/lib/prisma')
    const gym = await prisma.gymProfile.findFirst({
        where: { userId: user.id }
    }) as any

    const isTrainerProfile = !gym ? await prisma.staffMember.findFirst({
        where: { userId: user.id },
        include: { gym: true }
    }) : null;

    // Set session cookie for onboarded users
    if (gym?.isVerified || isTrainerProfile) {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1')

        cookieStore.set('gym_onboarded', 'true', {
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
            secure: !isLocal, // Fix: Use non-secure for localhost
            sameSite: 'lax'
        })
    }

    // First time verification logic
    if (gym && !gym.isVerified) {
        const updateData: any = {
            // NOTE: isVerified is intentionally NOT set here.
            // It should only be set when the user completes onboarding
            // ("Complete & Verify" button on the final step).
            emailVerifiedAt: new Date()
        }

        if (gym.tempPassword) {
            try {
                const actualPassword = decryptPassword(gym.tempPassword)

                if (!gym.onboardingEmailsSentAt) {
                    // Send credentials and welcome notifications
                    const [emailRef, whatsappRef] = await Promise.allSettled([
                        sendWelcomeEmail({
                            ownerName: gym.ownerName,
                            gymName: gym.name,
                            email: gym.email,
                            password: actualPassword,
                            slug: gym.slug,
                            trialExpiresAt: gym.trialExpiresAt,
                        }),
                        sendWhatsAppTemplate({
                            to: gym.phone,
                            templateName: 'gymmitra_welcome_trial_final',
                            languageCode: 'en',
                            components: [
                                {
                                    type: 'body',
                                    parameters: [
                                        { type: 'text', text: gym.ownerName },
                                        { type: 'text', text: gym.name },
                                        { type: 'text', text: gym.email },
                                        { type: 'text', text: `${baseUrl}/login` },
                                    ],
                                },
                            ],
                        })
                    ])

                    // ALWAYS clear tempPassword and set sent timestamp to prevent duplicate sends/infinite loops
                    updateData.tempPassword = null
                    updateData.onboardingEmailsSentAt = new Date()

                    if (emailRef.status === 'rejected') {
                        console.error(`[Auth Callback] Welcome email failed for gym ${gym.id}:`, emailRef.reason)
                    }

                    if (whatsappRef.status === 'rejected') {
                        console.error(`[Auth Callback] WhatsApp failed for gym ${gym.id}:`, whatsappRef.reason)
                    }
                } else {
                    // If already sent, just ensure temp password is cleared
                    updateData.tempPassword = null
                }
            } catch (cryptoError) {
                console.error(`[Auth Callback] Decryption/Notification failed for gym ${gym.id}:`, cryptoError)
            }
        }

        // Apply all updates (email verification + notification status)
        try {
            await (prisma.gymProfile.update as any)({
                where: { id: gym.id },
                data: updateData
            })
        } catch (updateError) {
            console.error(`[Auth Callback] DB update failed for gym ${gym.id}:`, updateError)
            // Continue anyway, user has the session
        }
    }

    return NextResponse.redirect(`${baseUrl}/email-verified`)
}
