import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBaseUrl } from '@/lib/utils'
import { sendWelcomeEmail } from '@/app/actions/trial'
import { sendWhatsAppTemplate } from '@/lib/whatsapp'
import { decryptPassword } from '@/lib/crypto'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
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
        console.error('[Auth Callback] Supabase redirect error:', errorParam, errorDescription)
        const msg = errorDescription || errorParam || "Authentication failed"
        return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent(msg)}`)
    }

    if (code) {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && user) {
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
                cookieStore.set('gym_onboarded', 'true', {
                    maxAge: 30 * 24 * 60 * 60, // 30 days
                    path: '/',
                    secure: true, // Always secure in verification flow
                    sameSite: 'lax'
                })
            }

            // First time verification logic
            if (gym && !gym.isVerified) {
                const updateData: any = {
                    isVerified: true, // CRITICAL FIX: Mark as verified
                    emailVerifiedAt: new Date()
                }

                if (gym.tempPassword) {
                    try {
                        const actualPassword = decryptPassword(gym.tempPassword)
                        
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

                        if (emailRef.status === 'fulfilled') {
                            updateData.tempPassword = null
                            updateData.onboardingEmailsSentAt = new Date()
                        } else {
                            console.error(`[Auth Callback] Welcome email failed for gym ${gym.id}:`, emailRef.reason)
                        }

                        if (whatsappRef.status === 'rejected') {
                            console.error(`[Auth Callback] WhatsApp failed for gym ${gym.id}:`, whatsappRef.reason)
                        }
                    } catch (cryptoError) {
                        console.error(`[Auth Callback] Decryption/Notification failed for gym ${gym.id}:`, cryptoError)
                    }
                }

                // Apply all updates (verification status + notification status)
                await (prisma.gymProfile.update as any)({
                    where: { id: gym.id },
                    data: updateData
                })
            }

            return NextResponse.redirect(`${baseUrl}/email-verified`)
        }
        
        console.error('[Auth Callback] Code exchange failed:', error?.message, error?.status)
        return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent(error?.message || "Verification failed or link expired.")}`)
    }

    console.error('[Auth Callback] No code provided')
    return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent("No verification code found in the link.")}`)
}
