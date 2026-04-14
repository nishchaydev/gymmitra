import { useQuery } from '@tanstack/react-query'
import { SHOWCASE_INVOICES } from '@/lib/showcase-data'

interface UseInvoicesOptions {
    q?: string
    status?: string
    page?: number
    take?: number
    memberId?: string
}

export function useInvoices(options: UseInvoicesOptions & { slug?: string } = {}) {
    const isDemo = options.slug === 'demo'

    return useQuery({
        queryKey: ['invoices', options],
        queryFn: async () => {
            if (isDemo) {
                return {
                    invoices: SHOWCASE_INVOICES,
                    totalCount: SHOWCASE_INVOICES.length,
                    page: 1,
                    hasMore: false,
                }
            }
            const params = new URLSearchParams()
            if (options.q) params.set('q', options.q)
            if (options.status && options.status !== 'ALL') params.set('status', options.status)
            if (options.page !== undefined) params.set('page', options.page.toString())
            if (options.take !== undefined) params.set('take', options.take.toString())
            if (options.memberId) params.set('memberId', options.memberId)

            const response = await fetch(`/api/invoices?${params.toString()}`)
            if (!response.ok) {
                throw new Error('Failed to fetch invoices')
            }
            return response.json()
        },
        staleTime: isDemo ? Infinity : 30_000,
    })
}
