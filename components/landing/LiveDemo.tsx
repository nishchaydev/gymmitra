"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, PlayCircle, MousePointer2 } from "lucide-react"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { useState } from "react"
import Link from "next/link"
import { SHOWCASE_STATS, SHOWCASE_MEMBERS, SHOWCASE_INVOICES } from "@/lib/showcase-data"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { demoLogin } from "@/app/login/actions"

export function LiveDemo() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'billing'>('dashboard')

    return (
        <section className="py-24 bg-gradient-to-b from-midnight to-[#0f172a] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <MotionWrapper>
                        <div className="inline-flex items-center rounded-full border border-primary bg-primary/20 px-3 py-1 text-sm font-black text-primary shadow-sm mb-6 uppercase tracking-widest">
                            <MousePointer2 className="h-4 w-4 mr-2" />
                            Interactive Preview
                        </div>
                    </MotionWrapper>
                    <MotionWrapper delay={0.1}>
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4 font-display">
                            Don&apos;t just take our word for it. <span className="text-primary">Try it.</span>
                        </h2>
                    </MotionWrapper>
                    <MotionWrapper delay={0.2}>
                        <p className="text-lg text-slate-300 font-medium">
                            Experience the speed and simplicity of GymMitra right here. No signup required.
                        </p>
                    </MotionWrapper>
                </div>

                <MotionWrapper delay={0.3} className="max-w-6xl mx-auto">
                    <div className="rounded-xl border-4 border-primary shadow-2xl shadow-primary/20 overflow-hidden bg-white">
                        {/* Browser Window Header */}
                        <div className="bg-midnight px-4 py-3 flex items-center justify-between">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                            </div>
                            <div className="bg-[#0f172a] text-white/80 text-xs px-4 py-1 rounded-full font-mono flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                gym-mitra-demo.vercel.app
                            </div>
                            <div className="w-16" /> {/* Spacer */}
                        </div>

                        {/* Demo Content */}
                        <div className="flex h-[600px] bg-slate-50">
                            {/* Sidebar - Desktop Only */}
                            <div className="w-64 bg-white border-r border-slate-200 p-4 hidden lg:block">
                                <div className="font-display font-black text-xl text-slate-900 mb-8 flex items-center gap-2">
                                    <div className="h-8 w-8 bg-primary rounded-lg shadow-sm" />
                                    GymMitra
                                </div>
                                <div className="space-y-1" role="tablist" aria-label="Dashboard Preview Tabs">
                                    <button
                                        id="tab-dashboard"
                                        onClick={() => setActiveTab('dashboard')}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                                        role="tab"
                                        aria-selected={activeTab === 'dashboard'}
                                        aria-controls="panel-dashboard"
                                    >
                                        Dashboard
                                    </button>
                                    <button
                                        id="tab-members"
                                        onClick={() => setActiveTab('members')}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'members' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                                        role="tab"
                                        aria-selected={activeTab === 'members'}
                                        aria-controls="panel-members"
                                    >
                                        Members
                                    </button>
                                    <button
                                        id="tab-billing"
                                        onClick={() => setActiveTab('billing')}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'billing' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
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
                                <div className="lg:hidden flex border-b bg-white relative z-0" role="tablist" aria-label="Mobile Navigation">
                                    {(['dashboard', 'members', 'billing'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            id={`mobile-tab-${tab}`}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}
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
                                                <h3 className="text-2xl font-black text-slate-800 font-display">Overview</h3>
                                                <div className="text-sm text-slate-500 font-bold">Last updated: Just now</div>
                                            </div>

                                            <div className="mb-8">
                                                <button 
                                                    onClick={() => demoLogin()}
                                                    className="w-full block group cursor-pointer border-none bg-transparent p-0 text-left"
                                                >
                                                    <div className="w-full h-auto py-6 px-4 bg-slate-100/50 hover:bg-white text-slate-700 font-bold border-2 border-slate-200/50 hover:border-primary/30 transition-all rounded-2xl group-hover:shadow-[0_0_40px_-10px_rgba(0,102,255,0.3)] flex flex-col items-center justify-center text-center">
                                                        <p className="text-primary/60 text-[10px] font-black mb-1 uppercase tracking-[0.2em] italic">Experience the Full Power</p>
                                                        <h4 className="text-lg font-black mb-4 font-display">Wanna see how it feels to use our product?</h4>
                                                        <span className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full font-black shadow-sm text-sm group-hover:bg-primary-600 transition-colors uppercase tracking-widest">
                                                            Tap here and try!
                                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </span>
                                                    </div>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="bg-white p-6 rounded-xl border border-drift-silver shadow-sm animate-in fade-in zoom-in duration-500">
                                                    <div className="text-xs font-black text-slate-400 mb-1 uppercase tracking-wider">Total Revenue</div>
                                                    <div className="text-2xl font-black text-slate-800 font-display">₹{SHOWCASE_STATS.totalRevenue.toLocaleString('en-IN')}</div>
                                                    <div className="text-xs text-emerald-600 mt-2 font-black tracking-wide">↑ {SHOWCASE_STATS.revenueGrowth}</div>
                                                </div>
                                                <div className="bg-white p-6 rounded-xl border border-drift-silver shadow-sm animate-in fade-in zoom-in duration-500 delay-100">
                                                    <div className="text-xs font-black text-slate-400 mb-1 uppercase tracking-wider">Active Members</div>
                                                    <div className="text-2xl font-black text-slate-800 font-display">{SHOWCASE_STATS.activeMembers}</div>
                                                    <div className="text-xs text-emerald-600 mt-2 font-black tracking-wide">↑ {SHOWCASE_STATS.memberGrowth}</div>
                                                </div>
                                                <div className="bg-white p-6 rounded-xl border border-drift-silver shadow-sm animate-in fade-in zoom-in duration-500 delay-200">
                                                    <div className="text-xs font-black text-slate-400 mb-1 uppercase tracking-wider">Expiring Soon</div>
                                                    <div className="text-2xl font-black text-red-600 font-display">{SHOWCASE_STATS.expiringSoon}</div>
                                                    <div className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-[0.05em]">Auto-reminders sent</div>
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-xl border border-drift-silver shadow-sm h-72 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div className="text-sm font-black text-slate-700 uppercase tracking-widest">Revenue Breakdown</div>
                                                    <div className="flex gap-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Monthly</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ResponsiveContainer width="100%" height={180}>
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
                                                                            <div className="text-sm font-bold text-primary">₹{payload[0].value?.toLocaleString()}</div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                                            {SHOWCASE_STATS.overviewData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={index === SHOWCASE_STATS.overviewData.length - 1 ? '#0066FF' : '#E2E8F0'} />
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
                                                <h3 className="text-2xl font-black text-slate-800 font-display">Members ({SHOWCASE_MEMBERS.length})</h3>
                                                <Button size="sm" className="bg-primary hover:bg-primary-600 font-bold uppercase tracking-widest text-[10px] px-4">Add Member</Button>
                                            </div>
                                            <div className="bg-white rounded-xl border border-drift-silver shadow-sm overflow-hidden">
                                                <div className="overflow-x-auto w-full">
                                                    <div className="min-w-[500px]">
                                                        <div className="grid grid-cols-4 p-4 bg-slate-50 border-b border-drift-silver font-black text-slate-400 uppercase tracking-widest text-[10px]">
                                                            <div className="col-span-2">Name</div>
                                                            <div>Status</div>
                                                            <div>Plan</div>
                                                        </div>
                                                        {SHOWCASE_MEMBERS.map((member) => (
                                                            <div key={member.id} className="grid grid-cols-4 p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center text-sm font-medium">
                                                                <div className="col-span-2 flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-xs uppercase" aria-hidden="true">
                                                                        {member.name.charAt(0)}
                                                                    </div>
                                                                    <div className="font-bold text-slate-700">{member.name}</div>
                                                                </div>
                                                                <div>
                                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                        {member.status}
                                                                    </span>
                                                                </div>
                                                                <div className="text-slate-500 font-bold">{member.planName}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'billing' && (
                                        <div className="space-y-6 animate-in fade-in duration-300">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-2xl font-black text-slate-800 font-display">Recent Invoices</h3>
                                                <Button size="sm" variant="outline" className="font-bold uppercase tracking-widest text-[10px] border-drift-silver">Download Report</Button>
                                            </div>
                                            <div className="space-y-4">
                                                {SHOWCASE_INVOICES.map((inv) => (
                                                    <div key={inv.id} className="bg-white p-4 rounded-xl border border-drift-silver shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary font-black">₹</div>
                                                            <div>
                                                                <div className="font-black text-slate-800 uppercase tracking-wider text-xs">Invoice #{inv.id.toUpperCase()}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{inv.member.name} • {inv.type}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-black text-slate-900 font-display">₹{inv.amount.toLocaleString()}</div>
                                                            <div className={`text-[10px] font-black uppercase tracking-widest ${inv.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
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
                    <p className="text-slate-300 mb-6 font-bold uppercase tracking-widest text-xs">See how easy it is?</p>
                    <Link href="/start-trial">
                        <Button size="lg" className="h-16 px-12 text-xl rounded-full bg-primary text-white hover:bg-primary-600 shadow-2xl shadow-primary/20 font-black transition-all hover:-translate-y-1 uppercase tracking-widest">
                             Start Your Free 1-Month Trial
                            <ArrowRight className="ml-2 h-6 w-6" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}
