import React from 'react'
import Link from 'next/link'

export const metadata = {
    title: 'Privacy Policy | GymMitra',
    description: 'GymMitra privacy policy — how we handle your data. Operated by eMitra Technologies.',
}

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="relative overflow-hidden border-b border-slate-800/60">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
                <div className="relative max-w-4xl mx-auto px-6 py-16 sm:py-20 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-6">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                        Data Protection
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
                        Effective Date: March 2026 · Product: GymMitra · Operated by eMitra Technologies
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-12 sm:py-16 space-y-10">
                <p className="text-sm text-slate-300 leading-relaxed">
                    GymMitra is a B2B SaaS platform serving two types of users: (1) <strong className="text-white">Gym Owners / Administrators</strong> — businesses that use GymMitra to manage operations, and (2) <strong className="text-white">Gym Members</strong> — individuals whose data is entered by the gym they attend. This policy applies to both.
                </p>

                {/* Section 1 */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">1</div>
                        <h2 className="text-xl font-bold text-white">Who We Are</h2>
                    </div>
                    <div className="pl-11 text-sm text-slate-300 leading-relaxed">
                        <p>GymMitra is a gym management software product developed and operated by <strong className="text-white">eMitra Technologies</strong>, based in Indore, Madhya Pradesh, India. For any privacy-related queries, contact us at <a href="mailto:support@emitra.dev" className="text-sky-400 hover:text-sky-300 transition-colors">support@emitra.dev</a>.</p>
                    </div>
                </section>

                {/* Section 2 */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">2</div>
                        <h2 className="text-xl font-bold text-white">What Data We Collect</h2>
                    </div>
                    <div className="pl-11 space-y-4 text-sm text-slate-300 leading-relaxed">
                        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 space-y-2">
                            <p className="text-xs text-sky-400 uppercase tracking-wider font-semibold">From Gym Owners (Direct Customers)</p>
                            <ul className="space-y-1">
                                {['Full name, email address, and phone number', 'Gym business name, address, and contact details', 'Login credentials (password stored encrypted via Supabase Auth)', 'Usage logs, feature interactions, and platform activity'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2"><span className="text-slate-500">•</span>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 space-y-2">
                            <p className="text-xs text-sky-400 uppercase tracking-wider font-semibold">From/About Gym Members (via Gym Owners)</p>
                            <ul className="space-y-1">
                                {['Full name, phone number, and date of birth', 'Membership plan, start date, and expiry date', 'Fee payment status and billing history', 'Attendance records', 'Any additional notes or custom fields'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2"><span className="text-slate-500">•</span>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-sm text-emerald-200/80">
                            <strong className="text-emerald-300">Important:</strong> GymMitra does not directly collect data from gym members. The gym owner is responsible for informing members and obtaining any required consent.
                        </div>
                        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 space-y-2">
                            <p className="text-xs text-sky-400 uppercase tracking-wider font-semibold">Technical Data (Automatic)</p>
                            <ul className="space-y-1">
                                {['IP address, browser/device type, and session data', 'Error logs and performance metrics', 'Cookies and local storage for session management'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2"><span className="text-slate-500">•</span>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 3 */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">3</div>
                        <h2 className="text-xl font-bold text-white">How We Use Your Data</h2>
                    </div>
                    <div className="pl-11 text-sm text-slate-300 leading-relaxed space-y-4">
                        {[
                            { label: 'To Deliver the Service', items: ['Create and manage gym owner accounts and workspaces', 'Store and display gym member records and attendance', 'Generate invoices, reports, and financial summaries', 'Send authentication emails via Supabase Auth'] },
                            { label: 'To Improve the Product', items: ['Analyse usage patterns to identify bugs and improve features', 'Monitor platform performance and uptime'] },
                            { label: 'To Communicate', items: ['Send transactional emails (confirmations, password resets)', 'Respond to support requests via WhatsApp or email'] },
                        ].map((group) => (
                            <div key={group.label}>
                                <p className="font-medium text-white mb-1.5">{group.label}</p>
                                <ul className="space-y-1">
                                    {group.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2"><span className="text-slate-500">•</span>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        <p className="text-slate-400 font-medium">
                            We do not send marketing emails without opt-in. We do not sell or share your data with third-party advertisers.
                        </p>
                    </div>
                </section>

                {/* Sections 4-7 */}
                {[
                    { num: 4, title: 'Data Storage and Security', content: 'Your data is stored on Supabase — a managed cloud database platform. We implement Row-Level Security (RLS) for data isolation, encrypted connections (HTTPS/TLS), password hashing via bcrypt, and strict access controls.' },
                    { num: 5, title: 'Data Retention', content: 'We retain your data for as long as your account remains active. Upon account closure or deletion request, gym owner account data is deleted within 30 days. Associated gym member records are deleted alongside. Backups may retain data for up to 90 days after deletion.' },
                    { num: 6, title: 'Data Sharing', content: 'We do not sell your data. We share data only with Supabase (database, auth, storage), Vercel (hosting, CDN), and WhatsApp Business (support). All providers are bound by their own data processing terms.' },
                ].map((section) => (
                    <section key={section.num} className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">{section.num}</div>
                            <h2 className="text-xl font-bold text-white">{section.title}</h2>
                        </div>
                        <div className="pl-11 text-sm text-slate-300 leading-relaxed">
                            <p>{section.content}</p>
                        </div>
                    </section>
                ))}

                {/* Section 7 */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">7</div>
                        <h2 className="text-xl font-bold text-white">Your Rights Under the DPDP Act, 2023</h2>
                    </div>
                    <div className="pl-11 text-sm text-slate-300 leading-relaxed space-y-3">
                        <p>Under India&apos;s Digital Personal Data Protection Act, 2023, you have the following rights:</p>
                        <ul className="space-y-1.5">
                            {[
                                { right: 'Right to access', desc: 'Request a copy of the personal data we hold about you' },
                                { right: 'Right to correction', desc: 'Request correction of inaccurate or incomplete data' },
                                { right: 'Right to erasure', desc: 'Request deletion of your personal data' },
                                { right: 'Right to nominate', desc: 'Nominate another individual to exercise your rights in case of incapacity' },
                            ].map((r, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                    <span><strong className="text-white">{r.right}</strong> — {r.desc}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-slate-400 italic">
                            Gym members should first contact their gym directly, as the gym owner manages their data within our platform.
                        </p>
                    </div>
                </section>

                {/* Section: Contact */}
                <section className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-600/30 border border-slate-600/30 flex items-center justify-center text-slate-400 text-sm font-bold">8</div>
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
                                <span className="text-slate-300">+91 62618 54014 <span className="text-slate-500">(business hours)</span></span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500 w-20">Location</span>
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
