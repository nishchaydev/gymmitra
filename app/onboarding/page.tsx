import OnboardingForm from './OnboardingForm'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export const metadata: Metadata = {
    title: 'Gym Onboarding | GymMitra',
    description: 'Verify your gym and set up your business profile.',
}

export default async function OnboardingPage() {
    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())

    if (!auth?.userId) {
        redirect('/login')
    }

    let shouldRedirect = false
    try {
        // Access restricted to gyms that are not yet verified
        if (auth.gym.isVerified) {
            shouldRedirect = true
        }
    } catch (error) {
        console.error('[onboarding] Failed to verify gym status:', error instanceof Error ? error.message : String(error))
    }

    const headerList = await headers()
    const isAction = headerList.has('next-action')

    if (shouldRedirect && !isAction) {
        redirect(`/${auth.gym.slug}/dashboard`)
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
