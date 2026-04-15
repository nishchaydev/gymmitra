import React from 'react'
import Link from 'next/link'

export const metadata = {
    title: 'Terms and Conditions | GymMitra',
    description: 'GymMitra terms and conditions for gym owners by eMitra Technologies.',
}

export default function TermsAndConditionsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="relative overflow-hidden border-b border-slate-800/60">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
                <div className="relative max-w-4xl mx-auto px-6 py-16 sm:py-20 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold tracking-wider uppercase mb-6">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        Legal Agreement
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Terms and Conditions
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
                        Effective Date: March 2026 · Product: GymMitra · Operated by eMitra Technologies
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-12 sm:py-16 space-y-10">
                <p className="text-sm text-slate-300 leading-relaxed">
                    These Terms govern the use of GymMitra by gym owners and their administrators. By creating an account or using the platform, you agree to these Terms. Please read them carefully.
                </p>

                {/* Section 1 */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm font-bold">1</div>
                        <h2 className="text-xl font-bold text-white">Definitions</h2>
                    </div>
                    <div className="pl-11 text-sm text-slate-300 leading-relaxed space-y-2">
                        <ul className="space-y-2">
                            <li><strong className="text-white">&quot;Platform&quot;</strong> — GymMitra, accessible at gym.emitra.dev and associated services.</li>
                            <li><strong className="text-white">&quot;Company&quot;, &quot;We&quot;, &quot;Us&quot;</strong> — eMitra Technologies, the operator of GymMitra.</li>
                            <li><strong className="text-white">&quot;Customer&quot; or &quot;You&quot;</strong> — the gym owner, administrator, or entity using GymMitra.</li>
                            <li><strong className="text-white">&quot;Gym Members&quot;</strong> — individuals whose data is managed within the Customer&apos;s workspace.</li>
                            <li><strong className="text-white">&quot;Workspace&quot;</strong> — the isolated, tenant-specific environment created for each gym.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 2 */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm font-bold">2</div>
                        <h2 className="text-xl font-bold text-white">Eligibility and Account Registration</h2>
                    </div>
                    <div className="pl-11 text-sm text-slate-300 leading-relaxed space-y-3">
                        <p>To use GymMitra, you must:</p>
                        <ul className="space-y-1.5">
                            {['Be at least 18 years of age', 'Be legally authorised to enter into agreements on behalf of your gym or business', 'Provide accurate and complete information during registration'].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <svg className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-slate-400">
                            You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us at support@emitra.dev if you suspect unauthorized access.
                        </p>
                    </div>
                </section>

                {/* Section 3 */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm font-bold">3</div>
                        <h2 className="text-xl font-bold text-white">Permitted Use</h2>
                    </div>
                    <div className="pl-11 text-sm text-slate-300 leading-relaxed space-y-3">
                        <p>GymMitra is designed to help gym businesses manage member records, attendance, billing, and operations. You may use it only for lawful business purposes.</p>
                        <p className="font-medium text-white">You agree NOT to:</p>
                        <ul className="space-y-1.5">
                            {[
                                'Use GymMitra for any purpose other than a legitimate fitness business',
                                'Enter false, misleading, or fraudulent information',
                                'Attempt to access another gym\'s data or workspace',
                                'Reverse-engineer, copy, or redistribute any part of the platform',
                                'Use the platform in violation of any applicable law, including India\'s DPDP Act, 2023',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Section 4 */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">4</div>
                        <h2 className="text-xl font-bold text-white">Your Responsibilities as a Data Controller</h2>
                    </div>
                    <div className="pl-11 space-y-4">
                        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-5 text-sm">
                            <p className="text-amber-200/90 leading-relaxed">
                                As a gym owner using GymMitra, you are the <strong className="text-amber-200">Data Fiduciary / Controller</strong> of your gym members&apos; personal data under the DPDP Act, 2023. We (eMitra Technologies) act as a Data Processor on your behalf.
                            </p>
                        </div>
                        <div className="text-sm text-slate-300 leading-relaxed space-y-1.5">
                            <p className="font-medium text-white">You are responsible for:</p>
                            <ul className="space-y-1.5">
                                {[
                                    'Informing your gym members that their data is managed using GymMitra',
                                    'Obtaining any consent required from your gym members',
                                    'Ensuring the data you enter is accurate and used for legitimate purposes',
                                    'Handling member data deletion or correction requests',
                                    'Complying with applicable data protection laws in your jurisdiction',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                        <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 5 */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm font-bold">5</div>
                        <h2 className="text-xl font-bold text-white">Subscription and Pricing</h2>
                    </div>
                    <div className="pl-11 text-sm text-slate-300 leading-relaxed space-y-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                { name: 'Monthly', price: '₹8/member/mo' },
                                { name: 'Annual', price: '₹12,000/year' },
                                { name: 'Custom', price: 'Contact us' },
                            ].map((plan) => (
                                <div key={plan.name} className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-4 text-center">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{plan.name}</p>
                                    <p className="text-lg font-bold text-white">{plan.price}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-slate-400">
                            Pricing is subject to change. Existing customers will be notified at least 30 days before any change takes effect.
                        </p>
                    </div>
                </section>

                {/* Section 6 */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">6</div>
                        <h2 className="text-xl font-bold text-white">Free Trial</h2>
                    </div>
                    <div className="pl-11 text-sm text-slate-300 leading-relaxed">
                        <p>
                            GymMitra offers a <strong className="text-white">30-day free trial</strong> for new gym owners. No payment is required. At the end of the trial, you may subscribe to a paid plan or your account will be paused (data retained for 60 days).
                        </p>
                    </div>
                </section>

                {/* Section 7 */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm font-bold">7</div>
                        <h2 className="text-xl font-bold text-white">Payments</h2>
                    </div>
                    <div className="pl-11 text-sm text-slate-300 leading-relaxed">
                        <p>
                            GymMitra does not currently have an integrated payment gateway. Payment arrangements are managed directly between you and eMitra Technologies. No card data or payment credentials are stored on our platform.
                        </p>
                    </div>
                </section>

                {/* Sections 8-10 */}
                {[
                    { num: 8, title: 'Service Availability', content: 'We strive to maintain platform availability at all times. However, we do not guarantee 100% uptime. Scheduled maintenance, third-party service outages (e.g., Supabase, Vercel), or unforeseen technical issues may temporarily affect access. We will make reasonable efforts to notify you in advance of planned downtime.' },
                    { num: 9, title: 'Intellectual Property', content: 'GymMitra and all related content, design, code, and branding are the intellectual property of eMitra Technologies. You are granted a limited, non-exclusive, non-transferable licence to use the platform during your subscription. You retain ownership of all data you enter into the platform.' },
                    { num: 10, title: 'Limitation of Liability', content: 'To the maximum extent permitted by applicable law, eMitra Technologies shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of GymMitra. Our total liability shall not exceed the amount you paid to us in the 3 months preceding the claim. GymMitra is a software tool — we are not responsible for business decisions made based on data displayed in the platform.' },
                ].map((section) => (
                    <section key={section.num} className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm font-bold">{section.num}</div>
                            <h2 className="text-xl font-bold text-white">{section.title}</h2>
                        </div>
                        <div className="pl-11 text-sm text-slate-300 leading-relaxed">
                            <p>{section.content}</p>
                        </div>
                    </section>
                ))}

                {/* Section: Contact */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-600/30 border border-slate-600/30 flex items-center justify-center text-slate-400 text-sm font-bold">11</div>
                        <h2 className="text-xl font-bold text-white">Contact</h2>
                    </div>
                    <div className="pl-11">
                        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 space-y-2 text-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500 w-20">Email</span>
                                <a href="mailto:support@emitra.dev" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">support@emitra.dev</a>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500 w-20">WhatsApp</span>
                                <span className="text-slate-300">+91 62618 54014</span>
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
                        <Link href="/privacy" className="text-slate-400 hover:text-sky-400 transition-colors font-medium">
                            Privacy Policy
                        </Link>
                        <Link href="/refund" className="text-slate-400 hover:text-sky-400 transition-colors font-medium">
                            Refund Policy
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
