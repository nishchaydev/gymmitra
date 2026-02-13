"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, PlayCircle, Star, Zap, ShieldCheck, Award } from "lucide-react"
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
                        <div className="inline-flex items-center rounded-full border border-[#4FC3F7]/30 bg-[#4FC3F7]/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#4FC3F7] shadow-sm mb-8">
                            <Star className="h-3.5 w-3.5 mr-2 fill-[#4FC3F7]" />
                            The #1 ERP for Modern Indian Gyms
                        </div>
                    </MotionWrapper>

                    <MotionWrapper delay={0.2}>
                        <h1 className="text-5xl md:text-8xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]">
                            Automate Your Gym's <br />
                            <span className="text-[#4FC3F7] relative">
                                Growth.
                                <svg className="absolute -bottom-2 left-0 w-full h-2 text-[#4FC3F7]/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                                </svg>
                            </span>
                            <br />
                            <span className="text-slate-400">Pure Automation.</span>
                        </h1>
                    </MotionWrapper>

                    <MotionWrapper delay={0.3}>
                        <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                            The all-in-one platform to manage members, track attendance, and automate billing.
                            Used by high-performance gyms to reclaim 20+ hours every month.
                        </p>
                    </MotionWrapper>

                    <MotionWrapper delay={0.4} className="flex flex-col sm:flex-row gap-6 justify-center w-full items-center mb-16">
                        <Link href="/login" className="w-full sm:w-auto">
                            <Button size="lg" className="h-16 px-12 text-xl rounded-full bg-[#1a365d] hover:bg-[#0f172a] text-white shadow-2xl shadow-slate-900/20 font-bold transition-all hover:-translate-y-1 hover:scale-105 active:scale-95 w-full">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </Link>

                        <button
                            onClick={() => document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto group flex items-center gap-3 px-8 py-4 rounded-full text-slate-600 font-bold hover:text-[#4FC3F7] transition-all justify-center border border-slate-200 bg-white/50 backdrop-blur-sm"
                        >
                            <PlayCircle className="w-6 h-6 text-[#4FC3F7]" />
                            <span>Watch Demo</span>
                        </button>
                    </MotionWrapper>

                    {/* Video Demo Mockup */}
                    <MotionWrapper delay={0.5} className="w-full max-w-5xl mx-auto mb-20 relative px-4" id="demo-video">
                        <div className="relative rounded-[2rem] p-2 bg-gradient-to-b from-slate-200 to-slate-400/20 shadow-2xl shadow-slate-900/20">
                            <div className="relative rounded-[1.5rem] overflow-hidden bg-slate-900 aspect-video group">
                                {/* Placeholder for Video */}
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 rounded-full bg-[#4FC3F7] flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform cursor-pointer">
                                            <PlayCircle className="w-10 h-10 fill-white" />
                                        </div>
                                        <p className="text-slate-400 font-bold tracking-tight">Demo Video Coming Soon</p>
                                    </div>
                                </div>

                                {/* Mock Browser Bar */}
                                <div className="absolute top-0 inset-x-0 h-8 bg-slate-900/80 backdrop-blur-md flex items-center px-4 gap-1.5 z-10 border-b border-white/5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                                    <div className="ml-4 h-4 w-48 rounded bg-white/5 flex items-center px-2">
                                        <div className="w-full h-1 bg-white/10 rounded-full" />
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Floating Elements */}
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary-400/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-drift-400/10 rounded-full blur-3xl" />
                        </div>
                    </MotionWrapper>

                    {/* Trust Badges & Feature Pills */}
                    <MotionWrapper delay={0.45} className="flex flex-wrap justify-center gap-3 mb-12">
                        {['WhatsApp', 'Member App', 'Biometric', 'Invoicing'].map((pill) => (
                            <div key={pill} className="px-4 py-1.5 rounded-full bg-slate-900/5 text-slate-600 text-xs font-bold border border-slate-200/50 flex items-center gap-1.5 backdrop-blur-sm">
                                <Zap className="w-3 h-3 text-[#4FC3F7]" />
                                {pill}
                            </div>
                        ))}
                    </MotionWrapper>

                    {/* Social Proof & Trust - Enhanced */}
                    <MotionWrapper delay={0.5} className="flex flex-col items-center gap-8 mb-20 w-full">
                        <div className="flex flex-col md:flex-row items-center gap-6 py-5 px-10 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <img
                                        key={i}
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=owner${i}`}
                                        className="w-12 h-12 rounded-full border-4 border-white shadow-lg bg-white"
                                        alt="Owner"
                                    />
                                ))}
                                <div className="w-12 h-12 rounded-full border-4 border-white bg-[#4FC3F7]/10 flex items-center justify-center text-[#4FC3F7] text-xs font-bold shadow-lg backdrop-blur-sm">
                                    +50
                                </div>
                            </div>
                            <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
                            <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                                </div>
                                <div className="text-sm text-slate-500 font-medium">
                                    Trusted by <span className="font-bold text-slate-900 tracking-tight">50+ local gym owners</span> across India
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" /> No Credit Card Needed
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <Zap className="w-5 h-5 text-amber-500" /> 10 Min Setup
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <Award className="w-5 h-5 text-blue-500" /> Cancel Anytime
                            </div>
                        </div>
                    </MotionWrapper>

                    {/* Stats Section with better hierarchy */}
                    <div className="w-full max-w-4xl mx-auto pt-16 border-t border-slate-100/80">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24 text-center">
                            <StatCounter value={50} suffix="+" label="Gym Partners" />
                            <StatCounter value={10000} suffix="+" label="Daily Users" />
                            <StatCounter value={99.9} suffix="%" label="Server Uptime" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

function StatCounter({ value, suffix, label }: { value: number, suffix: string, label: string }) {
    return (
        <div className="group">
            <div className="text-3xl md:text-5xl font-black text-[#1a365d] mb-2 group-hover:text-[#4FC3F7] transition-colors">
                <AnimatedNumber value={value} />{suffix}
            </div>
            <div className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                {label}
            </div>
        </div>
    )
}

