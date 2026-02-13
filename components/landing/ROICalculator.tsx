"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { ArrowRight, Calculator } from "lucide-react"
import Link from "next/link"

export function ROICalculator() {
    const [members, setMembers] = useState([100])
    const [adminHours, setAdminHours] = useState([3])

    // Calculation Logic
    // Assumption: Gym Mitra saves 90% of admin time
    // Average admin hourly rate value: ₹500 (placeholder)
    const hoursSavedPerMonth = adminHours[0] * 30 * 0.9
    const moneySavedPerMonth = hoursSavedPerMonth * 500

    return (
        <section className="py-24 bg-[#1e3a8a] text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[#172554] opacity-50"
                style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                    {/* Left Column: Text */}
                    <MotionWrapper>
                        <div className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-200 backdrop-blur-sm mb-6">
                            <Calculator className="h-4 w-4 mr-2" />
                            ROI Calculator
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
                            See how much <br />
                            <span className="text-emerald-400">time & money</span> you'll save.
                        </h2>
                        <p className="text-lg text-blue-100/80 mb-8 leading-relaxed max-w-lg">
                            Adjust the sliders to match your current gym stats. See exactly what manual work is costing you every single month.
                        </p>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl">
                                    ₹
                                </div>
                                <div>
                                    <div className="text-sm text-blue-200">Yearly Savings Potential</div>
                                    <div className="text-2xl font-bold text-white">₹{(moneySavedPerMonth * 12).toLocaleString('en-IN')}</div>
                                </div>
                            </div>
                        </div>
                    </MotionWrapper>

                    {/* Right Column: Calculator */}
                    <MotionWrapper delay={0.2}>
                        <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl shadow-blue-900/50">
                            <div className="space-y-8 mb-12">
                                {/* Slider 1 */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="font-semibold text-slate-700">Number of Members</label>
                                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold">
                                            {members[0]}
                                        </span>
                                    </div>
                                    <Slider
                                        value={members}
                                        onValueChange={setMembers}
                                        min={10}
                                        max={1000}
                                        step={10}
                                        className="py-4 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                                        <span>10</span>
                                        <span>1000+</span>
                                    </div>
                                </div>

                                {/* Slider 2 */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="font-semibold text-slate-700">Daily Admin Hours</label>
                                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold">
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
                                    <p className="text-xs text-slate-500 mt-2">
                                        Time spent on billing, calling, attendance, etc.
                                    </p>
                                </div>
                            </div>

                            {/* Results Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                                    <div className="text-3xl font-bold text-[#1e3a8a] mb-1">
                                        {Math.round(hoursSavedPerMonth)} hrs
                                    </div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Saved Monthly
                                    </div>
                                </div>
                                <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                                    <div className="text-3xl font-bold text-emerald-600 mb-1">
                                        ₹{Math.round(moneySavedPerMonth).toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wide">
                                        Value Saved
                                    </div>
                                </div>
                            </div>

                            <Link href="/login?view=register" className="block">
                                <Button className="w-full h-14 text-lg font-bold rounded-xl bg-[#1e3a8a] hover:bg-[#172554] shadow-lg shadow-blue-900/10">
                                    Start Saving Now
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <p className="text-center text-xs text-slate-400 mt-4">
                                *Estimated savings based on typical admin efficiency gains.
                            </p>
                        </div>
                    </MotionWrapper>
                </div>
            </div>
        </section>
    )
}
