"use client"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { AnimatedNumber } from "@/components/landing/ui/AnimatedNumber"

export function SocialProof() {
    return (
        <section className="py-16 border-y border-slate-100 bg-white relative overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-center gap-12 text-center md:text-left">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">
                        Currently powering <span className="text-primary font-display">TRI-STAR FITNESS</span>
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
                        <div className="flex items-center gap-3 font-black text-slate-900 text-2xl font-display tracking-tighter">
                            <div className="h-2 w-2 bg-primary rounded-full" />
                            TRI-STAR FITNESS
                            <br />
                            <span className="text-xs font-medium text-slate-600 block">Indore's fastest growing gym — live since 2025</span>
                        </div>
                        <div className="h-2 w-2 bg-primary rounded-full" />
                        <div className="flex items-center gap-3 font-black text-slate-900 text-2xl font-display tracking-tighter">
                            <div className="h-2 w-2 bg-primary rounded-full" />
                            500+ members managed
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}