import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { InvoiceView } from "@/components/invoice/InvoiceView"
import { UpiPayButton } from "@/components/invoice/UpiPayButton"
import { Metadata } from 'next'
import { apiLimiter } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

interface PublicInvoicePageProps {
    params: Promise<{
        slug: string
        token: string
    }>
}

// 64-char hex strings expected
// 64-char hex strings expected, but allow slight variance
const MIN_TOKEN_LENGTH = 32

/**
 * Dynamic metadata for public invoice sharing
 */
export async function generateMetadata({ params }: PublicInvoicePageProps): Promise<Metadata> {
    const { slug, token } = await params

    // Quick validation before DB hit
    if (!token || token.length < MIN_TOKEN_LENGTH) {
        return { title: 'Invalid Invoice | GymMitra' }
    }

    const invoice = await prisma.invoice.findFirst({
        where: {
            shareToken: token,
            gym: { slug }, // Strict branding check
            OR: [
                { shareTokenExpiresAt: null },
                { shareTokenExpiresAt: { gt: new Date() } }
            ]
        },
        select: {
            invoiceNumber: true,
            gym: { select: { businessName: true } }
        }
    })

    if (!invoice) return { title: 'Invoice Not Found or Expired | GymMitra' }

    return {
        title: `Invoice ${invoice.invoiceNumber} - ${invoice.gym?.businessName || 'GymMitra'}`,
        description: `View your secure invoice from ${invoice.gym?.businessName || 'your gym'}. Managed by GymMitra.`,
    }
}

export default async function PublicInvoicePage({ params }: PublicInvoicePageProps) {
    const { slug, token } = await params

    // 1. Basic token validation
    if (!token || token.length < MIN_TOKEN_LENGTH) {
        notFound()
    }

    // 2. IP-based Rate Limiting (10 requests per minute) to prevent enumeration
    const headersList = await headers()
    const ipHeader = headersList.get('x-forwarded-for')
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'
    try {
        await apiLimiter.check(10, `invoice-view:${ip}`)
    } catch {
        // Return 429 logic or just drop the connection via notFound if scraping
        notFound()
    }

    // 3. Strict Expiry Check in DB Query
    const dbInvoice = await prisma.invoice.findFirst({
        where: {
            shareToken: token,
            gym: { slug }, // Strict branding check
            OR: [
                { shareTokenExpiresAt: null }, // Legacy invoices without expiry
                { shareTokenExpiresAt: { gt: new Date() } } // New invoices with valid expiry
            ]
        },
        include: {
            gym: true,
            member: {
                select: { name: true } // Only name — no phone/email/address on public links
            },
            items: true
        }
    })

    if (!dbInvoice) {
        notFound()
    }

    // Strip sensitive gym fields before passing to client component
    const safeGym = dbInvoice.gym ? {
        businessName: dbInvoice.gym.businessName,
        slug: dbInvoice.gym.slug,
        logoUrl: dbInvoice.gym.logoUrl,
        logo: dbInvoice.gym.logo,
        address: dbInvoice.gym.address,
        phone: dbInvoice.gym.phone,
        email: dbInvoice.gym.email,
        upiId: dbInvoice.gym.upiId,
    } : null

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
                            Secure Invoice from {safeGym?.businessName || 'Merchant'}
                        </p>
                        <p className="text-xs text-slate-500">Verified by GymMitra</p>
                    </div>
                </div>

                {/* Invoice Container */}
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                    <InvoiceView invoice={{
                        ...dbInvoice,
                        gym: safeGym,
                        subtotal: Number(dbInvoice.subtotal),
                        taxAmount: Number(dbInvoice.taxAmount),
                        discount: Number(dbInvoice.discount),
                        total: Number(dbInvoice.total),
                        amountPaid: Number((dbInvoice as any).amountPaid || 0),
                        balanceDue: Number((dbInvoice as any).balanceDue || 0),
                        items: dbInvoice.items.map(item => ({
                            ...item,
                            unitPrice: Number(item.unitPrice),
                            amount: Number(item.amount)
                        }))
                    } as any} />
                </div>

                {/* Footer */}
                <div className="max-w-4xl mx-auto mt-8 text-center">
                    <p className="text-sm text-slate-400 font-medium">
                        Managed with <span className="text-slate-900 font-bold">GymMitra</span> - #1 Gym ERP
                    </p>
                    <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest font-bold">Secure Public Link</p>
                </div>
            </div>
        </div>
    )
}
