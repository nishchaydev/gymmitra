"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dumbbell, Menu } from "lucide-react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

export function Navbar() {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [user, setUser] = React.useState<User | null>(null)
    const { scrollY } = useScroll()
    const supabase = createClient()

    React.useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 20)
    })

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent",
                isScrolled
                    ? "bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm border-slate-200/50"
                    : "bg-transparent"
            )}
        >
            <div className="container flex h-20 items-center justify-between px-4 md:px-6 mx-auto">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="bg-drift-200 p-2 rounded-xl shadow-lg shadow-drift-200/10 group-hover:scale-105 transition-transform duration-300">
                        <Dumbbell className="h-5 w-5 text-[#4FC3F7]" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-bold text-xl text-slate-900 tracking-tight">Gym<span className="text-brand-primary">Mitra</span></span>
                        <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">Technologies</span>
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <Link href="#products" className="hover:text-[#4FC3F7] transition-colors relative group">
                        Products
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4FC3F7] transition-all group-hover:w-full rounded-full" />
                    </Link>
                    <Link href="#pricing" className="hover:text-[#4FC3F7] transition-colors relative group">
                        Pricing
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4FC3F7] transition-all group-hover:w-full rounded-full" />
                    </Link>
                    <a
                        href="https://emitra.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#4FC3F7] transition-colors relative group"
                    >
                        Company
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4FC3F7] transition-all group-hover:w-full rounded-full" />
                    </a>
                </nav>

                <div className="flex items-center gap-4">
                    {user ? (
                        <Link href="/dashboard">
                            <Button className="bg-[#4FC3F7] hover:bg-[#3FB3E7] text-white font-semibold px-6 rounded-full shadow-lg shadow-[#4FC3F7]/20 hover:shadow-[#4FC3F7]/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                Go to Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="hidden md:block">
                                <Button variant="ghost" className="text-slate-600 hover:text-[#4FC3F7] font-medium hover:bg-drift-50">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/login?view=register">
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 rounded-full shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                    Request a Demo
                                </Button>
                            </Link>
                        </>
                    )}
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-6 w-6 text-slate-700" />
                    </Button>
                </div>
            </div>
        </motion.header>
    )
}
