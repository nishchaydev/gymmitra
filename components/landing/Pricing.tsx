"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"

import { getBaseUrl } from "@/lib/utils"

export function Pricing() {
    const plans = [
        {
            name: "Pay Per Member",
            price: "₹8",
            description: "Best for gyms under 150 members",
            isPopular: false,
            features: [
                "Member management",
                "Billing & invoicing",
                "Attendance tracking",
                "WhatsApp renewal reminders",
                "WhatsApp birthday wishes",
                "Expense tracking",
                "Lead management (CRM)",
                "Daily briefing emails",
                "Branded dashboard"
            ]
        },
        {
            name: "Annual Flat",
            price: "₹12,000",
            description: "All features. One payment. No surprises.",
            isPopular: true,
            features: [
                "Member management",
                "Billing & invoicing",
                "Attendance tracking",
                "WhatsApp renewal reminders",
                "WhatsApp birthday wishes",
                "Expense tracking",
                "Lead management (CRM)",
                "Daily briefing emails",
                "Branded dashboard"
            ]
        },
        {
            name: "Custom",
            price: "",
            description: "For larger gyms & chains",
            isPopular: false,
            features: [
                "Member management",
                "Billing & invoicing",
                "Attendance tracking",
                "WhatsApp renewal reminders",
                "WhatsApp birthday wishes",
                "Expense tracking",
                "Lead management (CRM)",
                "Daily briefing emails",
                "Branded dashboard"
            ]
        }
    ]

    return (
        <section id="pricing" className="py-24 bg-white relative">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white -z-10" />

            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <MotionWrapper delay={0.1}>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4 font-display">
                            Simple, Transparent Pricing
                        </h2>
                    </MotionWrapper>
                    <MotionWrapper delay={0.2}>
                        <p className="text-lg text-slate-500 font-medium">
                            Choose the plan that fits your gym&apos;s size and growth stage.
                        </p>
                    </MotionWrapper>
                </div>
                
                {/* Additional text above cards */}
                <div className="text-center max-w-2xl mx-auto mb-10 text-sm text-slate-500">
                    Every plan includes every feature. No limits, no upgrades required.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, i) => (
                        <MotionWrapper
                            key={i}
                            delay={0.2 + (i * 0.1)}
                            className={`
                relative flex flex-col p-8 rounded-3xl border transition-all duration-300 group glass-card
                ${plan.isPopular
                                    ? "border-primary shadow-2xl shadow-primary/10 scale-105 z-10 !bg-white/80 ring-1 ring-primary/10"
                                    : "border-drift-silver hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                                }
              `}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-xl font-black mb-2 font-display ${plan.isPopular ? "text-primary" : "text-midnight"}`}>{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    {plan.price ? (
                                        <>
                                            <span className="text-3xl font-black text-slate-900 tracking-tight font-display">{plan.price}</span>
                                            <span className="text-sm text-slate-500 font-bold">{plan.name === "Pay Per Member" ? "/member/month" : "/year"}</span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-slate-500 font-bold">Custom</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">{plan.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-slate-600 font-medium">
                                        <div className={`mt-0.5 shrink-0 rounded-full p-0.5 mr-3 ${plan.isPopular ? "bg-ocean/10 text-ocean" : "bg-slate-100 text-slate-400 group-hover:bg-ocean/10 group-hover:text-ocean transition-colors"}`}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={plan.isPopular ? "default" : "outline"}
                                className={`w-full font-black rounded-xl h-12 transition-all duration-300 uppercase tracking-wider text-xs ${plan.isPopular
                                    ? "bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/30 hover:-translate-y-1"
                                    : "border-drift-silver text-slate-600 hover:text-primary hover:border-primary hover:bg-primary/5 bg-transparent"
                                }`}
                                onClick={() => {
                                    if (plan.name === "Custom") {
                                        // For Custom plan, link to WhatsApp or contact section
                                        window.location.href = `${getBaseUrl()}#contact`;
                                    } else {
                                        window.location.href = `${getBaseUrl()}/start-trial`;
                                    }
                                }}
                            >
                                {plan.name === "Custom" 
                                    ? "Need better pricing? Get in touch" 
                                    : plan.price === "" 
                                        ? "Contact Sales" 
                                        : "Start Free Trial"}
                            </Button>
                        </MotionWrapper>
                    ))}
                </div>
                
                {/* Additional text below cards */}
                <div className="text-center max-w-2xl mx-auto mt-10 text-sm text-slate-500">
                    Reply within 5 hours, 7 days a week — WhatsApp support included in every plan.
                </div>
            </div>
        </section>
    )
}
