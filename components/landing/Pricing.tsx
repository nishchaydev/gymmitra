"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, Zap, TrendingUp, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getBaseUrl } from "@/lib/utils"
import Link from "next/link"

export function Pricing() {
    const plans = [
        {
            name: "Pay Per Member",
            price: "₹8",
            period: "/member/mo",
            description: "Perfect for growing gyms. Only pay for who you serve.",
            isPopular: false,
            features: [
                "Full Member Management",
                "Automated WhatsApp Billing",
                "Attendance & Peak Hours",
                "Digital Invoicing",
                "Lead Management (CRM)"
            ],
            cta: "Start Free Trial",
            color: "slate"
        },
        {
            name: "Annual Flat",
            price: "₹12,000",
            period: "/year",
            description: "Up to 200 members. One simple annual payment.",
            isPopular: true,
            features: [
                "Everything in Pay Per Member",
                "Unlimited Member Capacity",
                "Priority WhatsApp Support",
                "Custom Branding",
                "Data Export & Analytics"
            ],
            cta: "Get Started Now",
            color: "primary"
        },
        {
            name: "Chain/Enterprise",
            price: "Custom",
            period: "",
            description: "For multi-location gym chains & franchises.",
            isPopular: false,
            features: [
                "Multi-location Dashboard",
                "Advanced Staff Permissions",
                "API Access",
                "Dedicated Account Manager",
                "Custom Integrations"
            ],
            cta: "Contact Sales",
            color: "slate"
        }
    ]

    return (
        <section id="pricing" className="py-24 md:py-32 bg-white relative overflow-hidden">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(0,102,255,0.05),transparent_70%)] -z-10" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                
                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <Zap className="w-3 h-3 fill-primary" />
                        Simplified Growth
                    </motion.div>
                    
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[0.95] font-display"
                    >
                        Pricing that scales <br />
                        <span className="text-primary italic">with your success.</span>
                    </motion.h2>

                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                            className={cn(
                                "relative flex flex-col p-8 md:p-10 rounded-[2.5rem] border transition-all duration-500 group overflow-hidden",
                                plan.isPopular 
                                    ? "bg-slate-900 border-slate-800 shadow-2xl scale-100 lg:scale-105 z-10" 
                                    : "bg-white border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                            )}
                        >
                            {/* Visual Glow for Popular Plan */}
                            {plan.isPopular && (
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] -mr-24 -mt-24 pointer-events-none" />
                            )}

                            {plan.isPopular && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] mb-6 w-fit shadow-lg shadow-primary/20">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-10 min-h-[140px]">
                                <h3 className={cn(
                                    "text-2xl font-black mb-3 font-display tracking-tight",
                                    plan.isPopular ? "text-white" : "text-slate-900"
                                )}>
                                    {plan.name}
                                </h3>
                                
                                <div className="flex items-baseline gap-1 mb-4">
                                    <AnimatePresence mode="wait">
                                        <motion.span 
                                            key={plan.price}
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                            className={cn(
                                                "text-5xl font-black tracking-tighter font-display",
                                                plan.isPopular ? "text-white" : "text-slate-900"
                                            )}
                                        >
                                            {plan.price}
                                        </motion.span>
                                    </AnimatePresence>
                                    {plan.period && (
                                        <span className="text-sm font-bold text-slate-500">{plan.period}</span>
                                    )}
                                </div>
                                
                                <p className={cn(
                                    "text-sm font-bold leading-relaxed",
                                    plan.isPopular ? "text-slate-400" : "text-slate-500"
                                )}>
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start text-sm font-bold">
                                        <div className={cn(
                                            "mt-0.5 shrink-0 rounded-full p-0.5 mr-3 flex items-center justify-center",
                                            plan.isPopular ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                                        )}>
                                            <Check className="h-3 w-3" strokeWidth={4} />
                                        </div>
                                        <span className={plan.isPopular ? "text-slate-300" : "text-slate-600"}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                asChild
                                className={cn(
                                    "w-full h-14 font-black rounded-2xl transition-all duration-300 uppercase tracking-widest text-xs shadow-xl active:scale-[0.98]",
                                    plan.isPopular
                                        ? "bg-primary hover:bg-white hover:text-primary text-white shadow-primary/20"
                                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-950/10"
                                )}
                            >
                                <Link 
                                    href={plan.name === "Chain/Enterprise" ? `${getBaseUrl()}#contact` : `${getBaseUrl()}/start-trial`}
                                >
                                    {plan.cta}
                                </Link>
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Indicators */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-20 flex flex-wrap justify-center gap-12 border-t border-slate-100 pt-12"
                >
                    <PricingIndicator icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />} label="Secure UPI Payments" />
                    <PricingIndicator icon={<Sparkles className="w-5 h-5 text-amber-500" />} label="1-Month Free Trial" />
                    <PricingIndicator icon={<TrendingUp className="w-5 h-5 text-blue-500" />} label="No Hidden Fees" />
                </motion.div>
            </div>
        </section>
    )
}

function PricingIndicator({ icon, label }: { icon: React.ReactNode, label: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                {icon}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
    )
}
