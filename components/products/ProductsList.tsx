'use client'

import { useProductsQuery } from '@/hooks/use-products'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

interface ProductsListProps {
    slug: string
    query: string
    category?: string
    lowStock?: string
    initialData: any[]
}

export function ProductsList({ slug, query, category, lowStock, initialData }: ProductsListProps) {
    const { data: products, isLoading, isFetching, error } = useProductsQuery(
        { q: query || undefined, category: category || undefined, lowStock: lowStock || undefined, slug },
        initialData,
    )

    const items = products || initialData

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-6 text-center text-red-600">
                    <p className="font-medium">Failed to load products.</p>
                    <p className="text-sm mt-1 opacity-80">{error instanceof Error ? error.message : "An unexpected error occurred."}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-slate-200 relative">
            {isFetching && !isLoading && (
                <div className="absolute top-2 right-2 z-10">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Catalog</CardTitle>
                        <CardDescription>Manage your gym memberships and retail items.</CardDescription>
                    </div>
                    <div className="text-xs text-slate-400 font-medium sm:hidden block italic">
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
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right">Margin</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-auto p-0 border-0">
                                        <EmptyState
                                            icon={ShoppingBag}
                                            title="No inventory items."
                                            description="Use the button above to add your first product."
                                            actionLabel="Add Product"
                                            actionHref={`/${slug}/products/new`}
                                            className="border-0 bg-transparent rounded-none"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((product: any) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{product.category}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {product.price != null ? `₹${Number(product.price).toLocaleString()}` : '—'}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs italic">
                                            {product.purchasePrice != null ? `₹${Number(product.purchasePrice).toLocaleString()}` : '—'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-emerald-600">
                                            {(product.price != null && product.purchasePrice != null)
                                                ? `₹${(Number(product.price) - Number(product.purchasePrice)).toLocaleString()}`
                                                : '—'
                                            }
                                        </TableCell>
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
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/${slug}/products/${product.id}`}>Edit</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
