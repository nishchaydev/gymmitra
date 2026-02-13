import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { InvoiceView } from "@/components/invoice/InvoiceView"
import { redirect, notFound } from "next/navigation"
import { SHOWCASE_STATS } from "@/lib/showcase-data"
import { cookies } from "next/headers"

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const cookieStore = await cookies()
    const isDemoMode = !user && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemoMode) redirect("/login")

    let invoice;

    if (params.id.startsWith("demo-")) {
        const demoId = params.id.replace("demo-", "")
        const mockInv = SHOWCASE_STATS.recentInvoices.find(inv => inv.id === demoId)

        if (!mockInv) notFound()

        // Construct a full invoice object for the template
        invoice = {
            id: params.id,
            invoiceNumber: `GM-INV-${String(SHOWCASE_STATS.recentInvoices.indexOf(mockInv) + 1).padStart(4, '0')}`,
            createdAt: new Date(mockInv.date),
            paymentStatus: mockInv.status as any,
            paymentMethod: "UPI",
            total: mockInv.amount,
            subtotal: mockInv.amount,
            discount: 0,
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
                email: `${mockInv.member.name.toLowerCase().replace(' ', '.')}@example.com`
            },
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
        invoice = await prisma.invoice.findUnique({
            where: { id: params.id },
            include: {
                gym: true,
                member: true,
                items: true,
            }
        })

        if (!invoice) notFound()

        // Security check: ensure invoice belongs to the gym owned by the user
        if (invoice.gym.userId !== user?.id) {
            redirect("/dashboard")
        }
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
