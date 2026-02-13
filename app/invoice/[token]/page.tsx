import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { InvoiceView } from "@/components/invoice/InvoiceView"
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PublicInvoicePageProps {
    params: Promise<{
        token: string
    }>
}

/**
 * Dynamic metadata for public invoice sharing
 */
export async function generateMetadata({ params }: PublicInvoicePageProps): Promise<Metadata> {
    const { token } = await params

    // Quick validation before DB hit
    if (!token || token.length < 10) {
        return { title: 'Invalid Invoice | Gym Mitra' }
    }

    const invoice = await prisma.invoice.findUnique({
        where: { shareToken: token } as any,
        select: {
            invoiceNumber: true,
            gym: { select: { businessName: true } }
        }
    }) as any

    if (!invoice) return { title: 'Invoice Not Found | Gym Mitra' }

    return {
        title: `Invoice ${invoice.invoiceNumber} - ${invoice.gym?.businessName || 'Gym Mitra'}`,
        description: `View your secure invoice from ${invoice.gym?.businessName || 'your gym'}. Managed by Gym Mitra.`,
    }
}

export default async function PublicInvoicePage({ params }: PublicInvoicePageProps) {
    const { token } = await params

    // Basic token validation (CUID or UUID-like length)
    if (!token || token.length < 10) {
        notFound()
    }

    // No auth required - public access via random token
    // Using findFirst instead of findUnique to simplify where clause typing
    const dbInvoice = await prisma.invoice.findFirst({
        where: { shareToken: token } as any,
        include: {
            gym: true,
            member: true,
            items: true
        }
    }) as any

    if (!dbInvoice) {
        notFound()
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
                        <p className="font-semibold text-slate-900">
                            Secure Invoice from {dbInvoice.gym?.businessName || 'Merchant'}
                        </p>
                        <p className="text-xs text-slate-500">Verified by Gym Mitra</p>
                    </div>
                </div>

                {/* Invoice Container */}
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                    <InvoiceView invoice={dbInvoice as any} />
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
