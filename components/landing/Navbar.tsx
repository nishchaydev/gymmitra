"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dumbbell, Menu } from "lucide-react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"

export function Navbar() {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const { scrollY } = useScroll()

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
                    <div className="bg-[#1e3a8a] p-2 rounded-xl shadow-lg shadow-blue-900/10 group-hover:scale-105 transition-transform duration-300">
                        <Dumbbell className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-bold text-xl text-[#0f172a] tracking-tight">Gym<span className="text-[#1e3a8a]">Mitra</span></span>
                        <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">Technologies</span>
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    {["Products", "Pricing", "Company"].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="hover:text-[#1e3a8a] transition-colors relative group"
                        >
                            {item}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1e3a8a] transition-all group-hover:w-full rounded-full" />
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="hidden md:block">
                        <Button variant="ghost" className="text-slate-600 hover:text-[#1e3a8a] font-medium hover:bg-slate-50">
                            Login
                        </Button>
                    </Link>
                    <Link href="/login?view=register">
                        <Button className="bg-[#1e3a8a] text-white hover:bg-[#172554] font-semibold px-6 rounded-full shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                            Request a Demo
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-6 w-6 text-slate-700" />
                    </Button>
                </div>
            </div>
        </motion.header>
    )
}
