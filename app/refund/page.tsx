import React from 'react'
import Link from 'next/link'

export const metadata = {
    title: 'Refund Policy | GymMitra',
    description: 'GymMitra refund and cancellation policy by eMitra Technologies.',
}

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-100 prose prose-slate prose-emerald">
                <h1>Refund & Cancellation Policy</h1>
                <p className="text-sm text-slate-500 mb-8 italic">
                    Effective Date: March 2026 | Product: GymMitra | Operated by: eMitra Technologies
                </p>

                <p>
                    This policy applies to all subscription and licensing payments made for GymMitra, a B2B SaaS gym management platform operated by eMitra Technologies.
                </p>

                <h2>1. Free Trial</h2>
                <p>
                    GymMitra offers a <strong>30-day free trial</strong> for all new gym owners. No credit card or payment is required to start the trial. You will not be charged during or at the end of the trial period — a paid license must be activated manually.
                </p>
                <p>
                    Since no payment is collected during the trial, <strong>no refund applies</strong> for the trial period.
                </p>

                <h2>2. Paid Subscriptions</h2>
                <p>GymMitra offers the following paid plans:</p>
                <ul>
                    <li><strong>Monthly Plan:</strong> ₹8 per active member per month</li>
                    <li><strong>Annual Plan:</strong> ₹12,000 per year (flat rate, unlimited members)</li>
                    <li><strong>Custom / Enterprise Plan:</strong> As per individual agreement</li>
                </ul>

                <h2>3. Refund Eligibility</h2>
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg my-6">
                    <p className="font-bold text-emerald-900 mt-0">Our Commitment</p>
                    <p className="text-emerald-800 mb-0">
                        We believe in fairness. If you are unsatisfied with GymMitra within the first 7 days of a paid subscription, we will process a full refund — no questions asked.
                    </p>
                </div>

                <h3>3.1 Eligible for Refund</h3>
                <ul>
                    <li>
                        <strong>Within 7 days of payment:</strong> Full refund if you are not satisfied with the platform. Simply email us at <strong>support@emitra.dev</strong> with your registered email and reason for cancellation.
                    </li>
                    <li>
                        <strong>Platform downtime exceeding 72 hours:</strong> If GymMitra experiences continuous unplanned downtime exceeding 72 hours due to a fault on our end, you may request a proportional refund for the affected period.
                    </li>
                    <li>
                        <strong>Duplicate payment:</strong> If you are accidentally charged twice for the same subscription period, the duplicate amount will be refunded in full.
                    </li>
                </ul>

                <h3>3.2 Not Eligible for Refund</h3>
                <ul>
                    <li>After 7 days from the date of payment</li>
                    <li>If your account was suspended due to policy violations</li>
                    <li>For any third-party services or integrations not managed by eMitra Technologies</li>
                    <li>If you simply forgot to cancel before the renewal date (we send reminders via email and WhatsApp before renewal)</li>
                </ul>

                <h2>4. Cancellation</h2>
                <p>You may cancel your paid subscription at any time by contacting us at <strong>support@emitra.dev</strong> or via WhatsApp.</p>
                <ul>
                    <li>Your access will continue until the end of your current billing period</li>
                    <li>No further payments will be charged after cancellation</li>
                    <li>Your data will be retained for <strong>30 days</strong> after the subscription ends, after which it will be permanently deleted unless you request otherwise</li>
                </ul>

                <h2>5. How Refunds Are Processed</h2>
                <ul>
                    <li>Refunds are processed within <strong>5–7 business days</strong> of approval</li>
                    <li>Refunds will be credited to the original payment method (UPI, bank transfer, etc.)</li>
                    <li>You will receive a confirmation email once the refund has been initiated</li>
                </ul>

                <h2>6. Contact Us</h2>
                <p>For any refund or cancellation requests, reach us at:</p>
                <ul>
                    <li><strong>Email:</strong> support@emitra.dev</li>
                    <li><strong>WhatsApp:</strong> +91 62618 54014 (business hours)</li>
                    <li><strong>Operated by:</strong> eMitra Technologies, Indore, Madhya Pradesh, India</li>
                </ul>

                <hr className="my-8" />
                <div className="flex justify-center gap-6">
                    <Link href="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium no-underline hover:underline">
                        Terms & Conditions
                    </Link>
                    <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium no-underline hover:underline">
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </div>
    )
}
