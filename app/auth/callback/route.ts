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

    // Use configured app URL if available, fallback to request origin
    const baseUrl = getBaseUrl()

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
            // Password recovery flow — detect via explicit param OR recent recovery_sent_at
            if (next === '/reset-password') {
                return NextResponse.redirect(`${baseUrl}/reset-password`)
            }

            // Smart detection: if a recovery email was sent within the last hour, it's a password reset
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

            if (gym?.isVerified || isTrainerProfile) {
                const { cookies } = await import('next/headers')
                const cookieStore = await cookies()
                cookieStore.set('gym_onboarded', 'true', {
                    maxAge: 30 * 24 * 60 * 60, // 30 days
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                    })
                }

            // First time verification
            if (gym && !gym.isVerified) {
                if (gym.tempPassword) {
                    try {
                        const actualPassword = decryptPassword(gym.tempPassword)
                        
                        // Send credentials using Promise.allSettled for Task 2
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

                        const updateData: any = {}

                        // Task 2 & 3: Only clear if email succeeded, and set timestamp
                        if (emailRef.status === 'fulfilled') {
                            updateData.tempPassword = null
                            updateData.onboardingEmailsSentAt = new Date()
                        } else {
                            console.error(`[Auth Callback] Welcome email failed for gym ${gym.id} (${gym.email}):`, emailRef.reason)
                        }

                        if (whatsappRef.status === 'rejected') {
                            console.error(`[Auth Callback] WhatsApp failed for gym ${gym.id}:`, whatsappRef.reason)
                        }

                        if (Object.keys(updateData).length > 0) {
                            await (prisma.gymProfile.update as any)({
                                where: { id: gym.id },
                                data: updateData
                            })
                        }
                    } catch (cryptoError) {
                        console.error(`[Auth Callback] Decryption failed for gym ${gym.id}:`, cryptoError)
                    }
                }
            }

            // Always redirect to /email-verified after successful link click
            return NextResponse.redirect(`${baseUrl}/email-verified`)
        }
        
        console.error('[Auth Callback] Code exchange failed:', error?.message, error?.status)
        return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent(error?.message || "Verification failed or link expired.")}`)
    }

    console.error('[Auth Callback] No code provided in search params')
    return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent("No verification code found in the link.")}`)
}
