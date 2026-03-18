import TrialRequestForm from '@/components/trial/TrialRequestForm'
import Link from 'next/link'
import { GymMitraLogo } from '@/components/brand/GymMitraLogo'

export const metadata = {
    title: 'Start Free Trial | GymMitra',
    description: 'Start your 30-day free trial of GymMitra. No credit card required. Full access to all features.',
}

export default function StartTrialPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background circuit-bg">
            <div className="mb-8">
                <Link href="/" className="flex items-center gap-2 group">
                    <GymMitraLogo />
                </Link>
            </div>

            <TrialRequestForm />

            <p className="mt-6 text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                    Login here
                </Link>
            </p>
        </div>
    )
}
