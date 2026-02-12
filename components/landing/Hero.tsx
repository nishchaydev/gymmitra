"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { motion } from "framer-motion"

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white">
            {/* Background Gradients */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-slate-50 to-white -z-20" />
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#10b981]/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-[#1e3a8a]/5 rounded-full blur-[120px] -z-10" />

            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">

                    <MotionWrapper delay={0.1}>
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow-sm mb-6">
                            <span className="flex h-2 w-2 rounded-full bg-[#10b981] mr-2 animate-pulse"></span>
                            The #1 ERP for Modern Indian Gyms
                        </div>
                    </MotionWrapper>

                    <MotionWrapper delay={0.2}>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#0f172a] mb-6 leading-tight">
                            Automate Your Gym's <span className="text-[#10b981]">Growth</span>. <br />
                            Stop Chasing <span className="text-[#1e3a8a]">Payments</span>.
                        </h1>
                    </MotionWrapper>

                    <MotionWrapper delay={0.3}>
                        <p className="text-xl text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">
                            The all-in-one platform to manage members, track attendance, and automate billing.
                            Used by 50+ smart gym owners to save 20 hours/month.
                        </p>
                    </MotionWrapper>

                    <MotionWrapper delay={0.4} className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                        <Link href="/login?view=register">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-[#1e3a8a] text-white hover:bg-[#172554] shadow-xl shadow-blue-900/20 font-bold transition-all hover:-translate-y-1 w-full sm:w-auto">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="#pricing">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 font-bold bg-white w-full sm:w-auto">
                                View Pricing
                            </Button>
                        </Link>
                    </MotionWrapper>

                    <MotionWrapper delay={0.5} className="mt-8 flex items-center justify-center gap-6 text-sm font-medium text-slate-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                            <span>14-day free trial</span>
                        </div>
                    </MotionWrapper>

                </div>

                {/* Dashboard Preview Mockup */}
                <MotionWrapper delay={0.6} direction="up" className="relative max-w-5xl mx-auto">
                    <div className="rounded-[24px] border border-slate-200/60 bg-white/50 p-2 shadow-2xl shadow-slate-200/50 backdrop-blur-sm">
                        <div className="rounded-[20px] overflow-hidden border border-slate-100 bg-slate-50 aspect-[16/9] relative group">
                            {/* Placeholder for Dashboard Image - Gradient for now */}
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                                <div className="text-center">
                                    <div className="h-20 w-20 bg-white rounded-2xl shadow-lg mx-auto mb-4 flex items-center justify-center">
                                        <div className="h-10 w-10 bg-[#10b981] rounded-lg animate-pulse" />
                                    </div>
                                    <p className="text-slate-400 font-medium">Dashboard Preview</p>
                                </div>
                            </div>

                            {/* Floating UI Elements */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-12 left-12 bg-white p-4 rounded-xl shadow-lg border border-slate-100 max-w-[200px]"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">₹</div>
                                    <div>
                                        <div className="text-xs text-slate-500">Revenue Today</div>
                                        <div className="font-bold text-slate-800">₹12,500</div>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full w-[70%] bg-green-500 rounded-full" />
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute bottom-12 right-12 bg-white p-4 rounded-xl shadow-lg border border-slate-100 max-w-[200px]"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">●</div>
                                    <div>
                                        <div className="text-xs text-slate-500">Active Members</div>
                                        <div className="font-bold text-slate-800">342</div>
                                    </div>
                                </div>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200" />
                                    ))}
                                </div>
                            </motion.div>

                        </div>
                    </div>
                    {/* Glow behind dashboard */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-[#10b981]/20 to-[#1e3a8a]/20 blur-2xl -z-10 opacity-50 rounded-[30px]" />
                </MotionWrapper>

            </div>
        </section>
    )
}
