"use client"

import { QrCode, Calendar, User, ChevronRight, Zap, Trophy, Flame } from "lucide-react"
import { MOCKUP_DATA } from "@/lib/showcase-data"

export function MemberAppMockup() {
    const data = (MOCKUP_DATA as any).memberApp

    return (
        <div className="w-full max-w-sm mx-auto bg-black rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-slate-900 relative aspect-[9/18]">
            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-50 flex items-center justify-center">
                <div className="w-16 h-4 bg-black rounded-full" />
            </div>

            {/* Content Container */}
            <div className="bg-slate-50 h-full w-full relative pt-10 pb-4 overflow-hidden flex flex-col">

                {/* Header Section with Gradient */}
                <div className="px-6 pb-6 pt-4">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden text-center">
                                <img src={data.img} alt="User" className="h-full w-full object-cover" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-medium">Good Morning,</div>
                                <div className="text-lg font-bold text-slate-900">{data.memberName} 👋</div>
                            </div>
                        </div>
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                            <div className="relative">
                                <Zap className="h-5 w-5 text-amber-400 fill-amber-400" />
                                <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full border border-white" />
                            </div>
                        </div>
                    </div>

                    {/* Membership Card - Main Focus */}
                    <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 text-white shadow-xl shadow-slate-900/20">
                        {/* Abstract Patterns */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4FC3F7]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Status</div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                                        <span className="font-bold">Active Member</span>
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                                    <span className="text-xs font-bold">{data.planName}</span>
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-3xl font-bold tracking-tight">{data.daysRemaining}</div>
                                    <div className="text-sm text-slate-400">Days Remaining</div>
                                </div>
                                <button className="bg-[#4FC3F7] hover:bg-[#3caae0] text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-[#4FC3F7]/20">
                                    Renew Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions - Scrollable */}
                <div className="flex-1 px-6 overflow-y-auto no-scrollbar space-y-6">

                    {/* QR Entry Button */}
                    <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform">
                        <div className="h-12 w-12 bg-[#4FC3F7]/10 rounded-2xl flex items-center justify-center text-[#4FC3F7]">
                            <QrCode className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-bold text-slate-900">Check-in QR</div>
                            <div className="text-[11px] text-slate-400">Tap to access gym</div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-orange-50 rounded-lg text-orange-500">
                                    <Flame className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Streak</span>
                            </div>
                            <div className="text-xl font-bold text-slate-900">{data.streak} Days</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                                    <Trophy className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Goal</span>
                            </div>
                            <div className="text-xl font-bold text-slate-900">{data.goalProgress}%</div>
                        </div>
                    </div>
                </div>

                {/* Simulated Tab Bar */}
                <div className="bg-white border-t border-slate-100 p-4 px-8 flex justify-between items-center text-slate-300">
                    <div className="flex flex-col items-center gap-1 text-slate-900">
                        <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center">
                            <div className="h-2 w-2 bg-slate-900 rounded-sm" />
                        </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-slate-200" />
                    <div className="h-2 w-2 rounded-full bg-slate-200" />
                    <div className="h-2 w-2 rounded-full bg-slate-200" />
                </div>
            </div>
        </div>
    )
}
