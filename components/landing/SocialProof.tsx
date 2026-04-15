"use client"

import { motion } from "framer-motion"
import { Zap, Shield, Smartphone, Clock, BarChart3, Bell } from "lucide-react"

export function SocialProof() {
    return (
        <section className="py-24 bg-white relative overflow-hidden border-b border-slate-100">
            {/* Background Grain/Noise Effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] -z-10" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col items-center gap-16">

                    {/* Header */}
                    <div className="text-center max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <Zap className="w-3 h-3" />
                            What You Get
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter font-display leading-[1.1]">
                            Everything Your Gym Needs. <br /> Nothing It Doesn&apos;t.
                        </h2>
                        <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
                            A complete operating system built specifically for Indian gyms — billing, attendance, communication, all in one place.
                        </p>
                    </div>

                    {/* Feature Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <FeatureCard
                            icon={<Clock className="w-6 h-6 text-blue-500" />}
                            title="Automated Billing"
                            description="Generate invoices, track payments, and send reminders — no manual spreadsheets."
                        />
                        <FeatureCard
                            icon={<Smartphone className="w-6 h-6 text-emerald-500" />}
                            title="Member Self-Service"
                            description="Members check their plans, payments, and attendance from their own portal."
                        />
                        <FeatureCard
                            icon={<Bell className="w-6 h-6 text-amber-500" />}
                            title="WhatsApp Reminders"
                            description="Automated payment and renewal reminders directly on WhatsApp."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6 text-rose-500" />}
                            title="Real-Time Dashboard"
                            description="Revenue, attendance, and member insights — all at a glance."
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6 text-indigo-500" />}
                            title="Secure & Reliable"
                            description="Bank-grade encryption, automatic backups, and 99.9% uptime."
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-orange-500" />}
                            title="Works Offline"
                            description="PWA-powered — mark attendance and view data even without internet."
                        />
                    </motion.div>

                    {/* Ticker: Product Highlights */}
                    <div className="w-full max-w-4xl overflow-hidden py-4 opacity-40">
                        <motion.div
                            className="flex items-center gap-16 whitespace-nowrap"
                            animate={{ x: [0, -1000] }}
                            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                        >
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="flex items-center gap-16 text-xs font-black text-slate-500 uppercase tracking-[0.3em]">
                                    <span>Automated Billing</span>
                                    <span>•</span>
                                    <span>WhatsApp Reminders</span>
                                    <span>•</span>
                                    <span>Built in Bharat with Pride</span>
                                    <span>•</span>
                                    <span>Works Offline</span>
                                    <span>•</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-500 space-y-4 group">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                {icon}
            </div>
            <div>
                <div className="text-lg font-black text-slate-900 tracking-tight mb-2">{title}</div>
                <div className="text-sm font-medium text-slate-500 leading-relaxed">{description}</div>
            </div>
        </div>
    )
}