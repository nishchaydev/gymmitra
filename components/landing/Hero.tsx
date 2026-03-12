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
        <section className="relative pt-32 pb-12 md:pt-20 md:pb-20 overflow-hidden bg-white circuit-bg">
            {/* Background Gradients */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-drift-silver/20 to-white -z-20" />
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-midnight/5 rounded-full blur-[120px] -z-10" />

            <div className="container px-4 md:px-6 mx-auto relative">
                {/* Repositioned Floating Insight Cards (Above Fold) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="absolute left-0 top-20 z-20 hidden lg:block"
                >
                    <div className="glass-card p-3 rounded-2xl shadow-xl flex items-center gap-3 pr-6 rotate-[-5deg] hover:rotate-0 transition-transform duration-300">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 relative">
                            <div className="absolute top-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                            <span className="text-lg" role="img" aria-label="muscle">💪</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Now</p>
                            <p className="text-sm font-black text-slate-900">Live Dashboard</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="absolute right-0 top-32 z-20 hidden lg:block"
                >
                    <div className="bg-midnight text-white p-3 rounded-2xl shadow-xl shadow-midnight/20 flex items-center gap-3 pr-6 border border-white/10 rotate-[5deg] hover:rotate-0 transition-transform duration-300">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <span className="text-lg">₹</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Daily Revenue</p>
                            <p className="text-sm font-black text-white">₹12,450 <span className="text-emerald-400 text-[10px] ml-1">▲</span></p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="absolute left-8 bottom-32 z-20 hidden lg:block"
                >
                    <div className="glass-card p-3 rounded-2xl shadow-xl flex items-center gap-3 pr-6 rotate-[3deg] hover:rotate-0 transition-transform duration-300">
                        <div className="h-10 w-10 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                            <Zap className="h-5 w-5 text-[#25D366] fill-[#25D366]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auto-Reminder</p>
                            <p className="text-sm font-black text-slate-800 flex items-center gap-1">
                                WhatsApp Sent <CheckCircle2 className="h-3 w-3 text-[#25D366]" />
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-10">

                    <MotionWrapper delay={0.1}>
                        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm mb-6">
                            <Star className="h-3.5 w-3.5 mr-2 fill-primary" />
                            The #1 ERP for Modern Indian Gyms
                        </div>
                    </MotionWrapper>

                    <MotionWrapper delay={0.2}>
                        <h1 className="text-4xl md:text-8xl font-black tracking-tight text-slate-900 mb-6 leading-[1.1] font-display">
                            Automate Your Gym&apos;s <br />
                            <span className="text-primary relative">
                                Growth.
                                <svg className="absolute -bottom-2 left-0 w-full h-2 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                                </svg>
                            </span>
                            <br />
                            <span className="text-slate-400">Pure Automation.</span>
                        </h1>
                    </MotionWrapper>

                    <MotionWrapper delay={0.3}>
                        <p className="text-xl text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
                            <strong className="font-medium">Gym Mitra</strong> – The all-in-one platform to manage members, track attendance, and automate billing.
                            Used by high-performance gyms to reclaim 20+ hours every month.
                        </p>
                    </MotionWrapper>

                    <MotionWrapper delay={0.4} className="flex flex-col sm:flex-row gap-6 justify-center w-full items-center mb-8">
                        <Link href="/login" className="w-full sm:w-auto">
                            <Button className="w-full h-14 px-8 text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 transition-all active:scale-95 uppercase tracking-widest rounded-2xl">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </Link>

                        <button
                            onClick={() => document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto group flex items-center gap-3 px-8 py-4 rounded-full text-slate-600 font-bold hover:text-primary transition-all justify-center border border-drift-silver bg-white/50 backdrop-blur-sm"
                        >
                            <PlayCircle className="w-6 h-6 text-primary" />
                            <span>Watch Demo</span>
                        </button>
                    </MotionWrapper>

                    {/* Video Demo Mockup */}
                    <MotionWrapper delay={0.5} className="w-full max-w-5xl mx-auto mb-16 relative px-4" id="demo-video">
                        <div className="relative rounded-[2rem] p-2 bg-gradient-to-b from-drift-silver to-drift-silver/20 shadow-2xl shadow-slate-900/20">
                            <div className="relative rounded-[1.5rem] overflow-hidden bg-slate-900 aspect-video group">
                                {/* Placeholder for Video */}
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform cursor-pointer">
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
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-midnight/10 rounded-full blur-3xl" />

                        </div>
                    </MotionWrapper>

                    {/* Social Activity Ticker - New Addition */}
                    <MotionWrapper delay={0.4} className="w-full max-w-3xl mx-auto mb-12 overflow-hidden pointer-events-none">
                        <div className="relative flex items-center gap-8 opacity-70">
                            {/* Gradient Masks */}
                            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
                            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

                            <motion.div
                                className="flex items-center gap-8 whitespace-nowrap"
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
                            >
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-8 text-xs font-bold text-slate-500">
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            TRI-STAR FITNESS just added <span className="text-slate-900">new members</span>
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '75ms' }} />
                                            Fees collected successfully
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '150ms' }} />
                                            WhatsApp alerts delivered
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '300ms' }} />
                                            New leads updated
                                        </span>
                                        <span>•</span>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </MotionWrapper>

                    {/* Social Proof - Moved Up */}
                    <MotionWrapper delay={0.45} className="flex flex-col items-center gap-4 mb-12">
                        <div className="flex items-center gap-4 bg-white glass-card rounded-full pl-2 pr-6 py-2 shadow-sm relative z-10">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <img
                                        key={i}
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=owner${i}`}
                                        className="w-8 h-8 rounded-full border-2 border-white bg-white"
                                        alt="Owner"
                                        width={32}
                                        height={32}
                                        loading="lazy"
                                    />
                                ))}
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shadow-sm backdrop-blur-sm">
                                    +50
                                </div>
                            </div>
                            <div className="h-6 w-[1px] bg-drift-silver" />
                            <div className="flex flex-col items-start leading-none gap-1">
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                                </div>
                                <div className="text-xs text-slate-600 font-bold">
                                    Trusted by <span className="text-primary">TRI-STAR FITNESS</span>
                                </div>
                            </div>
                        </div>
                    </MotionWrapper>

                    <MotionWrapper delay={0.45} className="flex flex-wrap justify-center gap-3 mb-8">
                        {['WhatsApp', 'Attendance', 'Invoicing', 'Auto-Wishes'].map((pill) => (
                            <div key={pill} className="px-4 py-1.5 rounded-full bg-slate-900/5 text-slate-600 text-xs font-bold border border-drift-silver flex items-center gap-1.5 backdrop-blur-sm">
                                <Zap className="w-3 h-3 text-primary" />
                                {pill}
                            </div>
                        ))}
                    </MotionWrapper>

                    {/* Feature Benefits */}
                    <MotionWrapper delay={0.5} className="flex flex-col items-center gap-8 mb-16 w-full">
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
                    <div className="w-full max-w-4xl mx-auto pt-12 border-t border-drift-silver/50">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24 text-center">
                            <StatCounter value={1} suffix="" label="Live Gym" />
                            <StatCounter value={500} suffix="+" label="Members Managed" />
                            <StatCounter value={100} suffix="%" label="Automation Uptime" />
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
            <div className="text-3xl md:text-5xl font-black text-midnight mb-2 group-hover:text-primary transition-colors font-display">
                <AnimatedNumber value={value} />{suffix}
            </div>
            <div className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                {label}
            </div>
        </div>
    )
}

