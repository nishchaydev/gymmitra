"use client"

import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { Building2, GraduationCap, Hospital, ArrowRight } from "lucide-react"

export function AboutEMitra() {
    return (
        <section className="py-24 bg-white overflow-hidden relative">
            <div className="absolute inset-0 circuit-bg opacity-40" />
            <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
                <div className="max-w-4xl mx-auto">
                    <MotionWrapper delay={0.1}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-drift-silver mb-8 shadow-sm">
                            <Building2 className="w-4 h-4 text-primary" aria-hidden="true" />
                            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                Built by eMitra Technologies
                            </span>
                        </div>
                    </MotionWrapper>

                    <MotionWrapper delay={0.2}>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight font-display">
                            More Than Just <span className="text-primary">Gym Software</span>.
                        </h2>
                    </MotionWrapper>

                    <MotionWrapper delay={0.3}>
                        <p className="text-xl text-slate-600 mb-16 leading-relaxed font-medium max-w-2xl mx-auto">
                            GymMitra is the flagship product of eMitra Technologies, a team obsessed
                            with solving India's small business challenges through <span className="text-midnight font-black">intelligent automation</span>.
                        </p>
                    </MotionWrapper>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        {/* Gym Mitra */}
                        <MotionWrapper delay={0.4} className="h-full">
                            <div className="bg-white rounded-3xl p-8 border border-primary/20 shadow-xl shadow-primary/5 hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 h-full flex flex-col relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-150" />
                                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner">
                                    <span className="text-3xl" role="img" aria-label="weightlifter emoji">🏋️</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-3 font-display">GymMitra</h3>
                                <p className="text-slate-600 font-medium mb-6 flex-1 leading-relaxed">
                                    Complete fitness center management with automated billing and member app.
                                </p>
                                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest w-fit shadow-sm">
                                    Live Now
                                </span>
                            </div>
                        </MotionWrapper>

                        {/* School Mitra */}
                        <MotionWrapper delay={0.5} className="h-full">
                            <div className="bg-white/60 rounded-3xl p-8 border border-drift-silver shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col group opacity-70 hover:opacity-100 backdrop-blur-sm">
                                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 grayscale group-hover:grayscale-0 group-hover:bg-primary/5 transition-all">
                                    <GraduationCap className="h-7 w-7 text-slate-400 group-hover:text-primary transition-colors" aria-hidden="true" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-500 group-hover:text-midnight transition-colors mb-3 font-display">SchoolMitra</h3>
                                <p className="text-slate-500 group-hover:text-slate-600 transition-colors mb-6 flex-1 font-medium leading-relaxed">
                                    Next-gen education ERP for modern Indian schools and coaching centers.
                                </p>
                                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest w-fit">
                                    Coming Q3 2026
                                </span>
                            </div>
                        </MotionWrapper>

                        {/* Clinic Mitra */}
                        <MotionWrapper delay={0.6} className="h-full">
                            <div className="bg-white/60 rounded-3xl p-8 border border-drift-silver shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col group opacity-70 hover:opacity-100 backdrop-blur-sm">
                                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 grayscale group-hover:grayscale-0 group-hover:bg-primary/5 transition-all">
                                    <Hospital className="h-7 w-7 text-slate-400 group-hover:text-primary transition-colors" aria-hidden="true" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-500 group-hover:text-midnight transition-colors mb-3 font-display">ClinicMitra</h3>
                                <p className="text-slate-500 group-hover:text-slate-600 transition-colors mb-6 flex-1 font-medium leading-relaxed">
                                    Simplified healthcare management for clinics and diagnostic centers.
                                </p>
                                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest w-fit">
                                    Planned 2027
                                </span>
                            </div>
                        </MotionWrapper>
                    </div>

                    <MotionWrapper delay={0.7} className="mt-20">
                        <p className="text-sm font-black text-slate-400 flex items-center justify-center gap-2 uppercase tracking-[0.1em]">
                            Learn more about our mission at
                            <a href="https://emitra.tech" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-midnight hover:underline font-black inline-flex items-center transition-colors">
                                emitra.tech
                                <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
                            </a>
                        </p>
                    </MotionWrapper>
                </div>
            </div>
        </section>
    )
}
