import OnboardingForm from './OnboardingForm'
import { Metadata } from 'next'
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
        <div className="min-h-screen relative overflow-hidden bg-background premium-bg">
            {/* Background Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-40" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-ocean/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-40" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-midnight/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-40" />

            <div className="relative z-10 min-h-screen">
                <OnboardingForm />
            </div>
        </div>
    )
}
