import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import NewInvoiceForm from "./NewInvoiceForm"
import { redirect } from "next/navigation"

export default async function NewInvoicePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    const gym = await prisma.gymProfile.findUnique({
        where: { userId: user.id }
    })

    if (!gym) redirect("/onboarding")

    const members = await prisma.member.findMany({ where: { gymId: gym.id }, orderBy: { name: 'asc' } })
    const dbMembershipPlans = await prisma.membershipPlan.findMany({ where: { gymId: gym.id, isActive: true }, orderBy: { name: 'asc' } })
    const dbProducts = await prisma.product.findMany({ where: { gymId: gym.id }, orderBy: { name: 'asc' } })

    // Convert Decimals to numbers for client components
    const membershipPlans = dbMembershipPlans.map(p => ({ ...p, price: Number(p.price) }))
    const products = dbProducts.map(p => ({ ...p, price: Number(p.price) }))

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
                    <p className="text-slate-500 mt-1">Generate a professional invoice for memberships or products.</p>
                </div>
            </div>
            <NewInvoiceForm
                members={members}
                membershipPlans={membershipPlans}
                products={products}
            />
        </div>
    )
}
