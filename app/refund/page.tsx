import React from 'react'
import Link from 'next/link'

export const metadata = {
    title: 'Refund Policy | GymMitra',
    description: 'GymMitra strict no-refund and cancellation policy by eMitra Technologies.',
}

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="relative overflow-hidden border-b border-slate-800/60">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
                <div className="relative max-w-4xl mx-auto px-6 py-16 sm:py-20 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-wider uppercase mb-6">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                        No Refund Policy
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Refund & Cancellation Policy
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
                        Effective Date: March 2026 · Product: GymMitra · Operated by eMitra Technologies
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-12 sm:py-16 space-y-10">
                {/* Critical Banner */}
                <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-6 sm:p-8 backdrop-blur">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-red-300 mb-2">Strict No Refund Policy</h2>
                            <p className="text-red-200/80 text-sm leading-relaxed">
                                <strong className="text-red-200">All payments made towards GymMitra subscriptions or licensing are final and non-refundable.</strong>{' '}
                                We provide a generous 30-day free trial so you can fully evaluate the platform before committing to any paid plan. Once payment is made, no refund will be issued under any circumstances through standard channels.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section: Free Trial */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">1</div>
                        <h2 className="text-xl font-bold text-white">Free Trial</h2>
                    </div>
                    <div className="pl-11 space-y-3 text-sm text-slate-300 leading-relaxed">
                        <p>
                            GymMitra offers a <strong className="text-white">30-day free trial</strong> for all new gym owners. No credit card or payment information is required to start your trial. You will not be charged during or at the end of the trial — a paid license must be activated manually.
                        </p>
                        <p className="text-slate-400">
                            Since no payment is collected during the trial, no refund applies for the trial period.
                        </p>
                    </div>
                </section>

                {/* Section: Paid Subscriptions */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm font-bold">2</div>
                        <h2 className="text-xl font-bold text-white">Paid Subscriptions</h2>
                    </div>
                    <div className="pl-11 text-sm text-slate-300 leading-relaxed">
                        <p className="mb-3">GymMitra currently offers the following paid plans:</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                { name: 'Monthly', price: '₹8/member/mo', desc: 'Per active member' },
                                { name: 'Annual', price: '₹12,000/yr', desc: 'Flat rate, unlimited' },
                                { name: 'Enterprise', price: 'Custom', desc: 'Per agreement' },
                            ].map((plan) => (
                                <div key={plan.name} className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-4">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{plan.name}</p>
                                    <p className="text-lg font-bold text-white">{plan.price}</p>
                                    <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section: No Refunds */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-sm font-bold">3</div>
                        <h2 className="text-xl font-bold text-white">No Refunds — Final Sale</h2>
                    </div>
                    <div className="pl-11 space-y-4 text-sm text-slate-300 leading-relaxed">
                        <p>
                            Once a paid subscription or license fee is processed, <strong className="text-white">it is considered final and non-refundable.</strong> This includes but is not limited to:
                        </p>
                        <ul className="space-y-2">
                            {[
                                'Non-usage of the platform after purchase',
                                'Dissatisfaction with features or functionality',
                                'Failure to cancel before the renewal date',
                                'Account suspension due to policy violations',
                                'Third-party services or integrations not managed by eMitra Technologies',
                                'Change of business or decision to stop using the platform',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-slate-400 italic">
                            We strongly recommend using the full 30-day free trial period to evaluate whether GymMitra is the right fit for your gym before making any payment.
                        </p>
                    </div>
                </section>

                {/* Section: Internal Cases */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">4</div>
                        <h2 className="text-xl font-bold text-white">Internal / Exceptional Cases</h2>
                    </div>
                    <div className="pl-11">
                        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-5 space-y-3 text-sm">
                            <p className="text-amber-200/90 leading-relaxed">
                                If you believe your case involves an <strong className="text-amber-200">internal issue</strong> on our end — such as a confirmed platform fault, duplicate charge caused by a system error, or a billing error attributable to GymMitra — you may write to us for review.
                            </p>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/15">
                                <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                </svg>
                                <div>
                                    <p className="text-xs text-amber-400/70 uppercase tracking-wider">Contact for review</p>
                                    <a href="mailto:support@emitra.dev" className="text-amber-300 font-semibold hover:text-amber-200 transition-colors">
                                        support@emitra.dev
                                    </a>
                                </div>
                            </div>
                            <p className="text-amber-200/60 text-xs">
                                All internal reviews are handled on a case-by-case basis at the sole discretion of eMitra Technologies. Submitting a request does not guarantee any refund or credit.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section: Cancellation */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm font-bold">5</div>
                        <h2 className="text-xl font-bold text-white">Cancellation</h2>
                    </div>
                    <div className="pl-11 space-y-3 text-sm text-slate-300 leading-relaxed">
                        <p>You may cancel your paid subscription at any time by emailing <strong className="text-white">support@emitra.dev</strong> or via WhatsApp.</p>
                        <ul className="space-y-2">
                            {[
                                'Your access will continue until the end of your current billing period',
                                'No further payments will be charged after cancellation',
                                'Your data will be retained for 30 days after subscription ends, then permanently deleted unless requested otherwise',
                                'No refund will be issued for remaining days in the billing period',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <svg className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Section: Contact */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-600/30 border border-slate-600/30 flex items-center justify-center text-slate-400 text-sm font-bold">6</div>
                        <h2 className="text-xl font-bold text-white">Contact Us</h2>
                    </div>
                    <div className="pl-11">
                        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 space-y-2 text-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500 w-20">Email</span>
                                <a href="mailto:support@emitra.dev" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">support@emitra.dev</a>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500 w-20">WhatsApp</span>
                                <span className="text-slate-300">+91 62618 54014 <span className="text-slate-500">(business hours)</span></span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500 w-20">Operator</span>
                                <span className="text-slate-300">eMitra Technologies, Indore, MP, India</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer Links */}
                <div className="pt-8 border-t border-slate-800/60">
                    <div className="flex flex-wrap justify-center gap-6 text-sm">
                        <Link href="/terms" className="text-slate-400 hover:text-sky-400 transition-colors font-medium">
                            Terms & Conditions
                        </Link>
                        <Link href="/privacy" className="text-slate-400 hover:text-sky-400 transition-colors font-medium">
                            Privacy Policy
                        </Link>
                        <Link href="/" className="text-slate-400 hover:text-sky-400 transition-colors font-medium">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
