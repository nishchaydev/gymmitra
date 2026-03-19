import { login, signup, demoLogin } from './actions'
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/auth/SubmitButton"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { AlertCircle, Building2, CheckCircle, Shield, Zap, BarChart3 } from "lucide-react"
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
        <div className="min-h-screen relative overflow-hidden bg-background premium-bg">
            {/* Background Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-40" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-ocean/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-40" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-midnight/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-40" />

            <div className="relative z-10 flex min-h-screen">
                {/* Left Side: Marketing Panel (Desktop Only) */}
                <div className="hidden lg:flex flex-1 flex-col justify-center px-8 xl:px-16 bg-midnight/5 border-r border-border/50 overflow-y-auto py-6">
                    <div className="max-w-md">
                        <Link href="/" className="mb-5 block">
                            <GymMitraLogo iconClassName="w-9 h-9" />
                        </Link>
                        <h1 className="text-2xl xl:text-3xl font-bold text-midnight leading-snug mb-3">
                            Welcome Back to <span className="text-primary italic">GymMitra</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mb-6">
                            Your gym management dashboard is waiting. Pick up right where you left off.
                        </p>

                        <div className="space-y-3">
                            {[
                                { icon: BarChart3, text: "Real-time analytics dashboard" },
                                { icon: Shield, text: "Secure & encrypted data" },
                                { icon: Zap, text: "Instant member check-in" },
                                { icon: CheckCircle, text: "Automated payment reminders" },
                            ].map((prop, i) => (
                                <div key={i} className="flex items-center gap-3 group">
                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-border group-hover:border-primary transition-colors shrink-0">
                                        <prop.icon className="w-4 h-4 text-ocean" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{prop.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative circuit-bg">
                    <div className="lg:hidden mb-8">
                        <Link href="/">
                            <GymMitraLogo />
                        </Link>
                    </div>

                    <div className="w-full max-w-md">
                        <Card className="shadow-2xl border-border/50 glass-card rounded-3xl overflow-hidden">
                            <CardHeader className="text-center pt-8 pb-4">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-primary/10 p-2.5 rounded-full">
                                        <Image
                                            src="/icon.png"
                                            alt="GymMitra Logo"
                                            width={32}
                                            height={32}
                                            className="rounded-lg object-contain"
                                        />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                                <CardDescription>
                                    Login to your GymMitra account
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {errorMessage && (
                                    <Alert variant="destructive" className="mb-6">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>
                                            {errorMessage}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <form className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="m@example.com"
                                            className="h-12 bg-white/50 border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            className="h-12 bg-white/50 border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                            Forgot Password?
                                        </a>
                                    </div>
                                    <SubmitButton
                                        formAction={login}
                                        className="w-full h-12 rounded-xl font-bold text-base premium-gradient text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                                        text="Log in"
                                        loadingText="Logging in..."
                                    />
                                </form>

                                <div className="mt-6 text-center text-sm">
                                    <p className="text-center text-sm text-drift-500 font-medium">
                                        Don&apos;t have an account?{" "}
                                        <Link href="/start-trial" className="font-medium text-primary hover:underline transition-colors">
                                            Start 30-day free trial
                                        </Link>
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col space-y-4 border-t border-white/30 p-4 bg-white/30 backdrop-blur">
                                <form className="w-full">
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-xl border-dashed border-primary/50 hover:bg-primary/5 font-semibold"
                                        formAction={demoLogin}
                                    >
                                        Try Demo Access (One Click)
                                    </Button>
                                </form>
                                <div className="flex items-center justify-center gap-4 text-center text-xs text-muted-foreground">
                                    <span>&copy; {new Date().getFullYear()} GymMitra</span>
                                    <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                                    <div className="flex items-center gap-1.5 font-bold text-slate-400 dark:text-slate-300">
                                        <Building2 className="h-3 w-3" />
                                        <span>Powered by eMitra Technologies</span>
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
