'use client'

import { useQuery } from '@tanstack/react-query'

interface Product {
    id: string
    name: string
    category: string
    price: number
    stock: number
    lowStockAlert: number
    isActive: boolean
    image: string | null
    description: string | null
}

interface UseProductsOptions {
    q?: string
    category?: string
    lowStock?: string
}

export function useProductsQuery(options: UseProductsOptions = {}, initialData?: Product[]) {
    const params = new URLSearchParams()
    if (options.q) params.set('q', options.q)
    if (options.category) params.set('category', options.category)
    if (options.lowStock) params.set('lowStock', options.lowStock)

    const queryString = params.toString()

    return useQuery<Product[]>({
        queryKey: ['products', queryString],
        queryFn: async () => {
            const res = await fetch(`/api/products${queryString ? `?${queryString}` : ''}`)
            if (!res.ok) throw new Error('Failed to fetch products')
            return res.json()
        },
        staleTime: 30_000,
        gcTime: 300_000,
        initialData,
    })
}
