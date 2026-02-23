"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { ArrowRight, Calculator } from "lucide-react"

export function ROICalculator() {
    const [adminHours, setAdminHours] = useState([3])

    // Calculation Logic
    const DAYS_IN_MONTH = 30
    const ADMIN_EFFICIENCY = 0.9
    const ADMIN_HOURLY_RATE = 500

    const hoursSavedPerMonth = adminHours[0] * DAYS_IN_MONTH * ADMIN_EFFICIENCY
    const moneySavedPerMonth = hoursSavedPerMonth * ADMIN_HOURLY_RATE

    return (
        <section className="py-24 bg-midnight text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-midnight-900 opacity-30"
                style={{ backgroundImage: 'radial-gradient(var(--color-primary, #0066FF) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                    {/* Left Column: Text */}
                    <MotionWrapper>
                        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-black text-primary backdrop-blur-sm mb-6 uppercase tracking-widest">
                            <Calculator className="h-4 w-4 mr-2" />
                            ROI Calculator
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight font-display">
                            See how much <br />
                            <span className="text-ocean">time & money</span> you'll save.
                        </h2>
                        <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg font-medium">
                            Adjust the sliders to match your current gym stats. See exactly what manual work is costing you every single month.
                        </p>
                        <div className="glass-card rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-12 w-12 bg-ocean rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-ocean/20">
                                    ₹
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Yearly Savings Potential</div>
                                    <div className="text-3xl font-black text-white font-display">₹{(moneySavedPerMonth * 12).toLocaleString('en-IN')}</div>
                                </div>
                            </div>
                        </div>
                    </MotionWrapper>

                    {/* Right Column: Calculator */}
                    <MotionWrapper delay={0.2}>
                        <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl shadow-primary/10 border border-drift-silver">
                            <div className="space-y-8 mb-12">

                                {/* Slider 2 */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="font-black text-slate-800 uppercase tracking-widest text-xs">Daily Admin Hours</label>
                                        <span className="bg-primary/5 text-primary px-4 py-1.5 rounded-xl font-black font-display text-lg">
                                            {adminHours[0]} hrs
                                        </span>
                                    </div>
                                    <Slider
                                        value={adminHours}
                                        onValueChange={setAdminHours}
                                        min={1}
                                        max={10}
                                        step={0.5}
                                        className="py-4 cursor-pointer"
                                    />
                                    <p className="text-xs text-slate-500 mt-3 font-medium">
                                        Time spent on billing, calling, attendance, etc.
                                    </p>
                                </div>
                            </div>

                            {/* Results Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 rounded-2xl p-6 text-center border border-drift-silver group hover:border-primary/30 transition-colors">
                                    <div className="text-4xl font-black text-midnight mb-1 font-display">
                                        {Math.round(hoursSavedPerMonth)} hrs
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Saved Monthly
                                    </div>
                                </div>
                                <div className="bg-ocean/5 rounded-2xl p-6 text-center border border-ocean/10 group hover:border-ocean/30 transition-colors">
                                    <div className="text-4xl font-black text-ocean mb-1 font-display">
                                        ₹{Math.round(moneySavedPerMonth).toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-[10px] font-black text-ocean/70 uppercase tracking-widest">
                                        Value Saved
                                    </div>
                                </div>
                            </div>

                            <a href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://gym.emitra.dev'}/login?view=register`} className="block" target="_blank" rel="noopener noreferrer" aria-label="Open registration page">
                                <Button className="w-full h-16 text-lg font-black rounded-xl bg-primary hover:bg-primary-600 shadow-xl shadow-primary/20 uppercase tracking-widest transition-all hover:-translate-y-1">
                                    Start Saving Now
                                    <ArrowRight className="ml-2 h-6 w-6" />
                                </Button>
                            </a>
                            <p className="text-center text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-wider">
                                *Estimated savings based on typical admin efficiency gains.
                            </p>
                        </div>
                    </MotionWrapper>
                </div>
            </div>
        </section>
    )
}
