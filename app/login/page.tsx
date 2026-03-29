import { login, signup, demoLogin } from './actions'
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/auth/SubmitButton"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { AlertCircle, Building2, Quote, Star, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GymMitraLogo } from '@/components/brand/GymMitraLogo'

export default async function LoginPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams

    const getErrorMessage = (msg: string | string[] | undefined) => {
        if (!msg) return null
        const message = Array.isArray(msg) ? msg[0] : msg
        if (message.includes("security purposes")) {
            return "Too many attempts. Please wait a minute before trying again."
        }
        return message
    }

    const errorMessage = getErrorMessage(searchParams.message)

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#fafafa] font-display selection:bg-primary/10">
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ocean/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-primary/5 rounded-full blur-[100px] animate-pulse delay-700" />
            </div>

            <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
                {/* Left Side: Brand & Social Proof (Asymmetric Layout) */}
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
                                <span>The Operating System for Elite Gyms</span>
                            </div>
                            <h1 className="text-5xl xl:text-6xl font-bold text-slate-900 leading-[1] tracking-tight">
                                Management <br /> 
                                <span className="text-slate-400 font-light italic">on Autopilot.</span>
                            </h1>
                        </div>

                        {/* Real Customer Spotlight: Tristar Fitness */}
                        <div className="relative pt-4">
                             <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white max-w-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] relative group">
                                <div className="absolute -top-6 -right-6 h-20 w-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700" />
                                
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>

                                <Quote className="w-10 h-10 text-slate-100 absolute top-8 right-8 -z-10" />
                                
                                <p className="text-xl text-slate-800 font-medium leading-relaxed mb-4">
                                    &ldquo;Tristar Fitness switched to GymMitra to handle 500+ members without a single manual entry. It saved us 20 hours each month.&rdquo;
                                </p>

                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-slate-950 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-slate-950/20">
                                        TF
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 leading-none mb-1">Tristar Fitness</div>
                                        <div className="text-sm text-slate-500 font-medium tracking-tight">Indore, MP</div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Footer Branding */}
                    <div className="relative z-10 flex items-center gap-6 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        <span>EST. 2026</span>
                        <div className="h-3 w-px bg-slate-200" />
                        <span>Built for Performance</span>
                    </div>
                </div>

                {/* Right Side: High-End Login Form Container */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-8 xl:p-12 relative bg-white lg:rounded-l-[64px] shadow-[-64px_0_120px_-40px_rgba(0,0,0,0.04)] border-l border-white/50">
                    <div className="lg:hidden absolute top-8 left-8">
                        <Link href="/">
                            <GymMitraLogo iconClassName="w-8 h-8" />
                        </Link>
                    </div>

                    <div className="w-full max-w-md">
                        <div className="mb-6 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-slate-900 mb-1">Welcome Back</h2>
                            <p className="text-slate-500 font-medium">Continue to your dashboard</p>
                        </div>

                        <Card className="border-none shadow-none bg-transparent">
                            <CardContent className="p-0">
                                {errorMessage && (
                                    <Alert variant="destructive" className="mb-8 rounded-2xl border-rose-50 bg-rose-50/50 text-rose-900">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-rose-600" />
                                            <AlertTitle className="font-bold">Login Failed</AlertTitle>
                                        </div>
                                        <AlertDescription className="font-medium text-rose-600/80">
                                            {errorMessage}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <form className="space-y-6">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-[10px] font-bold text-slate-700 ml-1 uppercase tracking-wider">Email Address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="gym@emitra.dev"
                                            className="h-12 bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between ml-1">
                                            <Label htmlFor="password" className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Password</Label>
                                            <Link href="/forgot-password" title="sm" className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors">
                                                Forgot?
                                            </Link>
                                        </div>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            className="h-12 bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all font-medium"
                                        />
                                    </div>

                                    <div className="pt-1">
                                        <SubmitButton
                                            formAction={login}
                                            className="w-full h-12 rounded-2xl font-bold text-lg bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-950/20"
                                            text="Sign In"
                                            loadingText="Verifying..."
                                        />
                                    </div>
                                </form>

                                <div className="mt-4 border-t border-slate-100 pt-4">
                                    <p className="text-center text-slate-500 font-semibold mb-3 uppercase tracking-widest text-[9px]">
                                        New Here?
                                    </p>
                                    <Link href="/start-trial" className="block w-full">
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 rounded-2xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-bold transition-all text-sm"
                                        >
                                            Start 30-Day Free Trial
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>

                            <CardFooter className="mt-4 p-0 flex flex-col gap-4">
                                <form className="w-full">
                                    <button
                                        formAction={demoLogin}
                                        className="w-full text-slate-400 hover:text-primary font-bold text-xs transition-colors py-1"
                                    >
                                        Or Quick Access via Demo &rarr;
                                    </button>
                                </form>

                                <div className="flex items-center justify-center gap-4 text-slate-300 font-bold text-[10px] uppercase tracking-widest">
                                    <span>&copy; {new Date().getFullYear()} GymMitra</span>
                                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                                    <div className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        <span>eMitra Technologies</span>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
