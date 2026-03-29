"use client"

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"
import { 
  Users, 
  CreditCard, 
  Bell, 
  CheckCircle2, 
  TrendingUp, 
  MessageSquare, 
  Calendar,
  Activity,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Zap
} from "lucide-react"

export function DashboardMockup() {
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 })
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 })

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"])

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const width = rect.width
        const height = rect.height
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const xPct = mouseX / width - 0.5
        const yPct = mouseY / height - 0.5
        x.set(xPct)
        y.set(yPct)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <div 
            className="relative w-full h-[540px] flex items-center justify-center pointer-events-auto cursor-default"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ perspective: "1500px" }}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                className="relative w-[520px] h-[370px] force-gpu"
            >
                {/* Background Shadow/Glow Group */}
                <div className="absolute -inset-10 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-[4rem] blur-[80px] -z-10 translate-z-[-50px]" />
                
                {/* Main Dashboard Window - The "Elite" Chassis */}
                <div className="absolute inset-0 rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_45px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col ring-1 ring-black/5">
                    
                    {/* OS-Style Top Bar */}
                    <div className="h-10 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between px-6">
                        <div className="flex gap-1.5 translate-z-[10px]">
                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-12 rounded-full bg-slate-100 flex items-center justify-center translate-z-[10px]">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">System ID</span>
                            </div>
                            <div className="w-4 h-4 rounded-full bg-slate-200" />
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden translate-z-[5px]">
                        {/* High-Craft Sidebar */}
                        <div className="w-14 border-r border-slate-50 flex flex-col items-center py-6 gap-6 translate-z-[15px]">
                            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <Activity className="w-4 h-4 text-white" />
                            </div>
                            {[Users, CreditCard, Calendar, MessageSquare, Zap].map((Icon, i) => (
                                <div key={i} className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-400 transition-colors">
                                    <Icon className="w-4 h-4" />
                                </div>
                            ))}
                        </div>

                        {/* Main Functional Area - Non-Linear / Asymmetric */}
                        <div className="flex-1 p-6 flex flex-col gap-4 bg-white translate-z-[10px]">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Live Updates</p>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter">Member Intake <span className="text-slate-400 font-medium">+12%</span></h3>
                                </div>
                                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </div>
                            </div>
                            
                            <div className="flex gap-4 h-full">
                                {/* Large Member Insight - Storytelling element */}
                                <div className="flex-1 rounded-3xl bg-slate-50 border border-slate-100 p-5 flex flex-col justify-between group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4 translate-x-2 -translate-y-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Users className="w-20 h-20 text-slate-900" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Last Active Member</span>
                                        <div className="flex items-center gap-3 mt-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nikhil" alt="Member" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-none">Nikhil Verma</p>
                                                <p className="text-[9px] font-bold text-emerald-500 uppercase mt-1">Paid Status: Active</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200/50">
                                        <div className="flex justify-between text-[10px] items-center">
                                            <span className="text-slate-500 font-bold uppercase tracking-tight">Today&apos;s Revenue</span>
                                            <span className="text-slate-900 font-black tracking-tighter">₹4.2k</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Quick-Actions */}
                                <div className="w-24 flex flex-col gap-3">
                                    <div className="flex-1 rounded-3xl bg-slate-900 shadow-xl shadow-slate-900/10 p-3 flex flex-col items-center justify-center text-center">
                                        <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center mb-1">
                                            <Plus className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase leading-tight">Add<br />Member</span>
                                    </div>
                                    <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-3 flex flex-col items-center justify-center text-center">
                                        <div className="h-6 w-6 rounded-lg bg-primary/5 flex items-center justify-center mb-1">
                                            <ArrowUpRight className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase leading-tight">Export<br />Report</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating "Push Notification" - Parallax Layer +80z */}
                <motion.div 
                    style={{ transform: "translateZ(80px)" }}
                    className="absolute -right-16 top-20 h-20 w-64 bg-slate-950 rounded-2xl p-4 flex items-center gap-4 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.4)] z-50 border border-white/5"
                >
                    <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex justify-between items-center mb-0.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none">WhatsApp Bot</p>
                            <span className="text-[8px] font-medium text-slate-500">now</span>
                        </div>
                        <p className="text-[11px] font-bold text-white leading-tight truncate">Renewal link sent to Nikhil...</p>
                        <p className="text-[9px] font-medium text-emerald-400 leading-none mt-1.5 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Delivered
                        </p>
                    </div>
                </motion.div>

                {/* Floating Payment Status - Parallax Layer +110z */}
                <motion.div 
                    style={{ transform: "translateZ(110px)" }}
                    className="absolute -left-12 bottom-12 h-18 w-44 bg-white border border-slate-200 rounded-2xl p-3 flex items-center gap-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] z-40"
                >
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shadow-sm">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-900 tracking-tighter">₹2,500 Recv&apos;d</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Verified</span>
                        </div>
                    </div>
                </motion.div>

                {/* Background Shadow Anchors */}
                <div className="absolute -inset-10 bg-primary/5 rounded-[4rem] blur-[80px] -z-20 translate-z-[-100px]" />
            </motion.div>
        </div>
    )
}
