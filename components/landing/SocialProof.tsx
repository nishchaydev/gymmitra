"use client"

import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"

export function SocialProof() {
    return (
        <section className="py-12 border-y border-slate-100 bg-slate-50/50">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        Trusted by 50+ Gyms
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Logo Placeholders */}
                        {["FitZone", "IronGym", "CrossFit Pro", "Urban Fitness", "PowerHouse"].map((name, i) => (
                            <div key={i} className="flex items-center gap-2 font-bold text-slate-800 text-xl">
                                <div className="h-6 w-6 bg-slate-800/20 rounded-full" />
                                {name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
