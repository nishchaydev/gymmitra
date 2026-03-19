import TrialRequestForm from '@/components/trial/TrialRequestForm'
import Link from 'next/link'
import { GymMitraLogo } from '@/components/brand/GymMitraLogo'
import { CheckCircle } from 'lucide-react'

export const metadata = {
    title: 'Start Free Trial | GymMitra',
    description: 'Start your 30-day free trial of GymMitra. No credit card required. Full access to all features.',
}

export default function StartTrialPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-background premium-bg">
            {/* Background Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-40"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-ocean/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-40"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-midnight/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-40"></div>

            <div className="relative z-10 flex min-h-screen">
                {/* Left Side: Value Props (Desktop Only) */}
                <div className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-24 bg-midnight/5 border-r border-border/50">
                    <div className="max-w-md">
                        <Link href="/" className="mb-12 block">
                            <GymMitraLogo iconClassName="w-12 h-12" />
                        </Link>
                        <h1 className="text-5xl font-bold text-midnight leading-tight mb-6">
                            Transform Your <span className="text-primary italic">Gym</span> into a Digital Powerhouse
                        </h1>
                        <p className="text-xl text-muted-foreground mb-12">
                            Join 500+ gym owners who are scaling their businesses with GymMitra. No credit card, no risk, just results.
                        </p>

                        <div className="space-y-6">
                            {[
                                "Complete member management",
                                "Automated payment tracking",
                                "Diet & workout plan builder",
                                "Real-time analytics dashboard"
                            ].map((prop, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-border group-hover:border-primary transition-colors">
                                        <CheckCircle className="w-5 h-5 text-ocean" />
                                    </div>
                                    <span className="text-lg font-medium text-slate-700">{prop}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
                    <div className="lg:hidden absolute top-8">
                        <Link href="/">
                            <GymMitraLogo />
                        </Link>
                    </div>

                    <div className="w-full max-w-lg mt-12 lg:mt-0">
                        <TrialRequestForm />
                        
                        <div className="mt-8 text-center">
                            <p className="text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <Link href="/login" className="text-primary font-semibold hover:underline">
                                    Login here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
