'use client'

import { useQuery } from '@tanstack/react-query'
import { SHOWCASE_LEADS } from '@/lib/showcase-data'

interface LeadsParams {
    status?: string
    q?: string
    page?: number
    take?: number
}

interface LeadsResponse {
    leads: any[]
    totalCount: number
    page: number
    hasMore: boolean
}

async function fetchLeads(params: LeadsParams): Promise<LeadsResponse> {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.set('q', params.q)
    if (params.status) searchParams.set('status', params.status)
    if (params.page !== undefined) searchParams.set('page', String(params.page))
    if (params.take !== undefined) searchParams.set('take', String(params.take))

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
        const res = await fetch(`/api/leads?${searchParams.toString()}`, {
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!res.ok) {
            let errorData
            try {
                errorData = await res.json()
            } catch (e) {
                errorData = { error: 'Unknown error', details: res.statusText }
            }
            const error = new Error(errorData.error || 'Failed to fetch leads')
                ; (error as any).details = errorData.details
            throw error
        }
        return res.json()
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.')
        }
        throw error
    } finally {
        clearTimeout(timeoutId)
    }
}

export function useLeads(params: LeadsParams & { slug?: string; initialData?: LeadsResponse }) {
    const isDemo = params.slug === 'demo'

    return useQuery<LeadsResponse>({
        queryKey: ['leads', params],
        queryFn: async () => {
            if (isDemo) {
                return {
                    leads: SHOWCASE_LEADS,
                    totalCount: SHOWCASE_LEADS.length,
                    page: 1,
                    hasMore: false,
                }
            }
            return fetchLeads(params)
        },
        staleTime: isDemo ? Infinity : 30_000,
        gcTime: 5 * 60_000,
        initialData: params.initialData,
    })
}
