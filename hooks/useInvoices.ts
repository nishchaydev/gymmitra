import { useQuery } from '@tanstack/react-query'

interface UseInvoicesOptions {
    q?: string
    status?: string
    page?: number
    take?: number
    memberId?: string
}

export function useInvoices(options: UseInvoicesOptions = {}) {
    return useQuery({
        queryKey: ['invoices', options],
        queryFn: async () => {
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
    })
}
