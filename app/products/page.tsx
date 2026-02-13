import { prisma } from '@/lib/prisma'
import { Prisma, ProductCategory } from '@prisma/client'
import { cookies } from 'next/headers'
import { SHOWCASE_PRODUCTS } from '@/lib/showcase-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from 'next/link'
import { Plus, Search, AlertTriangle, ShoppingBag } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ...

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; category?: string; lowStock?: string }>
}) {
    const params = await searchParams
    const query = params.q || ''
    const category = params.category
    const showLowStock = params.lowStock === 'true'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()

    // Secure Demo Logic
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
        gymId: gymId // Enforce data isolation
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
        // Always sort by name for demo
        products.sort((a, b) => a.name.localeCompare(b.name))
    }

    // Filter for low stock in memory if requested
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
                <Link href="/products/new">
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

            <Card className="border-slate-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Catalog</CardTitle>
                            <CardDescription>Manage your gym memberships and products.</CardDescription>
                        </div>
                        <div className="text-xs text-slate-400 font-medium sm:hidden block italic font-normal">
                            Scroll horizontally ↔
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-auto p-0 border-0">
                                            <EmptyState
                                                icon={ShoppingBag}
                                                title="No products yet"
                                                description="Add memberships or retail items to start selling."
                                                actionLabel="Add Product"
                                                actionHref="/products/new"
                                                className="border-0 bg-transparent rounded-none"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{product.category}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">₹{Number(product.price).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                {product.stock === null ? (
                                                    <span className="text-slate-400">∞</span>
                                                ) : (
                                                    <span className={cn(
                                                        product.stock < 5 ? "text-red-600 font-bold" : "text-slate-600"
                                                    )}>
                                                        {product.stock}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
