import { getAuthGym } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function EmailVerifiedPage() {
    const auth = await getAuthGym()

    if (!auth?.userId) {
        redirect('/login')
    }

    const { gym } = auth
    const isVerified = gym?.isVerified

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-slate-100">
            {/* Subtle background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative w-full max-w-lg aspect-square sm:aspect-auto flex flex-col items-center justify-center bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-8 sm:p-12 text-center overflow-hidden">
                {/* Decorative ring */}
                <div className="absolute inset-0 border-[20px] border-slate-50/50 rounded-[2.5rem] pointer-events-none" />
                
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-green-100 rounded-full blur-2xl opacity-50 scale-150 animate-pulse" />
                    <div className="relative bg-green-500 p-4 rounded-3xl shadow-lg shadow-green-200">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                    Email Confirmed!
                </h1>
                
                <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-sm">
                    {isVerified 
                        ? "Great news! Your account is verified and ready for action."
                        : "Your email is verified! Now, let's complete your gym's professional setup."}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    {isVerified ? (
                        <Button asChild size="lg" className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200 group">
                            <Link href={`/${gym.slug}/dashboard`}>
                                Go to Dashboard
                                <Home className="ml-2 w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                            </Link>
                        </Button>
                    ) : (
                        <Button asChild size="lg" className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200 group">
                            <Link href="/onboarding">
                                Complete Setup
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 w-full">
                    <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
                        GYMMITRA &bull; 2025
                    </p>
                </div>
            </div>
        </div>
    )
}
