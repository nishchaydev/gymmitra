import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, ShieldCheck, ScrollText } from "lucide-react"

export default function ServiceAgreementPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-4 rounded-full">
                            <ScrollText className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Software Service Agreement
                    </h1>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                        Terms and Conditions for use of Gym Mitra ERP Platform
                    </p>
                    <div className="mt-2 text-sm text-gray-400 flex items-center justify-center gap-2">
                        <Building2 className="h-4 w-4" />
                        eMitra Technologies
                    </div>
                </div>

                <Card className="shadow-lg border-t-4 border-t-primary">
                    <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-800/50 pb-6 rounded-t-lg">
                        <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                            <ShieldCheck className="h-5 w-5" />
                            <span>Effective Date: January 1, 2026</span>
                        </div>
                        <CardTitle className="text-2xl">Master Subscription Agreement</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-blue max-w-none dark:prose-invert pt-8 space-y-6 text-gray-600 dark:text-gray-300">
                        <p className="lead text-lg font-medium text-gray-900 dark:text-gray-100">
                            This Master Subscription Agreement (&quot;Agreement&quot;) is entered into by and between eMitra Technologies (&quot;Provider&quot;) and the entity or person placing an order for or accessing the Service (&quot;Customer&quot; or &quot;Gym Owner&quot;).
                        </p>

                        <section aria-labelledby="section-usage">
                            <h2 id="section-usage" className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">1. Use of the Service</h2>
                            <p>
                                <strong>1.1 Provision of Service:</strong> Provider will make the Gym Mitra ERP Software-as-a-Service (SaaS) platform available to the Customer pursuant to this Agreement and the applicable Subscription Plan.
                            </p>
                            <p>
                                <strong>1.2 Customer Responsibilities:</strong> Customer shall (i) be responsible for Users&apos; compliance with this Agreement, (ii) be responsible for the accuracy, quality and legality of Customer Data, and (iii) prevent unauthorized access to or use of the Service.
                            </p>
                        </section>

                        <section aria-labelledby="section-security">
                            <h2 id="section-security" className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">2. Multi-Tenant Data Security & Privacy</h2>
                            <p>
                                <strong>2.1 Data Isolation:</strong> The Service employs strict Row-Level Security (RLS) to ensure that Customer Data (including member details, financial records, and staff information) is strictly isolated and inaccessible to other tenants on the platform.
                            </p>
                            <p>
                                <strong>2.2 Ownership:</strong> Customer retains all right, title and interest in and to all Customer Data. Provider acquires no rights in Customer Data other than the right to host and process it to provide the Service.
                            </p>
                        </section>

                        <section aria-labelledby="section-fees">
                            <h2 id="section-fees" className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">3. Fees and Payment</h2>
                            <p>
                                Customer will pay all fees specified in the Subscription Plan. Except as otherwise specified herein, (i) fees are based on the Service purchased and not actual usage, and (ii) payment obligations are non-cancelable and fees paid are non-refundable.
                            </p>
                        </section>

                        <section aria-labelledby="section-term">
                            <h2 id="section-term" className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">4. Term and Termination</h2>
                            <p>
                                This Agreement commences on the date Customer first accepts it and continues until all subscriptions hereunder have expired or have been terminated. Provider may terminate this Agreement for cause upon 30 days written notice to the Customer of a material breach if such breach remains uncured at the expiration of such period.
                            </p>
                        </section>

                        <section className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-lg mt-10 border border-blue-100 dark:border-blue-900">
                            <h4 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-2">Acceptance of Terms</h4>
                            <p className="text-sm text-blue-800 dark:text-blue-300 m-0">
                                By logging into the Gym Mitra ERP dashboard, creating staff accounts, or adding members to the system, you acknowledge that you have read, understood, and agree to be bound by the terms of this Service Agreement.
                            </p>
                        </section>

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
