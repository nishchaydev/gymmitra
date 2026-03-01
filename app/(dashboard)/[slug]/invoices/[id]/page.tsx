import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { InvoiceView } from "@/components/invoice/InvoiceView"
import { redirect, notFound } from "next/navigation"
import { SHOWCASE_STATS } from "@/lib/showcase-data"
import { cookies } from "next/headers"

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const cookieStore = await cookies()
    const isDemoMode = !user && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemoMode) redirect("/login")

    let invoice: any;

    if (id.startsWith("demo-")) {
        const demoId = id.replace("demo-", "")
        const mockInv = SHOWCASE_STATS.recentInvoices.find(inv => inv.id === demoId)

        if (!mockInv) notFound()

        // Construct a full invoice object for the template
        invoice = {
            id: id,
            invoiceNumber: `GM-INV-${String(SHOWCASE_STATS.recentInvoices.indexOf(mockInv) + 1).padStart(4, '0')}`,
            createdAt: new Date(mockInv.date),
            paymentStatus: mockInv.status as any,
            paymentMethod: "UPI",
            total: mockInv.amount,
            subtotal: mockInv.amount,
            discount: 0,
            shareToken: "demo-token-123",
            gym: {
                businessName: "Gym Mitra Showcase",
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
                discount: true,
                total: true,
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
                        userId: true,
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

        if ((dbInvoice as any).gym.userId !== user?.id) {
            redirect("/dashboard")
        }

        invoice = dbInvoice as any
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Invoice Detail</h2>
                    <p className="text-slate-500 mt-1">Review, print or download this invoice.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                <InvoiceView invoice={invoice} />
            </div>
        </div>
    )
}
