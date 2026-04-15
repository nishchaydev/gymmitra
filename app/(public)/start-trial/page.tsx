import TrialRequestForm from '@/components/trial/TrialRequestForm'
import Link from 'next/link'
import { GymMitraLogo } from '@/components/brand/GymMitraLogo'
import { CheckCircle2, Sparkles, Building2 } from 'lucide-react'

export const metadata = {
    title: 'Start Free Trial | GymMitra',
    description: 'Start your 30-day free trial of GymMitra. No credit card required. Full access to all features.',
}

export default function StartTrialPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#fafafa] font-display selection:bg-primary/10">
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-ocean/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] bg-primary/5 rounded-full blur-[100px] animate-pulse delay-700" />
            </div>

            <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
                {/* Left Side: Success Story & Benefits (Asymmetric Layout) */}
                <div className="hidden lg:flex w-[60%] xl:w-[65%] flex-col justify-between p-8 xl:p-12 relative overflow-hidden">
                    <div className="relative z-10">
                        <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                            <GymMitraLogo iconClassName="w-8 h-8" textClassName="text-xl" />
                        </Link>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="space-y-3 max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm border border-slate-100 text-slate-600">
                                <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span>Free 30-Day Premium Access</span>
                            </div>
                            <h1 className="text-5xl xl:text-6xl font-bold text-slate-900 leading-[1] tracking-tight">
                                Zero Manual Work. <br /> 
                                <span className="text-slate-400 font-light italic">Starts Today.</span>
                            </h1>
                        </div>

                        {/* Product Capabilities */}
                        <div className="relative pt-4">
                             <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white max-w-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] relative group">
                                <div className="absolute -top-6 -right-6 h-24 w-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700" />
                                
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    Built for Indian Gyms
                                </h3>
                                <p className="text-base text-slate-500 font-medium leading-relaxed mb-6">
                                    Automate your billing, attendance, and member communication from day one.
                                </p>

                                <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                                    <div>
                                        <div className="text-2xl font-bold text-primary">₹0</div>
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">For 30 Days</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-primary">2 Min</div>
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Setup Time</div>
                                    </div>
                                </div>
                             </div>
                        </div>

                        <div className="space-y-4 max-w-md">
                            {[
                                "Complete member management",
                                "Automated WhatsApp payment reminders",
                                "Self-service Member Portal",
                                "Zero manual entry accounting"
                            ].map((prop, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="h-6 w-6 rounded-full bg-ocean/10 flex items-center justify-center shrink-0 text-ocean group-hover:bg-ocean group-hover:text-white transition-all">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-lg font-bold text-slate-600 transition-colors group-hover:text-slate-900">{prop}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Branding */}
                    <div className="relative z-10 flex items-center gap-12 text-slate-400 font-bold text-sm uppercase tracking-widest">
                        <span>30-Day Free Trial</span>
                        <div className="h-4 w-px bg-slate-200" />
                        <span>No Credit Card Required</span>
                    </div>
                </div>

                {/* Right Side: High-End Form Container */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-8 relative bg-white lg:rounded-l-[64px] shadow-[-64px_0_120px_-40px_rgba(0,0,0,0.04)] border-l border-white/50">
                    <div className="lg:hidden absolute top-8 left-8">
                        <Link href="/">
                            <GymMitraLogo iconClassName="w-8 h-8" />
                        </Link>
                    </div>

                    <div className="w-full max-w-lg mt-12 lg:mt-0">
                        <div className="mb-6 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-slate-900 mb-1">Start Your Trial</h2>
                            <p className="text-slate-500 font-medium">Full access. No credit card. Cancel anytime.</p>
                        </div>

                        <TrialRequestForm />
                        
                        <div className="mt-10 border-t border-slate-100 pt-10 text-center">
                            <p className="text-slate-500 font-medium">
                                Already have an account?{' '}
                                <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4 decoration-primary/30 transition-all">
                                    Login here
                                </Link>
                            </p>
                        </div>

                        <div className="mt-12 flex items-center justify-center gap-4 text-slate-300 font-bold text-[10px] uppercase tracking-widest">
                            <span>&copy; {new Date().getFullYear()} GymMitra</span>
                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                            <div className="flex items-center gap-1 text-slate-300">
                                <Building2 className="h-3 w-3" />
                                <span>eMitra Technologies</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
