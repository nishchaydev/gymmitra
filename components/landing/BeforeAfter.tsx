"use client"

import { Check, X, FileText, Phone, Calculator, AlertTriangle, Clock, Zap, MessageSquare, TrendingUp, Bell, Sparkles } from "lucide-react"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function BeforeAfter() {
    return (
        <section className="py-24 bg-midnight text-white relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl mx-auto">
                <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />
            </div>

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <MotionWrapper>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 font-display">
                            Life <span className="text-rose-400">Before</span> vs <span className="text-primary">After</span> GymMitra
                        </h2>
                    </MotionWrapper>
                    <MotionWrapper delay={0.1}>
                        <p className="text-xl text-slate-300 font-medium">
                            Stop doing the heavy lifting in your office. Save that for the gym floor.
                        </p>
                    </MotionWrapper>
                </div>

                <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
                    {/* BEFORE */}
                    <MotionWrapper delay={0.2} className="relative group">
                        <div className="absolute inset-0 bg-rose-500/5 rounded-[2.5rem] blur-xl group-hover:bg-rose-500/10 transition-all duration-500" />
                        <div className="relative h-full bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-sm transition-all duration-500 group-hover:border-rose-500/20">
                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                                    <X className="text-rose-500 h-7 w-7" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-200 font-display">Manual Chaos</h3>
                            </div>

                            <div className="space-y-8">
                                <PainPoint
                                    icon={<FileText className="h-6 w-6" />}
                                    text="Handwritten receipts that get lost"
                                />
                                <PainPoint
                                    icon={<Phone className="h-6 w-6" />}
                                    text="Manually chasing payments via calls"
                                />
                                <PainPoint
                                    icon={<Calculator className="h-6 w-6" />}
                                    text="Spending hours calculating revenue"
                                />
                                <PainPoint
                                    icon={<AlertTriangle className="h-6 w-6" />}
                                    text="Members forgetting to renew on time"
                                />
                                <PainPoint
                                    icon={<Clock className="h-6 w-6" />}
                                    text="2+ hours wasted daily on admin work"
                                />
                            </div>
                        </div>
                    </MotionWrapper>

                    {/* AFTER */}
                    <MotionWrapper delay={0.3} className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl group-hover:bg-primary/30 transition-all duration-500" />
                        <div className="relative h-full bg-midnight/80 border-2 border-primary/50 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl shadow-primary/20 bg-gradient-to-br from-primary/10 to-transparent transition-all duration-500 group-hover:border-primary">
                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0 shadow-[inset_0_0_20px_rgba(0,102,255,0.2)]">
                                    <Check className="text-primary h-8 w-8" />
                                </div>
                                <h3 className="text-3xl font-black text-white font-display">Ion Automation</h3>
                            </div>

                            <div className="space-y-8">
                                <SolutionPoint
                                    icon={<Zap className="h-6 w-6" />}
                                    text="Generate invoices in 30 seconds"
                                />
                                <SolutionPoint
                                    icon={<MessageSquare className="h-6 w-6" />}
                                    text="Auto WhatsApp reminders & wishes"
                                />
                                <SolutionPoint
                                    icon={<TrendingUp className="h-6 w-6" />}
                                    text="Live revenue dashboard on your phone"
                                />
                                <SolutionPoint
                                    icon={<Bell className="h-6 w-6" />}
                                    text="Automatic renewal notifications"
                                />
                                <SolutionPoint
                                    icon={<Sparkles className="h-6 w-6" />}
                                    text="Just 15 minutes daily admin work"
                                />
                            </div>
                        </div>
                    </MotionWrapper>
                </div>

                <div className="text-center mt-20">
                    <p className="text-primary text-2xl font-black mb-8 animate-pulse font-display uppercase tracking-widest">
                        ⚡ Save 90% of your admin time
                    </p>
                    <Link href="https://gym.emitra.dev/login?view=register">
                        <Button className="h-14 px-8 md:px-12 text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 transition-all active:scale-95 uppercase tracking-widest rounded-2xl">
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
