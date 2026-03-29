"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Star, TrendingUp, Users, Zap } from "lucide-react"

export function SocialProof() {
    return (
        <section className="py-24 bg-white relative overflow-hidden border-b border-slate-100">
            {/* Background Grain/Noise Effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] -z-10" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col items-center gap-16">
                    
                    {/* Header: Proof Narrative */}
                    <div className="text-center max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <CheckCircle2 className="w-3 h-3" />
                            Live & Powering Growth
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter font-display leading-[1.1]">
                            Trusted by India&apos;s Fastest <br /> Growing Fitness Brands.
                        </h2>
                    </div>

                    {/* Main Proof Card: Tristar Fitness Focus */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        className="w-full max-w-5xl rounded-[3rem] p-1 bg-gradient-to-br from-slate-200 via-white to-slate-200 shadow-2xl shadow-slate-900/5 group"
                    >
                        <div className="bg-white rounded-[2.8rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 md:gap-20">
                            
                            {/* Brand Profile */}
                            <div className="flex-1 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-display font-black text-2xl shadow-xl shadow-slate-950/20">
                                            TF
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display">TRI-STAR FITNESS</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Indore, MP • Live since 2025</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                                        <span className="ml-2 text-sm font-bold text-slate-900">5/5 Rating</span>
                                    </div>
                                </div>

                                <blockquote className="text-xl md:text-2xl font-bold text-slate-600 leading-relaxed italic">
                                    &quot;GymMitra transformed how we handle billing. We saved <span className="text-slate-900 underline decoration-primary/30 decoration-4 underline-offset-4">20+ hours</span> in our first month alone.&quot;
                                </blockquote>

                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center p-2">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nikhil" alt="Owner" className="rounded-full" />
                                    </div>
                                    <div className="text-xs font-bold">
                                        <span className="block text-slate-900">Mr. Nikhil Verma</span>
                                        <span className="block text-slate-400 uppercase tracking-widest text-[9px]">Owner, Tri-Star Fitness</span>
                                    </div>
                                </div>
                            </div>

                            {/* Impact Stats */}
                            <div className="w-full md:w-80 grid gap-4">
                                <ImpactStat 
                                    icon={<Users className="w-5 h-5 text-blue-500" />}
                                    value="500+" 
                                    label="Active Members" 
                                    trend="+12% MoM"
                                />
                                <ImpactStat 
                                    icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
                                    value="90%+" 
                                    label="Renewal Rate" 
                                    trend="Automated"
                                />
                                <ImpactStat 
                                    icon={<Zap className="w-5 h-5 text-amber-500" />}
                                    value="100%" 
                                    label="Accuracy" 
                                    trend="Zero Errors"
                                />
                            </div>

                        </div>
                    </motion.div>

                    {/* Ticker: Secondary Proof & Social Indicators */}
                    <div className="w-full max-w-4xl overflow-hidden py-4 opacity-40">
                        <motion.div 
                            className="flex items-center gap-16 whitespace-nowrap"
                            animate={{ x: [0, -1000] }}
                            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                        >
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="flex items-center gap-16 text-xs font-black text-slate-500 uppercase tracking-[0.3em]">
                                    <span>Trusted by 50+ Gym Owners</span>
                                    <span>•</span>
                                    <span>10,000+ WhatsApp Alerts Delivered</span>
                                    <span>•</span>
                                    <span>Built in Bharat with Pride</span>
                                    <span>•</span>
                                    <span>Top Rated ERP 2025</span>
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

function ImpactStat({ icon, value, label, trend }: { icon: React.ReactNode, value: string, label: string, trend: string }) {
    return (
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:shadow-xl group-hover:scale-105 transition-all duration-500 space-y-4">
            <div className="flex justify-between items-start">
                <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{trend}</span>
            </div>
            <div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">{value}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</div>
            </div>
        </div>
    )
}