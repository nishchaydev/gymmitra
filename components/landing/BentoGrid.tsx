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
            color: "text-blue-400",
            bg: "bg-blue-500/10"
        },
        {
            title: "Secure Payments",
            description: "Integrated invoicing & payment tracking.",
            icon: ShieldCheck,
            className: "md:col-span-1",
            color: "text-green-400",
            bg: "bg-green-500/10"
        },
        {
            title: "Member Insights",
            description: "Detailed reporting on growth, retention, and revenue.",
            icon: BarChart3,
            className: "md:col-span-1",
            color: "text-purple-400",
            bg: "bg-purple-500/10"
        },
        {
            title: "Staff Management",
            description: "Manage trainers, shifts, and payroll effortlessly.",
            icon: Users,
            className: "md:col-span-2",
            color: "text-orange-400",
            bg: "bg-orange-500/10"
        },
    ]

    return (
        <section id="features" className="py-24 bg-slate-950/50 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                        Everything you need to run your gym.
                    </h2>
                    <p className="text-lg text-slate-400">
                        Powerful features packaged in a simple, intuitive interface designed for gym owners.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className={`
                group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:border-white/20 hover:bg-white/10
                ${feature.className}
              `}
                        >
                            <div className={`
                ${feature.bg} absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl transition-all group-hover:scale-110 opacity-20
              `} />

                            <div className="relative z-10 flex h-full flex-col justify-between">
                                <div>
                                    <div className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                                        <feature.icon className={`h-6 w-6 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                    <p className="text-slate-400">{feature.description}</p>
                                </div>

                                <div className="flex items-center text-sm font-medium text-slate-500 group-hover:text-white transition-colors">
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
