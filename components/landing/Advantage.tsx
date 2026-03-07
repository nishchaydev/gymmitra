"use client"

import { XCircle, AlertCircle, FileWarning } from "lucide-react"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"

export function Advantage() {
    const pains = [
        {
            icon: XCircle,
            title: "Lost Revenue",
            desc: "Forgot to call a member? That's ₹50,000 yearly revenue lost per month of negligence."
        },
        {
            icon: AlertCircle,
            title: "Fraud Entry",
            desc: "Members sharing cards? Strangers walking in? Stop losing money at the reception."
        },
        {
            icon: FileWarning,
            title: "Paper Chaos",
            desc: "Still using registers? You have zero data on who is regular and who is about to quit."
        }
    ]

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="absolute inset-0 circuit-bg opacity-30" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <MotionWrapper>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4 font-display">
                            Is your gym leaking money?
                        </h2>
                    </MotionWrapper>
                    <MotionWrapper delay={0.1}>
                        <p className="text-xl text-slate-600 font-medium leading-relaxed">
                            Running a gym manually isn&apos;t just hard work. It&apos;s expensive.
                        </p>
                    </MotionWrapper>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pains.map((pain, i) => (
                        <MotionWrapper key={i} delay={0.2 * i}>
                            <div className="group relative bg-white border border-drift-silver rounded-[2.5rem] p-10 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2">
                                <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-8 text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                    <pain.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 font-display">{pain.title}</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">
                                    {pain.desc}
                                </p>
                            </div>
                        </MotionWrapper>
                    ))}
                </div>
            </div>
        </section>
    )
}
