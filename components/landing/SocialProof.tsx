"use client"

import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { AnimatedNumber } from "@/components/landing/ui/AnimatedNumber"

export function SocialProof() {
    return (
        <section className="py-16 border-y border-slate-100 bg-white relative overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-center gap-12 text-center md:text-left">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">
                        Trusted by <AnimatedNumber value={50} className="text-primary font-display" />+ Elite Gyms
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                        {/* Logo Placeholders */}
                        {["FitZone", "IronGym", "CrossFit Pro", "Urban Fitness", "PowerHouse"].map((name, i) => (
                            <div key={i} className="flex items-center gap-3 font-black text-slate-900 text-2xl font-display tracking-tighter">
                                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                                {name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
