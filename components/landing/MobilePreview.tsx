"use client"

import { Button } from "@/components/ui/button"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { Check, Smartphone } from "lucide-react"
import Image from "next/image"

const STORE_BUTTON_CLASS = "h-14 px-8 rounded-2xl bg-midnight text-white hover:bg-slate-900 font-black uppercase tracking-widest text-xs"

export function MobilePreview() {
    return (
        <section className="py-24 bg-white overflow-hidden relative">
            <div className="absolute inset-0 circuit-bg opacity-30" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                    {/* Left Column: Text */}
                    <MotionWrapper className="order-2 lg:order-1">
                        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-black text-primary shadow-sm mb-6 uppercase tracking-widest">
                            <Smartphone className="h-4 w-4 mr-2" />
                            Mobile App
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-midnight mb-6 leading-tight font-display">
                            Manage Your Gym <br />
                            <span className="text-primary">From Anywhere.</span>
                        </h2>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                            Don&apos;t be tied to the front desk. Add members, check revenue, and send invoices directly from your phone while you&apos;re on the floor or traveling.
                        </p>

                        <ul className="space-y-4 mb-10">
                            <Feature text="Add members on the gym floor" />
                            <Feature text="Generate invoices during PT sessions" />
                            <Feature text="Check live revenue while traveling" />
                            <Feature text="Send birthday wishes instantly" />
                        </ul>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button className={STORE_BUTTON_CLASS} disabled>
                                App Store (Soon)
                            </Button>
                            <Button className={STORE_BUTTON_CLASS} disabled>
                                Play Store (Soon)
                            </Button>
                        </div>
                    </MotionWrapper>

                    {/* Right Column: Phone Graphic */}
                    <MotionWrapper delay={0.2} className="relative order-1 lg:order-2 flex justify-center">
                        {/* Blob Background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 rounded-full blur-[100px] -z-10" />

                        {/* Phone Mockup */}
                        <div className="relative w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden ring-1 ring-white/20">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20" />

                            {/* Status Bar */}
                            <div className="absolute top-2 w-full px-6 flex justify-between text-[10px] text-white font-medium z-20">
                                <span>9:41</span>
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 bg-white rounded-full opacity-20" />
                                    <div className="w-3 h-3 bg-white rounded-full opacity-20" />
                                    <div className="w-3 h-3 bg-ocean rounded-full" />
                                </div>
                            </div>

                            {/* Screen Content */}
                            <div className="w-full h-full bg-slate-50 pt-10 px-4 pb-4 overflow-hidden relative">
                                {/* App Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Good Morning,</div>
                                        <div className="font-black text-slate-800 text-lg font-display">Rajesh 👋</div>
                                    </div>
                                    <div className="h-8 w-8 bg-slate-200 rounded-full" />
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/20">
                                        <div className="text-[10px] opacity-80 mb-1 font-bold">Revenue</div>
                                        <div className="text-xl font-black font-display">₹8,500</div>
                                    </div>
                                    <div className="bg-white text-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="text-[10px] text-slate-400 mb-1 font-bold">Check-ins</div>
                                        <div className="text-xl font-black font-display">42</div>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
                                    <div className="text-xs font-black text-slate-800 mb-3 uppercase tracking-widest">Recent Activity</div>
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="flex gap-3 items-center border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                                <div className="h-8 w-8 bg-ocean/10 rounded-full flex items-center justify-center text-ocean text-xs font-black">₹</div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-700">Payment Received</div>
                                                    <div className="text-[8px] font-bold text-slate-400">2 mins ago</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bottom Nav */}
                                <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-100 p-4 flex justify-around items-center">
                                    <div className="h-6 w-6 bg-primary rounded-full shadow-lg shadow-primary/20" />
                                    <div className="h-6 w-6 bg-slate-100 rounded-full" />
                                    <div className="h-6 w-6 bg-slate-100 rounded-full" />
                                    <div className="h-6 w-6 bg-slate-100 rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* Floating Notification */}
                        <div className="absolute top-32 -right-8 bg-primary p-4 rounded-2xl shadow-2xl shadow-primary/30 border border-primary/50 flex items-center gap-3 animate-bounce-slow">
                            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                                <Check className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs font-black text-white font-display">Invoice Sent!</div>
                                <div className="text-[10px] font-bold text-white/80">Via WhatsApp</div>
                            </div>
                        </div>
                    </MotionWrapper>
                </div>
            </div>
        </section>
    )
}

function Feature({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Check className="h-3.5 w-3.5" />
            </div>
            {text}
        </div>
    )
}
