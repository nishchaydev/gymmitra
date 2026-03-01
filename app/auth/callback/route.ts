import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    // Use configured app URL if available, fallback to request origin
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin

    if (code) {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && user) {
            const { prisma } = await import('@/lib/prisma')
            const gym = await prisma.gymProfile.findFirst({
                where: { userId: user.id }
            })

            if (gym?.slug) {
                return NextResponse.redirect(`${baseUrl}/${gym.slug}/dashboard`)
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
