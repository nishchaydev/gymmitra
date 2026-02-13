"use client"

import { Check, X, FileText, Phone, Calculator, AlertTriangle, Clock, Zap, MessageSquare, TrendingUp, Bell, Sparkles } from "lucide-react"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function BeforeAfter() {
    return (
        <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl mx-auto">
                <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[#4FC3F7]/10 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-[#4FC3F7]/5 rounded-full blur-[100px] -z-10" />
            </div>

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <MotionWrapper>
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                            Life <span className="text-red-400">Before</span> vs <span className="text-[#4FC3F7]">After</span> Gym Mitra
                        </h2>
                    </MotionWrapper>
                    <MotionWrapper delay={0.1}>
                        <p className="text-lg text-slate-400">
                            Stop doing the heavy lifting in your office. Save that for the gym floor.
                        </p>
                    </MotionWrapper>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* BEFORE */}
                    <MotionWrapper delay={0.2} className="relative group">
                        <div className="absolute inset-0 bg-red-500/5 rounded-3xl blur-xl group-hover:bg-red-500/10 transition-all duration-500" />
                        <div className="relative h-full bg-slate-800/50 border border-slate-700 rounded-3xl p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center shrink-0">
                                    <X className="text-red-500 h-6 w-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-200">Without Software</h3>
                            </div>

                            <div className="space-y-6">
                                <PainPoint
                                    icon={<FileText className="h-5 w-5" />}
                                    text="Handwritten receipts that get lost"
                                />
                                <PainPoint
                                    icon={<Phone className="h-5 w-5" />}
                                    text="Manually chasing payments via calls"
                                />
                                <PainPoint
                                    icon={<Calculator className="h-5 w-5" />}
                                    text="Spending hours calculating revenue"
                                />
                                <PainPoint
                                    icon={<AlertTriangle className="h-5 w-5" />}
                                    text="Members forgetting to renew on time"
                                />
                                <PainPoint
                                    icon={<Clock className="h-5 w-5" />}
                                    text="2+ hours wasted daily on admin work"
                                />
                            </div>
                        </div>
                    </MotionWrapper>

                    {/* AFTER */}
                    <MotionWrapper delay={0.3} className="relative group">
                        <div className="absolute inset-0 bg-[#4FC3F7]/10 rounded-3xl blur-xl group-hover:bg-[#4FC3F7]/20 transition-all duration-500" />
                        <div className="relative h-full bg-slate-800/80 border border-[#4FC3F7] rounded-3xl p-8 backdrop-blur-sm shadow-2xl shadow-[#4FC3F7]/10 bg-gradient-to-br from-[#4FC3F7]/20 to-[#4FC3F7]/5">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-[#4FC3F7]/20 rounded-2xl flex items-center justify-center shrink-0">
                                    <Check className="text-[#4FC3F7] h-6 w-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">With Gym Mitra</h3>
                            </div>

                            <div className="space-y-6">
                                <SolutionPoint
                                    icon={<Zap className="h-5 w-5" />}
                                    text="Generate invoices in 30 seconds"
                                />
                                <SolutionPoint
                                    icon={<MessageSquare className="h-5 w-5" />}
                                    text="Auto WhatsApp reminders & wishes"
                                />
                                <SolutionPoint
                                    icon={<TrendingUp className="h-5 w-5" />}
                                    text="Live revenue dashboard on your phone"
                                />
                                <SolutionPoint
                                    icon={<Bell className="h-5 w-5" />}
                                    text="Automatic renewal notifications"
                                />
                                <SolutionPoint
                                    icon={<Sparkles className="h-5 w-5" />}
                                    text="Just 15 minutes daily admin work"
                                />
                            </div>
                        </div>
                    </MotionWrapper>
                </div>

                <div className="text-center mt-16">
                    <p className="text-[#4FC3F7] text-xl font-semibold mb-6 animate-pulse">
                        ⚡ Save 90% of your admin time starting today
                    </p>
                    <Link href="/login?view=register">
                        <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 h-12 rounded-full">
                            Start Saving Time Now
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}

function PainPoint({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-start gap-4 text-slate-400 group-hover:text-slate-300 transition-colors">
            <div className="mt-1 shrink-0 text-red-400/50">{icon}</div>
            <p className="leading-relaxed">{text}</p>
        </div>
    )
}

function SolutionPoint({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-start gap-4 text-slate-200 group-hover:text-white transition-colors">
            <div className="mt-1 shrink-0 text-[#4FC3F7]">{icon}</div>
            <p className="font-medium leading-relaxed">{text}</p>
        </div>
    )
}
