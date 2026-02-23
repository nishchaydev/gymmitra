"use client"

import {
    Zap,
    ShieldCheck,
    CheckCircle2,
    BarChart3,
    Users,
    Clock
} from "lucide-react"

export function BentoGrid() {
    const features = [
        {
            title: "Smart Attendance",
            description: "Kiosk mode, QR scanning, and automated tracking to keep your members engaged.",
            icon: Zap,
            className: "md:col-span-2",
            color: "text-primary",
            bg: "bg-primary/10"
        },
        {
            title: "Secure Payments",
            description: "Integrated invoicing & payment tracking.",
            icon: ShieldCheck,
            className: "md:col-span-1",
            color: "text-ocean",
            bg: "bg-ocean/10"
        },
        {
            title: "Member Insights",
            description: "Detailed reporting on growth, retention, and revenue.",
            icon: BarChart3,
            className: "md:col-span-1",
            color: "text-indigo-400",
            bg: "bg-indigo-500/10"
        },
        {
            title: "Staff Management",
            description: "Manage trainers, shifts, and payroll effortlessly.",
            icon: Users,
            className: "md:col-span-2",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10"
        },
    ]

    return (
        <section id="features" className="py-24 bg-white relative overflow-hidden">
            <div className="absolute inset-0 circuit-bg opacity-30" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4 font-display">
                        Everything you need <br /> to run your gym.
                    </h2>
                    <p className="text-lg text-slate-600 font-medium">
                        Powerful features packaged in a simple, intuitive interface designed for gym owners.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[280px]">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className={`
                group relative overflow-hidden rounded-[2rem] border border-drift-silver bg-white p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2
                ${feature.className}
              `}
                        >
                            <div className={`
                ${feature.bg} absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl transition-all group-hover:scale-110 opacity-10
              `} />

                            <div className="relative z-10 flex h-full flex-col justify-between">
                                <div>
                                    <div className={`h-14 w-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 shadow-inner`}>
                                        <feature.icon className={`h-7 w-7 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-3 font-display">{feature.title}</h3>
                                    <p className="text-slate-600 font-medium leading-relaxed">{feature.description}</p>
                                </div>

                                <div className="flex items-center text-xs font-black text-slate-400 group-hover:text-primary transition-colors uppercase tracking-widest">
                                    Learn more <CheckCircle2 className="ml-2 h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
