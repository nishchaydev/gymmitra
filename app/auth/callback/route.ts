import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBaseUrl } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    // Use configured app URL if available, fallback to request origin
    const baseUrl = getBaseUrl()

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

            const finalSlug = gym?.slug || (isTrainerProfile as any)?.gym?.slug
            
            if (finalSlug) {
                return NextResponse.redirect(`${baseUrl}/${finalSlug}/dashboard`)
            }

            return NextResponse.redirect(`${baseUrl}${next}`)
        }
        console.error('[Auth Callback] Code exchange failed:', error?.message)
    } else {
        console.error('[Auth Callback] No code provided in search params')
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${baseUrl}/error?message=${encodeURIComponent("Verification failed or link expired. Please try logging in or registering again.")}`)
}
