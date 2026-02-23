import OnboardingForm from './OnboardingForm'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
    title: 'Gym Onboarding | Gym Mitra',
    description: 'Verify your gym and set up your business profile.',
}

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const gymProfile = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })

        if (gymProfile) {
            // Already onboarded, sync cookie and redirect
            const cookieStore = await cookies()
            cookieStore.set('gym_onboarded', 'true', {
                maxAge: 30 * 24 * 60 * 60,
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            })
            redirect('/dashboard')
        }
    }

    return (
        <div className="container mx-auto py-10">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-slate-900 mb-2">
                    Verify Your Gym
                </h1>
                <p className="text-slate-500 max-w-lg mx-auto">
                    Let&apos;s get your business details set up for professional invoicing and member management.
                </p>
            </div>
            <OnboardingForm />
        </div>
    )
}
