import React from 'react'
import Link from 'next/link'

export default function TermsAndConditionsPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-100 prose prose-slate prose-emerald">
                <h1>Terms and Conditions</h1>
                <p className="text-sm text-slate-500 mb-8 italic">
                    Effective Date: March 2026 | Product: GymMitra | Operated by: eMitra Technologies
                </p>

                <p>
                    These Terms govern the use of GymMitra by gym owners and their administrators. By creating an account or using the platform, you agree to these Terms. Please read them carefully.
                </p>

                <h2>1. Definitions</h2>
                <ul>
                    <li><strong>&quot;Platform&quot;</strong> refers to GymMitra, accessible at gym.emitra.dev and associated services.</li>
                    <li><strong>&quot;Company&quot;, &quot;We&quot;, &quot;Us&quot;</strong> refers to eMitra Technologies, the operator of GymMitra.</li>
                    <li><strong>&quot;Customer&quot; or &quot;You&quot;</strong> refers to the gym owner, administrator, or business entity that registers and uses GymMitra.</li>
                    <li><strong>&quot;Gym Members&quot;</strong> refers to the individuals whose data is managed within the Customer&apos;s GymMitra workspace.</li>
                    <li><strong>&quot;Workspace&quot;</strong> refers to the isolated, tenant-specific environment created for each gym on the platform.</li>
                </ul>

                <h2>2. Eligibility and Account Registration</h2>
                <p>To use GymMitra, you must:</p>
                <ul>
                    <li>Be at least 18 years of age</li>
                    <li>Be legally authorised to enter into agreements on behalf of your gym or business</li>
                    <li>Provide accurate and complete information during registration</li>
                </ul>
                <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at support@emitra.dev if you suspect unauthorized access.</p>

                <h2>3. Permitted Use</h2>
                <p>
                    GymMitra is a gym management platform designed to help gym businesses manage member records, attendance, billing, and operations. You may use the platform only for lawful business purposes consistent with these Terms.
                </p>
                <p>You agree NOT to:</p>
                <ul>
                    <li>Use GymMitra for any purpose other than managing a legitimate fitness or gym business</li>
                    <li>Enter false, misleading, or fraudulent information about members or transactions</li>
                    <li>Attempt to access another gym&apos;s data or workspace</li>
                    <li>Reverse-engineer, copy, or redistribute any part of the platform</li>
                    <li>Use the platform in violation of any applicable law, including India&apos;s DPDP Act, 2023</li>
                </ul>

                <h2>4. Your Responsibilities as a Data Controller</h2>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg my-6">
                    <p className="font-bold text-amber-900 mt-0">This is an important section.</p>
                    <p className="text-amber-800 mb-0">
                        As a gym owner using GymMitra, you are the Data Fiduciary / Controller of your gym members&apos; personal data under the DPDP Act, 2023. We (eMitra Technologies) act as a Data Processor on your behalf.
                    </p>
                </div>
                <p>You are responsible for:</p>
                <ul>
                    <li>Informing your gym members that their data is being managed using GymMitra</li>
                    <li>Obtaining any consent required from your gym members for data collection</li>
                    <li>Ensuring the data you enter is accurate and used only for legitimate gym management purposes</li>
                    <li>Handling member data deletion or correction requests directed to you by your members</li>
                    <li>Complying with applicable data protection laws in your jurisdiction</li>
                </ul>

                <h2>5. Subscription and Pricing</h2>
                <p>GymMitra offers the following pricing tiers as of the effective date of these Terms:</p>
                <ul>
                    <li><strong>Monthly Plan:</strong> ₹8 per member per month</li>
                    <li><strong>Annual Plan:</strong> ₹12,000 per year (flat rate, unlimited members)</li>
                    <li><strong>Custom Plan:</strong> Available for larger or multi-location gyms — contact us for pricing</li>
                </ul>
                <p>
                    Pricing is subject to change. Existing customers will be notified at least 30 days before any price change takes effect. Customers on grandfathered pricing agreements will retain their rates for the agreed period.
                </p>

                <h2>6. Free Trial</h2>
                <p>
                    GymMitra offers a 2-month free trial for new gym owners. No credit card or payment is required to start the trial. At the end of the trial period, you may choose to subscribe to a paid plan or your account will be paused (data retained for 60 days).
                </p>

                <h2>7. Payments</h2>
                <p>
                    GymMitra does not currently have an integrated payment gateway. Payment arrangements (if any) are managed separately and directly between you and eMitra Technologies. No card data or payment credentials are stored on our platform. Details of accepted payment methods will be communicated during onboarding.
                </p>

                <h2>8. Service Availability</h2>
                <p>
                    We strive to maintain platform availability at all times. However, we do not guarantee 100% uptime. Scheduled maintenance, third-party service outages (e.g., Supabase, Vercel), or unforeseen technical issues may temporarily affect access. We will make reasonable efforts to notify you in advance of planned downtime.
                </p>

                <h2>9. Intellectual Property</h2>
                <p>
                    GymMitra and all related content, design, code, and branding are the intellectual property of eMitra Technologies. You are granted a limited, non-exclusive, non-transferable licence to use the platform for your gym management purposes during the term of your subscription.
                </p>
                <p>
                    You retain ownership of all data you enter into the platform (member records, financial data, etc.). We do not claim any ownership over your data.
                </p>

                <h2>10. Limitation of Liability</h2>
                <p>
                    To the maximum extent permitted by applicable law, eMitra Technologies shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of GymMitra. Our total liability for any claim related to the platform shall not exceed the amount you paid to us in the 3 months preceding the claim.
                </p>
                <p className="font-semibold">
                    GymMitra is a software tool — we are not responsible for business decisions made based on data displayed in the platform. Always verify critical information independently.
                </p>

                <h2>11. Contact</h2>
                <p>For any privacy concerns or data requests, reach us at:</p>
                <ul>
                    <li><strong>Email:</strong> support@emitra.dev</li>
                    <li><strong>WhatsApp:</strong> +91 62618 54014</li>
                    <li><strong>Operated by:</strong> eMitra Technologies, Indore, Madhya Pradesh, India</li>
                </ul>

                <hr className="my-8" />
                <div className="flex justify-center gap-6">
                    <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium no-underline hover:underline">
                        Privacy Policy
                    </Link>
                    <Link href="/refund" className="text-emerald-600 hover:text-emerald-700 font-medium no-underline hover:underline">
                        Refund Policy
                    </Link>
                </div>
            </div>
        </div>
    )
}
