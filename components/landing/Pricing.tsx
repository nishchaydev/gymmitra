"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"

export function Pricing() {
    const plans = [
        {
            name: "Basic",
            price: "₹25,000",
            description: "Up to 200 members",
            features: [
                "Member management",
                "Billing & invoicing",
                "Attendance tracking",
                "Automated renewal reminders",
                "SMS notifications (2,000/month)",
                "Email support"
            ]
        },
        {
            name: "Pro",
            price: "₹50,000",
            description: "201-500 members",
            isPopular: true,
            features: [
                "Everything in Basic, plus:",
                "Member mobile app",
                "Workout plans & scheduling",
                "PT Management",
                "Inventory management",
                "Nutrition tracking",
                "SMS notifications (5,000/month)",
                "Phone + email support"
            ]
        },
        {
            name: "Elite",
            price: "₹1,00,000",
            description: "501-1,000 members",
            features: [
                "Everything in Pro, plus:",
                "Multi-branch support",
                "Advanced analytics & insights",
                "Custom integrations",
                "Priority support",
                "White-label mobile app option",
                "Unlimited SMS notifications"
            ]
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "Franchises & chains",
            features: [
                "Everything in Elite, plus:",
                "Global headquarters dashboard",
                "Custom branding & white-label",
                "API access via dedicated gateway",
                "Dedicated server infrastructure",
                "24/7 Priority support manager"
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
                        <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl mb-4">
                            Simple, Transparent Pricing
                        </h2>
                    </MotionWrapper>
                    <MotionWrapper delay={0.2}>
                        <p className="text-lg text-slate-500">
                            Choose the plan that fits your gym's size and growth stage.
                        </p>
                    </MotionWrapper>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan, i) => (
                        <MotionWrapper
                            key={i}
                            delay={0.2 + (i * 0.1)}
                            className={`
                relative flex flex-col p-8 rounded-3xl border transition-all duration-300 group
                ${plan.isPopular
                                    ? "border-[#10b981] shadow-2xl shadow-emerald-900/10 scale-105 z-10 bg-white ring-1 ring-[#10b981]/10"
                                    : "border-slate-100 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 bg-white"
                                }
              `}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#10b981] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg shadow-emerald-500/20">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-xl font-bold mb-2 ${plan.isPopular ? "text-[#10b981]" : "text-[#0f172a]"}`}>{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-3xl font-extrabold text-[#0f172a] tracking-tight">{plan.price}</span>
                                    <span className="text-sm text-slate-500 font-medium">{plan.price !== "Custom" ? "/year" : ""}</span>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed">{plan.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-slate-600">
                                        <div className={`mt-0.5 shrink-0 rounded-full p-0.5 mr-3 ${plan.isPopular ? "bg-[#10b981]/10 text-[#10b981]" : "bg-slate-100 text-slate-500 group-hover:bg-[#1e3a8a]/10 group-hover:text-[#1e3a8a] transition-colors"}`}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={plan.isPopular ? "default" : "outline"}
                                className={`w-full font-bold rounded-xl h-12 transition-all duration-300 ${plan.isPopular
                                        ? "bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/30 hover:-translate-y-1"
                                        : "border-slate-200 text-slate-600 hover:text-[#1e3a8a] hover:border-[#1e3a8a] hover:bg-[#1e3a8a]/5 bg-white"
                                    }`}
                                onClick={() => window.location.href = plan.price === "Custom" ? "mailto:sales@emitra.com" : "/login?view=register"}
                            >
                                {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                            </Button>
                        </MotionWrapper>
                    ))}
                </div>
            </div>
        </section>
    )
}
