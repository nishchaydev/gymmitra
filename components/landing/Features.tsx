"use client"

import { Button } from "@/components/ui/button"
import { Check, ArrowRight } from "lucide-react"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import Image from "next/image"

export function Features() {
    const solutions = [
        {
            title: "Automate Renewals with WhatsApp",
            desc: "Stop calling members manually. GymMitra sends automated reminders 7 days, 3 days, and 1 day before expiry via WhatsApp.",
            points: ["Instant message delivery", "Payment link included", "Professional reminders"],
            color: "emerald",
            image: "https://placehold.co/600x400/e2e8f0/1e293b?text=WhatsApp+Automation" // Placeholder
        },
        {
            title: "Biometric & QR Access Control",
            desc: "Secure your gym. Only active members get in. Integrate seamlessly with your existing biometric hardware or QR scanners.",
            points: ["Block expired members", "Track peak hours", "Zero unauthorized entry"],
            color: "blue",
            image: "https://placehold.co/600x400/e2e8f0/1e293b?text=Access+Control" // Placeholder
        },
        {
            title: "Branded Member App",
            desc: "Give your members a premium experience. They can book slots, check their diet plan, and renew memberships directly from their phone.",
            points: ["White-label option", "Workout tracking", "Diet plans included"],
            color: "indigo",
            image: "https://placehold.co/600x400/e2e8f0/1e293b?text=Member+Mobile+App" // Placeholder
        }
    ]

    return (
        <section id="features" className="py-24 bg-slate-50 overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto space-y-32">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl mb-4">
                        The Complete Operating System
                    </h2>
                    <p className="text-lg text-slate-500">
                        More than just software. It's an automated manager for your gym.
                    </p>
                </div>

                {solutions.map((item, i) => (
                    <div key={i} className={`flex flex-col lg:flex-row items-center gap-16 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>

                        {/* Content */}
                        <MotionWrapper direction={i % 2 === 0 ? "left" : "right"} className="flex-1 space-y-8">
                            <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide
                        ${item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    item.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        'bg-indigo-50 text-indigo-600 border-indigo-200'}
                    `}>
                                Solution 0{i + 1}
                            </div>

                            <h3 className="text-3xl md:text-4xl font-bold text-[#0f172a] leading-tight">
                                {item.title}
                            </h3>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                {item.desc}
                            </p>

                            <ul className="space-y-4">
                                {item.points.map((pt, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0
                                     ${item.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                                item.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-indigo-100 text-indigo-600'}
                                `}>
                                            <Check className="h-3.5 w-3.5" />
                                        </div>
                                        {pt}
                                    </li>
                                ))}
                            </ul>
                        </MotionWrapper>

                        {/* Visual */}
                        <MotionWrapper direction={i % 2 === 0 ? "right" : "left"} className="flex-1 w-full relative">
                            {/* Background blob */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[100px] -z-10 opacity-60
                        ${item.color === 'emerald' ? 'bg-emerald-100' :
                                    item.color === 'blue' ? 'bg-blue-100' :
                                        'bg-indigo-100'}
                    `} />

                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/50 ring-1 ring-slate-900/5 aspect-[4/3] bg-white group hover:-translate-y-2 transition-transform duration-500">
                                {/* Abstract placeholder visual since we don't have real screenshots yet */}
                                <div className={`absolute inset-0 bg-gradient-to-br opacity-10
                            ${item.color === 'emerald' ? 'from-emerald-500 to-teal-500' :
                                        item.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                                            'from-indigo-500 to-violet-500'}
                         `} />

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center p-8">
                                        <div className={`h-16 w-16 mx-auto rounded-2xl mb-4 flex items-center justify-center text-white shadow-lg
                                    ${item.color === 'emerald' ? 'bg-emerald-500' :
                                                item.color === 'blue' ? 'bg-blue-500' :
                                                    'bg-indigo-500'}
                                `}>
                                            <span className="font-bold text-2xl">{i + 1}</span>
                                        </div>
                                        <p className="font-medium text-slate-500">Visual Mockup: {item.title}</p>
                                    </div>
                                </div>
                            </div>
                        </MotionWrapper>
                    </div>
                ))}
            </div>
        </section>
    )
}
