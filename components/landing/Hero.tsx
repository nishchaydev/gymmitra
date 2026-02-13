"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react"
import Link from "next/link"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white">
            {/* Background Gradients */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-drift-50 to-white -z-20" />
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary-200/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-drift-200/50 rounded-full blur-[120px] -z-10" />

            {/* Wave Pattern */}
            <div className="absolute inset-0 -z-10 opacity-[0.03]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="wave-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <path d="M0 50 Q 25 30, 50 50 T 100 50" stroke="#4FC3F7" strokeWidth="1.5" fill="none" />
                            <path d="M0 60 Q 25 40, 50 60 T 100 60" stroke="#4FC3F7" strokeWidth="1" fill="none" opacity="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#wave-pattern)" />
                </svg>
            </div>

            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">

                    <MotionWrapper delay={0.1}>
                        <div className="inline-flex items-center rounded-full border border-drift-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow-sm mb-6">
                            <span className="flex h-2 w-2 rounded-full bg-primary-500 mr-2 animate-pulse"></span>
                            The #1 ERP for Modern Indian Gyms
                        </div>
                    </MotionWrapper>

                    <MotionWrapper delay={0.2}>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                            Automate Your Gym's <span className="text-primary-500">Growth</span>. <br />
                            Stop Chasing <span className="text-slate-500">Payments</span>.
                        </h1>
                    </MotionWrapper>

                    <MotionWrapper delay={0.3}>
                        <p className="text-xl text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">
                            The all-in-one platform to manage members, track attendance, and automate billing.
                            Used by 50+ smart gym owners to save 20 hours/month.
                        </p>
                    </MotionWrapper>

                    <MotionWrapper delay={0.4} className="flex flex-col sm:flex-row gap-4 justify-center w-full items-center mb-12">
                        <Link href="/login?view=register">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary-600 text-white shadow-xl shadow-primary/20 font-bold transition-all hover:-translate-y-1 w-full sm:w-auto">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>

                        <button className="group relative flex items-center gap-3 px-6 py-3 rounded-full text-slate-600 font-medium hover:bg-drift-50 transition-colors">
                            <div className="relative">
                                <PlayCircle className="w-10 h-10 text-primary fill-primary-50" />
                                <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                            </div>
                            <span className="group-hover:text-primary transition-colors">Watch 2-min Demo</span>
                        </button>
                    </MotionWrapper>

                    {/* Stats Counters */}
                    <MotionWrapper delay={0.5} className="grid grid-cols-3 gap-4 md:gap-12 max-w-2xl mx-auto border-t border-slate-100 pt-8 w-full">
                        <StatCounter end={50} suffix="+" label="Gyms Trust Us" duration={2} />
                        <StatCounter end={12000} suffix="+" label="Members Managed" duration={2.5} />
                        <StatCounter end={99.9} suffix="%" label="Uptime Reliability" duration={2} />
                    </MotionWrapper>

                </div>
            </div>
        </section>
    )
}

function StatCounter({ end, suffix, label, duration }: { end: number, suffix: string, label: string, duration: number }) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let start = 0
        const stepTime = Math.abs(Math.floor(duration * 1000 / end))
        const timer = setInterval(() => {
            start += 1
            setCount(start)
            if (start === end) clearInterval(timer)
        }, stepTime)
        return () => clearInterval(timer)
    }, [end, duration])

    return (
        <div className="text-center">
            <div className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-1">
                {count}{suffix}
            </div>
            <div className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wide">
                {label}
            </div>
        </div>
    )
}
