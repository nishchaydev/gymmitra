import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import NewInvoiceForm from "./NewInvoiceForm"
import { redirect } from "next/navigation"

export default async function NewInvoicePage() {
    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())

    if (!auth) redirect("/login")

    const gymId = auth.gym.id

    const members = await prisma.member.findMany({ where: { gymId: gymId }, orderBy: { name: 'asc' } })
    const dbMembershipPlans = await prisma.membershipPlan.findMany({ where: { gymId: gymId, isActive: true }, orderBy: { name: 'asc' } })
    const dbProducts = await prisma.product.findMany({ where: { gymId: gymId }, orderBy: { name: 'asc' } })

    // Convert Decimals to numbers for client components
    const membershipPlans = dbMembershipPlans.map(p => ({ ...p, price: Number(p.price) }))
    const products = dbProducts.map(p => ({ 
        ...p, 
        price: Number(p.price),
        purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : null
    }))

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
                taxEnabled={(auth.gym as any).taxEnabled ?? true}
                defaultTaxPercentage={Number((auth.gym as any).taxPercentage ?? 18)}
            />
        </div>
    )
}
