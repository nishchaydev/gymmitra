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
        <section className="py-24 bg-white">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <MotionWrapper>
                        <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl mb-4">
                            Is your gym leaking money?
                        </h2>
                    </MotionWrapper>
                    <MotionWrapper delay={0.1}>
                        <p className="text-lg text-slate-500">
                            Running a gym manually isn't just hard work. It's expensive.
                        </p>
                    </MotionWrapper>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pains.map((pain, i) => (
                        <MotionWrapper key={i} delay={0.2 * i}>
                            <div className="bg-red-50/50 border border-red-100 rounded-3xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-red-600">
                                    <pain.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#0f172a] mb-3">{pain.title}</h3>
                                <p className="text-slate-600 leading-relaxed">
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
