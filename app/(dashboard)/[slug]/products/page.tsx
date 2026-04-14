import * as React from "react"
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getIsDemo } from '@/lib/demo'
import { SHOWCASE_PRODUCTS } from '@/lib/showcase-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Search, AlertTriangle, Upload, Download } from 'lucide-react'
import { ProductsList } from '@/components/products/ProductsList'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = { title: "Products" };

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

    const isDemo = await getIsDemo(slug)

    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())

    if (!auth && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    if (auth && !isDemo) {
        gymId = auth.gym.id
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

    const productsData = (isDemo ? SHOWCASE_PRODUCTS.map((p: any) => ({
        ...p,
        isActive: true,
        lowStockAlert: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        gymId: 'demo',
        price: Number(p.price || 0),
        image: null,
        description: null
    })) : await prisma.product.findMany({
        where: whereClause,
        orderBy: { name: 'asc' }
    }).catch((err) => {
        console.error('Failed to fetch products:', {
            error: err,
            whereClause,
            gymId
        });
        throw err;
    })).map((p: any) => ({
        ...p,
        price: Number(p.price?.toString() || p.price || 0)
    }))

    let finalProducts = productsData
    if (isDemo) {
        if (query) {
            const lowQuery = query.toLowerCase()
            finalProducts = finalProducts.filter(p => p.name.toLowerCase().includes(lowQuery))
        }
        if (category && category !== 'ALL') {
            finalProducts = finalProducts.filter(p => p.category === category)
        }
        finalProducts.sort((a, b) => a.name.localeCompare(b.name))
    }

    if (showLowStock) {
        finalProducts = finalProducts.filter(p => p.stock <= p.lowStockAlert)
    }

    return (
        <div className="container mx-auto p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Products & Inventory</h1>
                    <p className="text-muted-foreground">Manage gym merchandise and supplements</p>
                </div>
                <div className="flex gap-2">
                    <a href={`/api/reports/download?type=inventory`} download>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                    </a>
                    <Link href={`/${slug}/products/import`}>
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" /> Import
                        </Button>
                    </Link>
                    <Link href={`/${slug}/products/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </Link>
                </div>
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

            <React.Suspense fallback={<div className="h-96 w-full flex items-center justify-center animate-pulse bg-gray-50 dark:bg-[#1e293b] rounded-xl"><span className="text-gray-500 font-medium">Loading Products...</span></div>}>
                <ProductsList
                    slug={slug}
                    query={query}
                    category={category}
                    lowStock={sParams.lowStock}
                    initialData={finalProducts}
                />
            </React.Suspense>
        </div>
    )
}
