"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function FAQ() {
    const faqs = [
        {
            q: "Do I need to pay a setup fee?",
            a: "No. There are no hidden setup fees. You only pay the subscription price associated with your membership tier."
        },
        {
            q: "Is my member data safe?",
            a: "Absolutely. We use industry-standard encryption (AES-256) and secure cloud servers. Your data is backed up daily."
        },
        {
            q: "Can I transfer data from my old software?",
            a: "Yes! Our team helps you migrate all your member data, active plans, and attendance logs for free during the onboarding process."
        },
        {
            q: "Does it work with my biometric machine?",
            a: "GymMitra is compatible with most standard essl and Realtime biometric devices. Contact our support to verify your specific model."
        },
        {
            q: "What happens after the 14-day trial?",
            a: "You can choose a plan to continue. If you decide not to, your account effectively pauses. We don't deduct money automatically as no credit card is required for the trial."
        }
    ]

    return (
        <section id="faq" className="py-24 bg-slate-50">
            <div className="container px-4 md:px-6 mx-auto max-w-3xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-slate-500">
                        Have doubts? We've got answers.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
                    {faqs.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${i}`} className="border-b-0 px-4">
                            <AccordionTrigger className="text-left text-lg font-semibold text-slate-800 hover:text-[#1e3a8a] py-6 [&[data-state=open]]:text-[#1e3a8a]">
                                {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-600 text-base leading-relaxed pb-6">
                                {faq.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                {/* Final CTA */}
                <div className="mt-20 text-center bg-[#1e3a8a] rounded-3xl p-12 relative overflow-hidden">
                    {/* Background Patterns */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50" />

                    <h2 className="text-3xl font-bold text-white mb-6 relative z-10">
                        Ready to automate your gym?
                    </h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto relative z-10">
                        Join 50+ other smart gym owners today. No credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                        <Link href="/login?view=register">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-[#1e3a8a] hover:bg-blue-50 font-bold w-full sm:w-auto">
                                Start 14-Day Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>

            </div>
        </section>
    )
}
