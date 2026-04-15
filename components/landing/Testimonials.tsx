"use client"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { Zap, Clock, Smartphone, BarChart3, Bell, Shield } from "lucide-react"

export function Testimonials() {
    return (
        <section className="py-24 bg-slate-50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100/40 via-transparent to-transparent -z-10" />

            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <MotionWrapper>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4 font-display">
                            Why Gym Owners Choose GymMitra
                        </h2>
                    </MotionWrapper>
                    <MotionWrapper delay={0.1}>
                        <p className="text-lg text-slate-500">
                            Built to eliminate the manual work that slows your gym down.
                        </p>
                    </MotionWrapper>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <ReasonCard
                        icon={<Clock className="w-6 h-6 text-blue-500" />}
                        title="Save Hours Every Month"
                        description="Automate billing, invoicing, and payment reminders — no more chasing members manually."
                        delay={0.2}
                    />
                    <ReasonCard
                        icon={<Bell className="w-6 h-6 text-emerald-500" />}
                        title="WhatsApp Reminders"
                        description="Payment due dates, renewal alerts, and welcome messages — all on WhatsApp, automatically."
                        delay={0.3}
                    />
                    <ReasonCard
                        icon={<Smartphone className="w-6 h-6 text-amber-500" />}
                        title="Member Self-Service"
                        description="Members check their plans, attendance, and payment history from their own portal."
                        delay={0.4}
                    />
                    <ReasonCard
                        icon={<BarChart3 className="w-6 h-6 text-rose-500" />}
                        title="Real-Time Dashboard"
                        description="Revenue, active members, renewals, and attendance — all in one live dashboard."
                        delay={0.5}
                    />
                    <ReasonCard
                        icon={<Shield className="w-6 h-6 text-indigo-500" />}
                        title="Bank-Grade Security"
                        description="AES-256 encryption, automatic daily backups, and secure cloud infrastructure."
                        delay={0.6}
                    />
                    <ReasonCard
                        icon={<Zap className="w-6 h-6 text-orange-500" />}
                        title="Works Offline"
                        description="Mark attendance and view data even without internet — PWA powered."
                        delay={0.7}
                    />
                </div>
            </div>
        </section>
    )
}

function ReasonCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
    return (
        <MotionWrapper delay={delay} className="h-full">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-500 h-full flex flex-col relative group">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:shadow-md transition-shadow">
                    {icon}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm flex-1">
                    {description}
                </p>
            </div>
        </MotionWrapper>
    )
}