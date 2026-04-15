"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, ShieldCheck, Award, Sparkles } from "lucide-react"
import Link from "next/link"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { AnimatedNumber } from "@/components/landing/ui/AnimatedNumber"
import { motion } from "framer-motion"

export function Hero() {
    return (
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden bg-white">
            {/* Minimal Decorative Accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -z-10" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto">

                    <MotionWrapper delay={0.1}>
                        <div className="inline-flex items-center rounded-full border border-slate-100 bg-slate-50/50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8">
                            <Sparkles className="h-3 w-3 mr-2 text-primary" />
                            Premium Gym Management ERP
                        </div>
                    </MotionWrapper>

                    <MotionWrapper delay={0.2}>
                        <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.95] font-display">
                            Automate <br />
                            <span className="text-primary italic">Gym&apos;s Growth.</span>
                            <br />
                            <span className="text-slate-200 uppercase">Zero Manual Work.</span>
                        </h1>
                    </MotionWrapper>

                    <MotionWrapper delay={0.3}>
                        <p className="text-lg md:text-xl text-slate-500 mb-10 leading-relaxed font-bold max-w-2xl">
                            <span className="text-slate-900 font-black decoration-primary/20 decoration-4 underline-offset-4 underline">GymMitra</span> is the all-in-one platform to manage members, automate billing, and streamline operations for your facility.
                        </p>
                    </MotionWrapper>

                    <MotionWrapper delay={0.4} className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                        <Link href="/start-trial" className="w-full sm:w-auto">
                            <Button className="w-full h-14 px-10 text-lg font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10 transition-all active:scale-[0.97] uppercase tracking-widest rounded-2xl group">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>

                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto group flex items-center gap-3 px-8 h-14 rounded-2xl text-slate-600 font-bold hover:text-primary transition-all justify-center border border-slate-200 bg-white active:scale-[0.97]"
                        >
                            <Zap className="w-5 h-5 text-primary" />
                            <span className="uppercase tracking-widest text-xs">Explore Features ↓</span>
                        </button>
                    </MotionWrapper>

                    {/* Trust Signals */}
                    <MotionWrapper delay={0.5} className="mt-16 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span>Secure Cloud</span>
                            </div>
                            <div className="h-4 w-px bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span>30-Day Free Trial</span>
                            </div>
                            <div className="h-4 w-px bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-amber-500" />
                                <span>Made in India</span>
                            </div>
                        </div>
                    </MotionWrapper>

                    {/* Bottom Product Indicators */}
                    <MotionWrapper delay={0.8} className="mt-20 pt-10 border-t border-slate-100 w-full">
                        <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60">
                            <StatItem value={30} label="Day Free Trial" suffix="" />
                            <StatItem value={10} label="Core Features" suffix="+" />
                            <StatItem value={100} label="System Uptime" suffix="%" />
                        </div>
                    </MotionWrapper>
                </div>
            </div>
        </section>
    )
}

function StatItem({ value, label, suffix }: { value: number, label: string, suffix: string }) {
    return (
        <div className="group text-center">
            <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1 group-hover:text-primary transition-colors">
                <AnimatedNumber value={value} />{suffix}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {label}
            </div>
        </div>
    )
}
