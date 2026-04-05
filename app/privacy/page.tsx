import React from 'react'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-100 prose prose-slate prose-emerald">
                <h1>Privacy Policy</h1>
                <p className="text-sm text-slate-500 mb-8 italic">
                    Effective Date: March 2026 | Product: GymMitra | Operated by: eMitra Technologies
                </p>

                <p>
                    GymMitra is a B2B SaaS platform. We serve two types of users: (1) Gym Owners / Administrators — businesses that sign up and use GymMitra to manage their operations, and (2) Gym Members — individuals whose data is entered into GymMitra by the gym they attend. This policy applies to both.
                </p>

                <h2>1. Who We Are</h2>
                <p>
                    GymMitra is a gym management software product developed and operated by eMitra Technologies, based in Indore, Madhya Pradesh, India. For any privacy-related queries, contact us at <strong>support@emitra.dev</strong>.
                </p>

                <h2>2. What Data We Collect</h2>
                <h3>2.1 From Gym Owners (Our Direct Customers)</h3>
                <ul>
                    <li>Full name, email address, and phone number of the account owner</li>
                    <li>Gym business name, address, and contact details</li>
                    <li>Login credentials (password stored in encrypted form via Supabase Auth)</li>
                    <li>Usage logs, feature interactions, and platform activity</li>
                </ul>

                <h3>2.2 From or About Gym Members (via Gym Owners)</h3>
                <p>Gym owners enter and manage data about their members on our platform. This data may include:</p>
                <ul>
                    <li>Full name, phone number, and date of birth</li>
                    <li>Membership plan, start date, and expiry date</li>
                    <li>Fee payment status and billing history</li>
                    <li>Attendance records</li>
                    <li>Any additional notes or custom fields entered by the gym</li>
                </ul>
                <p className="font-semibold text-emerald-800 bg-emerald-50 p-4 rounded-lg mt-4">
                    GymMitra does not directly collect data from gym members. The gym owner is responsible for informing their members that their data is being managed on our platform and for obtaining any required consent under applicable law.
                </p>

                <h3>2.3 Technical Data (Automatic)</h3>
                <ul>
                    <li>IP address, browser/device type, and session data</li>
                    <li>Error logs and performance metrics for product improvement</li>
                    <li>Cookies and local storage for session management</li>
                </ul>

                <h2>3. How We Use Your Data</h2>
                <h3>3.1 To Deliver the Service</h3>
                <ul>
                    <li>Create and manage gym owner accounts and their associated workspaces</li>
                    <li>Store and display gym member records, memberships, and attendance</li>
                    <li>Generate invoices, reports, and financial summaries</li>
                    <li>Send password reset and authentication emails via Supabase Auth</li>
                </ul>

                <h3>3.2 To Improve the Product</h3>
                <ul>
                    <li>Analyse usage patterns to identify bugs and improve features</li>
                    <li>Monitor platform performance and uptime</li>
                </ul>

                <h3>3.3 To Communicate</h3>
                <ul>
                    <li>Send transactional emails (account confirmations, password resets)</li>
                    <li>Respond to support requests submitted via WhatsApp or email</li>
                </ul>
                <p>
                    <strong>We do not send marketing emails without explicit opt-in. We do not sell or share your data with third-party advertisers.</strong>
                </p>

                <h2>4. Data Storage and Security</h2>
                <p>Your data is stored on Supabase — a managed cloud database platform — hosted on servers in supported regions. We implement the following security practices:</p>
                <ul>
                    <li>Row-Level Security (RLS) to ensure each gym&apos;s data is isolated from others</li>
                    <li>Encrypted connections (HTTPS/TLS) for all data in transit</li>
                    <li>Password hashing via Supabase Auth (bcrypt)</li>
                    <li>Access controls limiting internal access to data</li>
                </ul>

                <h2>5. Data Retention</h2>
                <p>We retain your data for as long as your account remains active. If you close your account or request deletion:</p>
                <ul>
                    <li>Gym owner account data is deleted within 30 days of a verified deletion request</li>
                    <li>Gym member records associated with your workspace are deleted along with the account</li>
                </ul>
                <p>Backups may retain data for up to 90 days after deletion.</p>

                <h2>6. Data Sharing</h2>
                <p>We do not sell your data. We share data only with the following third-party service providers necessary to operate the platform:</p>
                <ul>
                    <li><strong>Supabase</strong> — database, authentication, and storage</li>
                    <li><strong>Vercel</strong> — hosting and content delivery</li>
                    <li><strong>WhatsApp Business</strong> — for support communication</li>
                </ul>
                <p>All third-party providers are bound by their own data processing terms.</p>

                <h2>7. Your Rights Under the DPDP Act, 2023</h2>
                <p>Under India&apos;s Digital Personal Data Protection Act, 2023, you have the following rights:</p>
                <ul>
                    <li><strong>Right to access</strong> — request a copy of the personal data we hold about you</li>
                    <li><strong>Right to correction</strong> — request correction of inaccurate or incomplete data</li>
                    <li><strong>Right to erasure</strong> — request deletion of your personal data</li>
                    <li><strong>Right to nominate</strong> — nominate another individual to exercise your rights in case of incapacity</li>
                </ul>
                <p>To exercise any of these rights, contact us at support@emitra.dev. <em>Gym members should first contact their gym directly, as the gym owner manages their data within our platform.</em></p>

                <h2>8. Contact</h2>
                <p>For any privacy concerns or data requests, reach us at:</p>
                <ul>
                    <li><strong>Email:</strong> support@emitra.dev</li>
                    <li><strong>WhatsApp:</strong> +91 62618 54014 (business hours)</li>
                    <li><strong>Location:</strong> Indore, Madhya Pradesh, India</li>
                </ul>

                <hr className="my-8" />
                <div className="flex justify-center gap-6">
                    <a href="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium no-underline hover:underline">
                        Terms & Conditions
                    </a>
                    <a href="/refund" className="text-emerald-600 hover:text-emerald-700 font-medium no-underline hover:underline">
                        Refund Policy
                    </a>
                </div>
            </div>
        </div>
    )
}
