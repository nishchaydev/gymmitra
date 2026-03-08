import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { PosSelection } from '@/components/pos/PosSelection'

export default async function PosPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const auth = await getAuthGym()
    if (!auth) redirect('/login')

    const products = await prisma.product.findMany({
        where: { gymId: auth.gym.id, isActive: true, stock: { gt: 0 } },
        orderBy: { name: 'asc' }
    })

    const members = await prisma.member.findMany({
        where: { gymId: auth.gym.id, status: 'ACTIVE' },
        select: { id: true, name: true, phone: true },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6 flex flex-col h-[calc(100vh-100px)]">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                        <ShoppingBag className="h-8 w-8 text-primary" />
                        Point of Sale
                    </h1>
                    <p className="text-drift-400 font-medium italic uppercase tracking-tighter text-xs">Sell products and merchandise instantly</p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <PosSelection
                    slug={slug}
                    products={JSON.parse(JSON.stringify(products))}
                    members={members}
                />
            </div>
        </div>
    )
}
