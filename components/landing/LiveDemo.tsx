"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, PlayCircle, MousePointer2 } from "lucide-react"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { useState } from "react"
import Link from "next/link"
import { SHOWCASE_STATS, SHOWCASE_MEMBERS, SHOWCASE_INVOICES } from "@/lib/showcase-data"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"

export function LiveDemo() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'billing'>('dashboard')

    return (
        <section className="py-24 bg-gradient-to-b from-[#1a365d] to-[#2c5282] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <MotionWrapper>
                        <div className="inline-flex items-center rounded-full border border-[#4FC3F7] bg-[#4FC3F7]/20 px-3 py-1 text-sm font-medium text-[#4FC3F7] shadow-sm mb-6">
                            <MousePointer2 className="h-4 w-4 mr-2" />
                            Interactive Preview
                        </div>
                    </MotionWrapper>
                    <MotionWrapper delay={0.1}>
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                            Don't just take our word for it. <span className="text-[#4FC3F7]">Try it.</span>
                        </h2>
                    </MotionWrapper>
                    <MotionWrapper delay={0.2}>
                        <p className="text-lg text-slate-300">
                            Experience the speed and simplicity of Gym Mitra right here. No signup required.
                        </p>
                    </MotionWrapper>
                </div>

                <MotionWrapper delay={0.3} className="max-w-6xl mx-auto">
                    <div className="rounded-xl border-4 border-[#4FC3F7] shadow-2xl shadow-[#4FC3F7]/20 overflow-hidden bg-white">
                        {/* Browser Window Header */}
                        <div className="bg-[#1e3a8a] px-4 py-3 flex items-center justify-between">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="bg-[#172554] text-white/80 text-xs px-4 py-1 rounded-full font-mono flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                gym-mitra-demo.vercel.app
                            </div>
                            <div className="w-16" /> {/* Spacer */}
                        </div>

                        {/* Demo Content */}
                        <div className="flex h-[600px] bg-slate-50">
                            {/* Sidebar - Desktop Only */}
                            <div className="w-64 bg-white border-r border-slate-200 p-4 hidden lg:block">
                                <div className="font-bold text-xl text-[#0f172a] mb-8 flex items-center gap-2">
                                    <div className="h-8 w-8 bg-[#1e3a8a] rounded-lg" />
                                    GymMitra
                                </div>
                                <div className="space-y-1" role="tablist" aria-label="Dashboard Preview Tabs">
                                    <button
                                        id="tab-dashboard"
                                        onClick={() => setActiveTab('dashboard')}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                        role="tab"
                                        aria-selected={activeTab === 'dashboard'}
                                        aria-controls="panel-dashboard"
                                    >
                                        Dashboard
                                    </button>
                                    <button
                                        id="tab-members"
                                        onClick={() => setActiveTab('members')}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'members' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                        role="tab"
                                        aria-selected={activeTab === 'members'}
                                        aria-controls="panel-members"
                                    >
                                        Members
                                    </button>
                                    <button
                                        id="tab-billing"
                                        onClick={() => setActiveTab('billing')}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'billing' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                        role="tab"
                                        aria-selected={activeTab === 'billing'}
                                        aria-controls="panel-billing"
                                    >
                                        Billing
                                    </button>
                                </div>
                            </div>

                            {/* Main Area */}
                            <div className="flex-1 overflow-y-auto">
                                {/* Mobile Tab Switcher */}
                                <div className="lg:hidden flex border-b bg-white sticky top-0 z-20" role="tablist" aria-label="Mobile Navigation">
                                    {(['dashboard', 'members', 'billing'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            id={`mobile-tab-${tab}`}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
                                            role="tab"
                                            aria-selected={activeTab === tab}
                                            aria-controls={`panel-${tab}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4 md:p-8">
                                    {activeTab === 'dashboard' && (
                                        <div id="panel-dashboard" role="tabpanel" aria-labelledby="tab-dashboard" className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-2xl font-bold text-slate-800">Overview</h3>
                                                <div className="text-sm text-slate-500">Last updated: Just now</div>
                                            </div>

                                            {/* Top Interactive CTA - Highly Visible */}
                                            <div className="mb-8">
                                                <Link href="/dashboard" className="block group">
                                                    <div className="bg-[#1e3a8a] p-6 rounded-2xl text-white text-center shadow-lg shadow-[#1e3a8a]/20 group-hover:bg-[#172554] transition-all group-hover:scale-[1.01] active:scale-[0.99] border-2 border-white/10">
                                                        <p className="text-blue-200/80 text-[10px] font-bold mb-1 uppercase tracking-[0.2em] italic">Experience the Full Power</p>
                                                        <h4 className="text-lg font-bold mb-4">Wanna see how it feels to use our product?</h4>
                                                        <div className="inline-flex items-center gap-2 bg-[#4FC3F7] text-white px-6 py-2.5 rounded-full font-bold shadow-sm text-sm group-hover:bg-[#3FB3E7] transition-colors">
                                                            Tap here and try!
                                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                        <p className="mt-4 text-[10px] text-blue-200/60 font-medium italic">"If you think it's hard, we'll surprise you! ✨"</p>
                                                    </div>
                                                </Link>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-500">
                                                    <div className="text-sm font-medium text-slate-500 mb-1">Total Revenue</div>
                                                    <div className="text-2xl font-bold text-slate-800">₹{SHOWCASE_STATS.totalRevenue.toLocaleString('en-IN')}</div>
                                                    <div className="text-xs text-green-600 mt-2 font-medium">↑ {SHOWCASE_STATS.revenueGrowth}</div>
                                                </div>
                                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-500 delay-100">
                                                    <div className="text-sm font-medium text-slate-500 mb-1">Active Members</div>
                                                    <div className="text-2xl font-bold text-slate-800">{SHOWCASE_STATS.activeMembers}</div>
                                                    <div className="text-xs text-green-600 mt-2 font-medium">↑ {SHOWCASE_STATS.memberGrowth}</div>
                                                </div>
                                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-500 delay-200">
                                                    <div className="text-sm font-medium text-slate-500 mb-1">Expiring Soon</div>
                                                    <div className="text-2xl font-bold text-red-600">{SHOWCASE_STATS.expiringSoon}</div>
                                                    <div className="text-xs text-slate-400 mt-2">Auto-reminders sent</div>
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-72 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div className="text-sm font-semibold text-slate-700">Revenue Breakdown</div>
                                                    <div className="flex gap-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                            <span className="text-[10px] text-slate-500">Monthly</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={SHOWCASE_STATS.overviewData}>
                                                        <XAxis
                                                            dataKey="name"
                                                            stroke="#94a3b8"
                                                            fontSize={10}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: '#f8fafc' }}
                                                            content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    return (
                                                                        <div className="bg-white p-2 border border-slate-100 shadow-lg rounded-lg outline-none">
                                                                            <div className="text-[10px] font-bold text-slate-500 uppercase">{payload[0].payload.name}</div>
                                                                            <div className="text-sm font-bold text-blue-600">₹{payload[0].value?.toLocaleString()}</div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                                            {SHOWCASE_STATS.overviewData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={index === SHOWCASE_STATS.overviewData.length - 1 ? '#2563eb' : '#93c5fd'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'members' && (
                                        <div id="panel-members" role="tabpanel" aria-labelledby="tab-members" className="space-y-6 animate-in fade-in duration-300">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-2xl font-bold text-slate-800">Members ({SHOWCASE_MEMBERS.length})</h3>
                                                <Button size="sm" className="bg-[#1e3a8a]">Add Member</Button>
                                            </div>
                                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="grid grid-cols-4 p-4 bg-slate-50 border-b border-slate-200 font-medium text-slate-500 text-sm">
                                                    <div className="col-span-2">Name</div>
                                                    <div>Status</div>
                                                    <div>Plan</div>
                                                </div>
                                                {SHOWCASE_MEMBERS.map((member) => (
                                                    <div key={member.id} className="grid grid-cols-4 p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center text-sm">
                                                        <div className="col-span-2 flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs uppercase" aria-hidden="true">
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            <div className="font-medium text-slate-700">{member.name}</div>
                                                        </div>
                                                        <div>
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                {member.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-slate-500 font-medium">{member.planName}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'billing' && (
                                        <div className="space-y-6 animate-in fade-in duration-300">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-2xl font-bold text-slate-800">Recent Invoices</h3>
                                                <Button size="sm" variant="outline">Download Report</Button>
                                            </div>
                                            <div className="space-y-4">
                                                {SHOWCASE_INVOICES.map((inv) => (
                                                    <div key={inv.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold">₹</div>
                                                            <div>
                                                                <div className="font-bold text-slate-800">Invoice #{inv.id.toUpperCase()}</div>
                                                                <div className="text-xs text-slate-500">{inv.member.name} • {inv.type}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-slate-900">₹{inv.amount.toLocaleString()}</div>
                                                            <div className={`text-[10px] font-bold uppercase tracking-widest ${inv.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                {inv.status}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </MotionWrapper>

                <div className="text-center mt-12">
                    <p className="text-slate-300 mb-6 font-medium">See how easy it is?</p>
                    <Link href="/login?view=register">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-[#4FC3F7] text-white hover:bg-[#3FB3E7] shadow-xl shadow-[#4FC3F7]/50 font-bold transition-all hover:-translate-y-1 hover:shadow-[#4FC3F7]/60">
                            Start Your Free 14-Day Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}
