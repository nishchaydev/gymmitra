import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { InvoiceView } from "@/components/invoice/InvoiceView"
import { redirect, notFound } from "next/navigation"
import { SHOWCASE_STATS, SHOWCASE_INVOICES } from "@/lib/showcase-data"
import { cookies } from "next/headers"
import { getIsDemo } from "@/lib/demo"

export default async function InvoiceDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
    const { slug, id } = await params
    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())

    const isDemoMode = await getIsDemo(slug)

    if (!auth && !isDemoMode) redirect("/login")

    let invoice: any; // Using any for large combined object, but could be refined

    if (isDemoMode || id.startsWith("demo-")) {
        const cleanId = id.replace("demo-", "")
        const mockInv = SHOWCASE_STATS.recentInvoices.find(inv => inv.id === cleanId) || 
                       SHOWCASE_INVOICES.find(inv => inv.id === cleanId) ||
                       SHOWCASE_INVOICES[0]

        if (!mockInv && !isDemoMode) notFound()

        // Construct a full invoice object for the template
        invoice = {
            id: id,
            invoiceNumber: `GM-INV-${String(SHOWCASE_STATS.recentInvoices.indexOf(mockInv as any) + 1).padStart(4, '0')}`,
            createdAt: new Date((mockInv as any).date),
            paymentStatus: (mockInv as any).status as any,
            paymentMethod: "UPI",
            total: mockInv.amount,
            amountPaid: 0,
            balanceDue: mockInv.amount,
            subtotal: mockInv.amount,
            discount: 0,
            shareToken: "demo-token-123",
            gym: {
                businessName: "GymMitra Showcase",
                address: "Showcase Street, Digital District",
                city: "Cloud City",
                state: "Internet",
                pincode: "101010",
                phone: "9876543210",
                email: "demo@gym-mitra.com",
                upiId: "gym-mitra@upi"
            },
            member: {
                name: mockInv.member.name,
                phone: "9998887776",
                email: `${mockInv.member.name.toLowerCase().replace(/\s+/g, '.')}@example.com`
            },
            walkInName: null,
            walkInPhone: null,
            walkInEmail: null,
            walkInAddress: null,
            items: [
                {
                    id: "item1",
                    description: mockInv.type === "Membership" ? "Monthly Membership - Gold Plan" : "Whey Protein Isolate - 2kg",
                    quantity: 1,
                    unitPrice: mockInv.amount,
                    total: mockInv.amount
                }
            ]
        }
    } else {
        const dbInvoice = await prisma.invoice.findUnique({
            where: { id: id },
            select: {
                id: true,
                invoiceNumber: true,
                type: true,
                paymentStatus: true,
                paymentMethod: true,
                subtotal: true,
                taxAmount: true,
                taxPercentage: true,
                discount: true,
                total: true,
                amountPaid: true,
                balanceDue: true,
                shareToken: true,
                notes: true,
                walkInName: true,
                walkInPhone: true,
                walkInEmail: true,
                walkInAddress: true,
                issueDate: true,
                dueDate: true,
                createdAt: true,
                gym: {
                    select: {
                        id: true,
                        userId: true,
                        slug: true,
                        businessName: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                        phone: true,
                        email: true,
                        upiId: true,
                        termsAndConditions: true,
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

        if (!dbInvoice) notFound()

        const gymData = dbInvoice.gym as any;
        if (!isDemoMode && auth && gymData.id !== auth.gym.id) {
            const actualSlug = slug && slug !== 'dashboard' ? slug : (gymData.slug || '');
            redirect(actualSlug ? `/${actualSlug}/dashboard` : `/dashboard`);
        }

        invoice = {
            ...dbInvoice,
            subtotal: Number(dbInvoice.subtotal),
            taxAmount: Number(dbInvoice.taxAmount || 0),
            taxPercentage: Number(dbInvoice.taxPercentage || 0),
            discount: Number(dbInvoice.discount || 0),
            total: Number(dbInvoice.total),
            amountPaid: Number((dbInvoice as any).amountPaid || 0),
            balanceDue: Number((dbInvoice as any).balanceDue || 0),
            items: dbInvoice.items.map(item => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                amount: Number(item.amount),
            }))
        } as any
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">GymMitra</span>
                    <p className="text-slate-500 mt-1">Review, print or download this invoice.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                <InvoiceView invoice={invoice} />
            </div>
        </div>
    )
}
