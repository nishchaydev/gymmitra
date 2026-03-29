"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Menu, X, ArrowUpRight } from "lucide-react"
import { motion, useScroll, useMotionValueEvent, AnimatePresence, useTransform } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

export function Navbar() {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const { scrollY } = useScroll()
    const [user, setUser] = React.useState<User | null>(null)
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

    const navLinks = [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Company", href: "https://emitra.vercel.app", isExternal: true },
    ]

    // Smoother Interpolated Values for the Floating Bar
    const navWidth = useTransform(scrollY, [0, 100], ["100%", "90%"])
    const navMaxWidth = useTransform(scrollY, [0, 100], ["1536px", "1200px"])
    const navY = useTransform(scrollY, [0, 100], [0, 16])
    const navPaddingX = useTransform(scrollY, [0, 100], [24, 32])
    const navPaddingY = useTransform(scrollY, [0, 100], [16, 12])
    const navBorderRadius = useTransform(scrollY, [0, 100], [0, 9999])

    return (
        <>
            <motion.header
                style={{
                    width: navWidth,
                    maxWidth: navMaxWidth,
                    y: navY,
                    borderRadius: navBorderRadius,
                    x: "-50%",
                }}
                className={cn(
                    "fixed top-0 left-1/2 z-[100] transition-colors duration-500",
                    isScrolled ? "glass-card shadow-2xl border-white/40" : "bg-transparent"
                )}
            >
                <motion.div 
                    style={{ 
                        paddingTop: navPaddingY, 
                        paddingBottom: navPaddingY,
                        paddingLeft: navPaddingX,
                        paddingRight: navPaddingX,
                    }}
                    className="flex items-center justify-between mx-auto w-full transition-all duration-500"
                >
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-3 group shrink-0">
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
                            <span className="font-display font-black text-2xl text-slate-900 tracking-tighter">Gym<span className="text-primary italic">Mitra</span></span>
                            {!isScrolled && (
                                <motion.span 
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: isScrolled ? 0 : 1 }}
                                    className="text-[8px] font-black text-slate-400 tracking-[0.3em] uppercase mt-0.5 ml-0.5"
                                >
                                    Premium ERP
                                </motion.span>
                            )}
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name}
                                href={link.href}
                                target={link.isExternal ? "_blank" : undefined}
                                rel={link.isExternal ? "noopener noreferrer" : undefined}
                                className="hover:text-primary transition-colors relative group"
                            >
                                {link.name}
                                {link.isExternal && <ArrowUpRight className="inline-block w-3 h-3 ml-0.5 opacity-40" />}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full" />
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="flex items-center gap-3">
                        <div className="hidden items-center gap-3 md:flex">
                            {user ? (
                                <Button asChild className="bg-slate-900 text-white font-bold px-6 rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]">
                                    <Link href="/dashboard">Dashboard</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button asChild className="font-black bg-primary/10 hover:bg-primary/20 text-primary transition-all uppercase tracking-widest text-[10px] px-6 rounded-xl border-none shadow-none active:scale-[0.97]">
                                        <Link href="/login">Login</Link>
                                    </Button>
                                    <Button asChild className="bg-slate-900 text-white font-bold px-8 h-11 rounded-full shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                                        <Link href="/start-trial">Start Free Trial</Link>
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Mobile Toggle */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="md:hidden relative z-[102] bg-white/50 backdrop-blur-md rounded-full border border-white/20 active:scale-95" 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <AnimatePresence mode="wait">
                                {isMobileMenuOpen ? (
                                    <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                                        <X className="h-6 w-6 text-slate-900" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                                        <Menu className="h-6 w-6 text-slate-900" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>
                </motion.div>
            </motion.header>

            {/* Premium Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[101] bg-white/95 backdrop-blur-xl md:hidden flex flex-col items-center justify-center pointer-events-auto"
                    >
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] -z-10" />
                        
                        <nav className="flex flex-col items-center gap-8 text-center">
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                >
                                    <Link 
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="text-4xl font-black text-slate-900 tracking-tighter hover:text-primary transition-colors block"
                                    >
                                        {link.name}
                                    </Link>
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                className="flex flex-col gap-4 mt-8 w-[280px]"
                            >
                                <Button asChild className="w-full bg-slate-900 text-white font-bold h-14 rounded-2xl text-lg">
                                    <Link href="/start-trial" onClick={() => setIsMobileMenuOpen(false)}>Start Free Trial</Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full border-slate-200 text-slate-600 font-bold h-14 rounded-2xl text-lg bg-white">
                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                                </Button>
                            </motion.div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
