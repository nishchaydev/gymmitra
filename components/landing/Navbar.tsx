"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

export function Navbar() {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const router = useRouter()
    const [user, setUser] = React.useState<User | null>(null)
    const { scrollY } = useScroll()
    const supabase = createClient()

    React.useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                const onboardedCookie = document.cookie.split('; ').find(row => row.startsWith('gym_onboarded='))
                const isOnboarded = onboardedCookie?.split('=')[1] === 'true'
                router.push(isOnboarded ? '/dashboard' : '/onboarding')
            }
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                const onboardedCookie = document.cookie.split('; ').find(row => row.startsWith('gym_onboarded='))
                const isOnboarded = onboardedCookie?.split('=')[1] === 'true'
                router.push(isOnboarded ? '/dashboard' : '/onboarding')
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase, router])

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 20)
    })

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className={cn(
                    "fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent",
                    isScrolled
                        ? "bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm border-drift-200/50"
                        : "bg-transparent"
                )}
            >
                <div className="container flex h-20 items-center justify-between px-4 md:px-6 mx-auto">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="bg-primary/10 p-1.5 rounded-xl shadow-lg shadow-primary/5 group-hover:scale-105 transition-transform duration-300">
                            <Image
                                src="/icon.png"
                                alt="GymMitra Logo"
                                width={32}
                                height={32}
                                className="rounded-lg object-contain"
                            />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="font-display font-bold text-xl text-drift-900 tracking-tight">Gym<span className="text-primary">Mitra</span></span>
                            <span className="text-[9px] font-black text-drift-500 tracking-[0.2em] uppercase mt-0.5">Technologies</span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-drift-700">
                        <Link href="#features" className="hover:text-primary transition-colors relative group">
                            Features
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full" />
                        </Link>
                        <Link href="#pricing" className="hover:text-primary transition-colors relative group">
                            Pricing
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full" />
                        </Link>
                        <a
                            href="https://emitra.vercel.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors relative group"
                        >
                            Company
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full" />
                        </a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <Button asChild className="hidden md:flex bg-primary hover:bg-primary-600 text-white font-bold px-6 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                <Link href="/dashboard">
                                    Go to Dashboard
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild className="hidden md:flex font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all uppercase tracking-widest text-xs px-6">
                                    <Link href="/login">
                                        Login
                                    </Link>
                                </Button>
                                <Button asChild className="hidden md:flex bg-midnight text-white font-semibold px-6 rounded-full shadow-lg shadow-midnight/20 hover:bg-midnight/90 hover:shadow-midnight/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                    <Link href="/start-trial">
                                        Start Free Trial
                                    </Link>
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMobileMenuOpen}>
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6 text-drift-700" />
                            ) : (
                                <Menu className="h-6 w-6 text-drift-700" />
                            )}
                        </Button>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu Overlay */}
            <div className={cn("fixed inset-0 z-[100] bg-drift-900/60 backdrop-blur-sm transition-all duration-300 md:hidden", isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible")} onClick={() => setIsMobileMenuOpen(false)} />

            {/* Mobile Menu Sheet */}
            <div className={cn("fixed top-0 right-0 h-[100dvh] w-[280px] bg-white z-[101] shadow-2xl transition-transform duration-300 transform md:hidden flex flex-col", isMobileMenuOpen ? "translate-x-0" : "translate-x-full")}>
                <div className="p-6 border-b flex justify-between items-center bg-drift-50">
                    <span className="font-display font-bold text-xl text-primary">GymMitra</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white rounded-full shadow-sm" aria-label="Close mobile menu"><X className="w-5 h-5 text-drift-600" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    <nav className="flex flex-col gap-4 text-sm font-bold text-drift-700">
                        <Link href="#products" onClick={() => setIsMobileMenuOpen(false)} className="py-2 border-b border-drift-100">Products</Link>
                        <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="py-2 border-b border-drift-100">Pricing</Link>
                    </nav>
                    <div className="mt-auto flex flex-col gap-4 pt-6 border-t border-drift-100">
                        {user ? (
                            <Button asChild className="w-full bg-primary text-white font-bold rounded-full">
                                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Go to Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild className="w-full bg-primary text-white font-bold rounded-full">
                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full font-bold rounded-full">
                                    <Link href="/start-trial" onClick={() => setIsMobileMenuOpen(false)}>Start Free Trial</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
