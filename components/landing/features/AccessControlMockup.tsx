"use client"

import { CheckCircle2, XCircle, Scan, User, Clock, ShieldCheck, AlertCircle } from "lucide-react"
import { MOCKUP_DATA } from "@/lib/showcase-data"
import { motion, useTransform, MotionValue } from "framer-motion"

export function AccessControlMockup({ progress }: { progress?: MotionValue<number> }) {
    const logs = MOCKUP_DATA.attendance.logs

    // Fallback for non-scrolly use
    const defaultProgress = useTransform(new MotionValue(0), [0], [1])
    const p = progress || defaultProgress

    return (
        <div className="w-full max-w-sm mx-auto bg-slate-950 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(79,195,247,0.15)] border border-slate-800 relative group">
            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-md px-5 py-4 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="bg-[#4FC3F7]/10 p-1.5 rounded-lg">
                        <ShieldCheck className="h-4 w-4 text-[#4FC3F7]" />
                    </div>
                    <div>
                        <div className="font-bold text-sm text-slate-100">Gate Controller</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: GYM-01-MAIN</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                    <span className="text-[10px] text-green-400 font-bold tracking-wide">ONLINE</span>
                </div>
            </div>

            {/* Main Visual: Scanner & Log Split */}
            <div className="p-5 space-y-5">

                {/* Scanner Interface */}
                <div className="h-36 relative rounded-2xl overflow-hidden border border-[#4FC3F7]/30 bg-slate-900 flex items-center justify-center group-hover:border-[#4FC3F7]/50 transition-colors duration-500">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(79,195,247,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(79,195,247,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />

                    {/* Radar Effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,195,247,0.1)_0%,transparent_70%)] animate-pulse" />

                    {/* Central Reticle */}
                    <div className="relative z-10">
                        <div className="w-16 h-16 border-2 border-[#4FC3F7] rounded-lg relative flex items-center justify-center shadow-[0_0_20px_rgba(79,195,247,0.3)]">
                            <Scan className="h-8 w-8 text-[#4FC3F7] animate-[pulse_3s_ease-in-out_infinite]" />
                            {/* Corner Accents */}
                            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />
                        </div>
                    </div>

                    {/* Scanning Line */}
                    <div className="absolute top-0 w-full h-[2px] bg-[#4FC3F7] shadow-[0_0_15px_#4FC3F7] animate-[scan_2.5s_linear_infinite]"
                        style={{ animation: 'scan 2.5s linear infinite' }} />
                </div>

                {/* Live Log */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Access Log</span>
                        <span className="text-[10px] text-[#4FC3F7] cursor-pointer hover:underline">View All</span>
                    </div>

                    {/* Entry Items */}
                    <div className="space-y-2">
                        {logs.map((log: any, idx: number) => {
                            // Stagger logic: each item takes a 30% window with 10% overlap
                            const start = idx * 0.2
                            const end = start + 0.3
                            
                            // eslint-disable-next-line react-hooks/rules-of-hooks
                            const opacity = useTransform(p, [start, end], [0, 1])
                            // eslint-disable-next-line react-hooks/rules-of-hooks
                            const y = useTransform(p, [start, end], [10, 0])

                            return (
                                <motion.div key={idx} style={{ opacity, y }}>
                                    <LogItem
                                        name={log.name}
                                        time={log.time}
                                        status={log.status as any}
                                        reason={log.reason}
                                        img={log.img}
                                    />
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

function LogItem({ name, time, status, reason, img }: { name: string, time: string, status: 'granted' | 'denied', reason?: string, img: string }) {
    return (
        <div className={`
            flex items-center justify-between p-3 rounded-xl border bg-slate-900/50 backdrop-blur-sm transition-all hover:bg-slate-800
            ${status === 'granted' ? 'border-slate-800' : 'border-red-900/30'}
        `}>
            <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full p-0.5 ${status === 'granted' ? 'bg-gradient-to-tr from-[#4FC3F7] to-blue-600' : 'bg-red-500'}`}>
                    <img src={img} alt={name} className="h-full w-full rounded-full bg-slate-900 object-cover" />
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-200">{name}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {time}
                    </div>
                </div>
            </div>

            <div className={`
                px-2.5 py-1 rounded-lg flex items-center gap-1.5 border
                ${status === 'granted'
                    ? 'bg-[#4FC3F7]/10 border-[#4FC3F7]/20 text-[#4FC3F7]'
                    : 'bg-red-500/10 border-red-500/20 text-red-500'}
            `}>
                {status === 'granted' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold leading-none uppercase">{status}</span>
                    {reason && <span className="text-[8px] opacity-80 leading-none mt-0.5">{reason}</span>}
                </div>
            </div>
        </div>
    )
}
