"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"

export function FinalCTA() {
    return (
        <section className="py-32 relative overflow-hidden bg-[#0f172a]">
            {/* Background Effects - More subtle noise and gradients */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />

            {/* Soft Glows */}
            <div className="absolute -top-[50%] -left-[20%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute -bottom-[50%] -right-[20%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />

            <div className="container px-4 md:px-6 mx-auto relative z-10 text-center">
                <MotionWrapper>
                    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-primary backdrop-blur-md mb-10">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Limited Time Launch Offer
                    </div>
                </MotionWrapper>

                <MotionWrapper delay={0.1}>
                    <h2 className="text-4xl md:text-7xl font-black tracking-tight text-white mb-8 leading-tight max-w-4xl mx-auto font-display">
                        Ready to automate your <span className="text-primary">success?</span>
                    </h2>
                </MotionWrapper>

                <MotionWrapper delay={0.2}>
                    <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                        Join 50+ smart gym owners who have reclaimed their time.
                        Start your <span className="text-white font-bold">14-day free trial</span> today.
                    </p>
                </MotionWrapper>

                <MotionWrapper delay={0.3} className="flex flex-col items-center">
                    <Button asChild size="lg" className="h-16 px-12 text-xl rounded-full bg-white text-midnight hover:bg-primary hover:text-white font-black shadow-2xl shadow-primary/20 transition-all duration-300 hover:-translate-y-2 active:scale-95 group uppercase tracking-widest">
                        <Link href="#contact" className="flex items-center">
                            Start Your Free Trial
                            <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-10 font-black uppercase tracking-[0.2em]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Includes full feature access • No credit card required
                    </div>
                </MotionWrapper>
            </div>
        </section>
    )
}
