"use client"

import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { Star, Play, Quote } from "lucide-react"
import { useState } from "react"

export function Testimonials() {
    return (
        <section className="py-24 bg-slate-50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100/40 via-transparent to-transparent -z-10" />

            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <MotionWrapper>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
                            Gym Owners <span className="text-[#4FC3F7]">Love</span> It.
                        </h2>
                    </MotionWrapper>
                    <MotionWrapper delay={0.1}>
                        <p className="text-lg text-slate-500">
                            Join 50+ gym owners who have automated their business.
                        </p>
                    </MotionWrapper>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <TestimonialCard
                        name="Rajesh Kumar"
                        gym="FitZone Gym, Mumbai"
                        quote="Saved 2 hours every day. Invoice generation is instant! Best decision for my gym."
                        delay={0.2}
                    />
                    <TestimonialCard
                        name="Anita Singh"
                        gym="Iron Paradise, Delhi"
                        quote="My members love the WhatsApp reminders. Revenue increased by 20% in just 2 months."
                        delay={0.3}
                    />
                    <TestimonialCard
                        name="Vikram Mehta"
                        gym="CrossFit Pro, Bangalore"
                        quote="The biometric integration is seamless. No more unauthorized entries. Highly recommended!"
                        delay={0.4}
                    />
                </div>
            </div>
        </section>
    )
}

function TestimonialCard({ name, gym, quote, delay }: { name: string, gym: string, quote: string, delay: number }) {
    const [isPlaying, setIsPlaying] = useState(false)

    return (
        <MotionWrapper delay={delay} className="h-full">
            <div className="bg-white p-8 rounded-3xl border border-drift-200 shadow-xl shadow-drift-200/50 hover:shadow-2xl hover:shadow-primary-900/5 transition-all duration-300 h-full flex flex-col relative group">
                <Quote className="absolute top-8 right-8 text-primary-100 h-10 w-10 group-hover:text-primary-200 transition-colors" />

                <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-[#4FC3F7] text-[#4FC3F7]" />
                    ))}
                </div>

                <p className="text-slate-600 leading-relaxed mb-8 italic flex-1">
                    "{quote}"
                </p>

                <div className="flex items-center gap-4 mt-auto">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400">
                        {name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{name}</div>
                        <div className="text-sm text-slate-500">{gym}</div>
                    </div>
                </div>
            </div>
        </MotionWrapper>
    )
}
