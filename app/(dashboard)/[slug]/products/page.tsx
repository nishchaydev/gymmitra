import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { cookies } from 'next/headers'
import { SHOWCASE_PRODUCTS } from '@/lib/showcase-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import { ProductsList } from '@/components/products/ProductsList'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProductsPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ q?: string; category?: string; lowStock?: string }>
}) {
    const { slug } = await params
    const sParams = await searchParams
    const query = sParams.q || ''
    const category = sParams.category
    const showLowStock = sParams.lowStock === 'true'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()

    const isDemo = !user && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    if (user && !isDemo) {
        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })
        if (!gym) return <div className="p-8">Gym profile not found.</div>
        gymId = gym.id
    }

    const whereClause: Prisma.ProductWhereInput = {
        isActive: true,
        gymId: gymId
    }

    if (query) {
        whereClause.name = { contains: query, mode: 'insensitive' }
    }

    if (category && category !== 'ALL') {
        whereClause.category = category as any
    }

    let products = isDemo ? SHOWCASE_PRODUCTS.map((p: any) => ({
        ...p,
        isActive: true,
        lowStockAlert: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        gymId: 'demo',
        price: new Prisma.Decimal(p.price),
        image: null,
        description: null
    })) : await prisma.product.findMany({
        where: whereClause,
        orderBy: { name: 'asc' }
    })

    if (isDemo) {
        if (query) {
            const lowQuery = query.toLowerCase()
            products = products.filter(p => p.name.toLowerCase().includes(lowQuery))
        }
        if (category && category !== 'ALL') {
            products = products.filter(p => p.category === category)
        }
        products.sort((a, b) => a.name.localeCompare(b.name))
    }

    if (showLowStock) {
        products = products.filter(p => p.stock <= p.lowStockAlert)
    }

    return (
        <div className="container mx-auto p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Products & Inventory</h1>
                    <p className="text-muted-foreground">Manage gym merchandise and supplements</p>
                </div>
                <Link href={`/${slug}/products/new`}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        defaultValue={query}
                        className="pl-8 w-full"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Button variant={!category || category === 'ALL' ? 'default' : 'outline'} size="sm">All</Button>
                    <Button variant={category === 'PROTEIN' ? 'default' : 'outline'} size="sm">Protein</Button>
                    <Button variant={category === 'SUPPLEMENT' ? 'default' : 'outline'} size="sm">Supplements</Button>
                    <Button variant={category === 'MERCHANDISE' ? 'default' : 'outline'} size="sm">Merch</Button>
                    {showLowStock ? (
                        <Button variant="destructive" size="sm" className="gap-1">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" className="gap-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                        </Button>
                    )}
                </div>
            </div>

            <ProductsList
                slug={slug}
                query={query}
                category={category}
                lowStock={sParams.lowStock}
                initialData={JSON.parse(JSON.stringify(products))}
            />
        </div>
    )
}
