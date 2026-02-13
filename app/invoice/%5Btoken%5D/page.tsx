import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { InvoiceView } from "@/components/invoice/InvoiceView"

export const dynamic = 'force-dynamic'

interface PublicInvoicePageProps {
    params: Promise<{
        token: string
    }>
}

export default async function PublicInvoicePage({ params }: PublicInvoicePageProps) {
    const { token } = await params

    // No auth required - public access via random token
    const dbInvoice = await (prisma.invoice as any).findUnique({
        where: { shareToken: token },
        select: {
            id: true,
            invoiceNumber: true,
            type: true,
            paymentStatus: true,
            paymentMethod: true,
            subtotal: true,
            discount: true,
            total: true,
            notes: true,
            issueDate: true,
            dueDate: true,
            createdAt: true,
            gym: {
                select: {
                    businessName: true,
                    address: true,
                    city: true,
                    state: true,
                    pincode: true,
                    phone: true,
                    email: true,
                    upiId: true,
                }
            },
            member: {
                select: {
                    name: true,
                    phone: true,
                    email: true,
                }
            },
            items: {
                select: {
                    id: true,
                    description: true,
                    quantity: true,
                    unitPrice: true,
                    amount: true,
                }
            }
        }
    })

    if (!dbInvoice) {
        notFound()
    }

    // Map to Invoice object for InvoiceView
    const invoice = {
        ...(dbInvoice as any),
        // Add any necessary computed fields or renaming for InvoiceView
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="container mx-auto px-4">
                {/* Verification banner */}
                <div className="max-w-4xl mx-auto mb-6 bg-white border border-primary/20 rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        GM
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">Secure Invoice from {(dbInvoice.gym as any).businessName}</p>
                        <p className="text-xs text-slate-500">Verified by Gym Mitra</p>
                    </div>
                </div>

                {/* Invoice */}
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                    <InvoiceView invoice={invoice as any} />
                </div>

                {/* Footer */}
                <div className="max-w-4xl mx-auto mt-8 text-center">
                    <p className="text-sm text-slate-400 font-medium">
                        Managed with <span className="text-slate-900 font-bold">Gym Mitra</span> - #1 Gym ERP
                    </p>
                    <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest font-bold">Secure Public Link</p>
                </div>
            </div>
        </div>
    )
}
