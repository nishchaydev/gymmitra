import OnboardingForm from './OnboardingForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Gym Onboarding | Gym Mitra',
    description: 'Verify your gym and set up your business profile.',
}

export default function OnboardingPage() {
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
