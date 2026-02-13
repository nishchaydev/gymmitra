"use client"

import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { Building2, GraduationCap, Hospital, ArrowRight } from "lucide-react"

export function AboutEMitra() {
    return (
        <section className="py-24 bg-slate-50 overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <MotionWrapper delay={0.1}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 mb-8 shadow-sm">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span className="text-sm font-black text-slate-700">
                                Built by eMitra Technologies
                            </span>
                        </div>
                    </MotionWrapper>

                    <MotionWrapper delay={0.2}>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                            More Than Just <span className="text-primary">Gym Software</span>.
                        </h2>
                    </MotionWrapper>

                    <MotionWrapper delay={0.3}>
                        <p className="text-lg text-slate-700 mb-12 leading-relaxed font-medium">
                            Gym Mitra is the flagship product of eMitra Technologies, a team obsessed
                            with solving India's small business challenges through <span className="text-slate-900 font-bold">intelligent automation</span>.
                        </p>
                    </MotionWrapper>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        {/* Gym Mitra */}
                        <MotionWrapper delay={0.4} className="h-full">
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                    <span className="text-2xl" role="img" aria-label="weightlifter emoji">🏋️</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Gym Mitra</h3>
                                <p className="text-sm text-slate-700 font-medium mb-4 flex-1">
                                    Complete fitness center management with automated billing and member app.
                                </p>
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold w-fit">
                                    Live Now
                                </span>
                            </div>
                        </MotionWrapper>

                        {/* School Mitra */}
                        <MotionWrapper delay={0.5} className="h-full">
                            <div className="bg-white/60 rounded-3xl p-8 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col group opacity-80">
                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 grayscale group-hover:grayscale-0 transition-all">
                                    <GraduationCap className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-500 group-hover:text-slate-900 transition-colors mb-2">School Mitra</h3>
                                <p className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors mb-4 flex-1 font-medium">
                                    Next-gen education ERP for modern Indian schools and coaching centers.
                                </p>
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black w-fit">
                                    Coming Q3 2026
                                </span>
                            </div>
                        </MotionWrapper>

                        {/* Clinic Mitra */}
                        <MotionWrapper delay={0.6} className="h-full">
                            <div className="bg-white/60 rounded-3xl p-8 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col group opacity-80">
                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 grayscale group-hover:grayscale-0 transition-all">
                                    <Hospital className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-500 group-hover:text-slate-900 transition-colors mb-2">Clinic Mitra</h3>
                                <p className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors mb-4 flex-1 font-medium">
                                    Simplified healthcare management for clinics and diagnostic centers.
                                </p>
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black w-fit">
                                    Planned 2027
                                </span>
                            </div>
                        </MotionWrapper>
                    </div>

                    <MotionWrapper delay={0.7} className="mt-16">
                        <p className="text-sm font-bold text-slate-500 flex items-center justify-center gap-2">
                            Learn more about our mission at
                            <a href="https://emitra.tech" target="_blank" rel="noopener noreferrer" className="text-[#4FC3F7] hover:underline font-black inline-flex items-center">
                                emitra.tech
                                <ArrowRight className="h-3 w-3 ml-1" />
                            </a>
                        </p>
                    </MotionWrapper>
                </div>
            </div>
        </section>
    )
}
