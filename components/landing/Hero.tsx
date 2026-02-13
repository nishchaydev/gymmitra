"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, PlayCircle, Star } from "lucide-react"
import Link from "next/link"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { AnimatedNumber } from "@/components/landing/ui/AnimatedNumber"
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
                        <div className="inline-flex items-center rounded-full border border-primary-100 bg-primary-50/50 px-3 py-1 text-sm font-semibold text-primary-700 shadow-sm mb-6">
                            <Star className="h-3.5 w-3.5 mr-2 text-primary-500 fill-primary-500" />
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

                    <MotionWrapper delay={0.4} className="flex flex-col sm:flex-row gap-6 justify-center w-full items-center mb-12">
                        <Link href="/login?view=register" className="w-full sm:w-auto">
                            <Button size="lg" className="h-16 px-10 text-xl rounded-2xl bg-primary hover:bg-primary-600 text-white shadow-2xl shadow-primary/30 font-extrabold transition-all hover:-translate-y-1 hover:scale-105 active:scale-95 w-full">
                                Start 14-Day Free Trial
                                <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </Link>

                        <Link href="/dashboard" className="w-full sm:w-auto">
                            <button className="group relative flex items-center gap-3 px-6 py-3 rounded-full text-slate-500 font-semibold hover:text-primary transition-all w-full justify-center">
                                <PlayCircle className="w-7 h-7 text-primary/80 group-hover:text-primary transition-colors" />
                                <span>Watch 2-min Demo</span>
                            </button>
                        </Link>
                    </MotionWrapper>

                    {/* Stats Counters */}
                    <MotionWrapper delay={0.5} className="grid grid-cols-3 gap-4 md:gap-12 max-w-2xl mx-auto border-t border-slate-100 pt-8 w-full">
                        <StatCounter value={50} suffix="+" label="Gyms Trust Us" />
                        <StatCounter value={12000} suffix="+" label="Members Managed" />
                        <StatCounter value={99} suffix="%" label="Uptime Reliability" />
                    </MotionWrapper>

                </div>
            </div>
        </section>
    )
}

function StatCounter({ value, suffix, label }: { value: number, suffix: string, label: string }) {
    return (
        <div className="text-center">
            <div className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-1">
                <AnimatedNumber value={value} />{suffix}
            </div>
            <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                {label}
            </div>
        </div>
    )
}
