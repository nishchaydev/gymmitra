import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getBaseUrl } from '@/lib/utils'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    const baseUrl = getBaseUrl()
    
    if (!error && user) {
        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })
        const isTrainer = !gym ? await prisma.staffMember.findFirst({
            where: { userId: user.id },
            include: { gym: true }
        }) : null
        
        const gymData = gym || isTrainer?.gym
        
        if (gym?.isVerified || isTrainer) {
            const cookieStore = await cookies()
            cookieStore.set('gym_onboarded', 'true', {
                maxAge: 30 * 24 * 60 * 60,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            })
            
            // Cache gym session data for middleware (avoids DB queries on every request)
            if (gymData) {
                cookieStore.set('gym_session', JSON.stringify({
                    saasPlan: gymData.saasPlan,
                    trialExpiresAt: gymData.trialExpiresAt?.toISOString() ?? null,
                    isVerified: gymData.isVerified,
                    onboardingStep: gymData.onboardingStep,
                }), {
                    maxAge: 30 * 24 * 60 * 60,
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                })
            }
            
            const slug = gym?.slug || isTrainer?.gym?.slug || 'gym'
            return NextResponse.redirect(`${baseUrl}/${slug}/dashboard`)
        }
    }
    
    return NextResponse.redirect(`${baseUrl}/login`)
}

