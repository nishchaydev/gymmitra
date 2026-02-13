"use client"

import { Check } from "lucide-react"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { WhatsAppMockup } from "@/components/landing/features/WhatsAppMockup"
import { AccessControlMockup } from "@/components/landing/features/AccessControlMockup"
import { MemberAppMockup } from "@/components/landing/features/MemberAppMockup"

export function Features() {
    const solutions = [
        {
            title: "Automate Renewals with WhatsApp",
            desc: "Stop calling members manually. GymMitra sends automated reminders 7 days, 3 days, and 1 day before expiry via WhatsApp.",
            points: ["Instant message delivery", "Payment link included", "Professional reminders"],
            component: <WhatsAppMockup />
        },
        {
            title: "Biometric & QR Access Control",
            desc: "Secure your gym. Only active members get in. Integrate seamlessly with your existing biometric hardware or QR scanners.",
            points: ["Block expired members", "Track peak hours", "Zero unauthorized entry"],
            component: <AccessControlMockup />
        },
        {
            title: "Branded Member App",
            desc: "Give your members a premium experience. They can book slots, check their diet plan, and renew memberships directly from their phone.",
            points: ["White-label option", "Workout tracking", "Diet plans included"],
            component: <div className="max-w-[280px] mx-auto"><MemberAppMockup /></div>
        }
    ]

    return (
        <section id="features" className="py-24 bg-slate-50 overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto space-y-32">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
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
                            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide bg-[#4FC3F7]/10 text-[#4FC3F7] border-[#4FC3F7]/20">
                                Solution 0{i + 1}
                            </div>

                            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                                {item.title}
                            </h3>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                {item.desc}
                            </p>

                            <ul className="space-y-4">
                                {item.points.map((pt, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-[#4FC3F7]/10 text-[#4FC3F7]">
                                            <Check className="h-3.5 w-3.5" />
                                        </div>
                                        {pt}
                                    </li>
                                ))}
                            </ul>
                        </MotionWrapper>

                        {/* Visual */}
                        <MotionWrapper direction={i % 2 === 0 ? "right" : "left"} className="flex-1 w-full relative">
                            {/* Background Elements */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] -z-10">
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#4FC3F7]/20 to-transparent rounded-full blur-[80px] opacity-60" />
                            </div>

                            <div className="relative transform hover:scale-[1.02] transition-transform duration-500 ease-out">
                                {item.component}
                            </div>
                        </MotionWrapper>
                    </div>
                ))}
            </div>
        </section>
    )
}
