'use client'

import { useQuery } from '@tanstack/react-query'

interface MembersParams {
    q?: string
    status?: string
    dobMonth?: string
    page?: number
    take?: number
}

interface MembersResponse {
    members: any[]
    totalCount: number
    page: number
    hasMore: boolean
}

async function fetchMembers(params: MembersParams): Promise<MembersResponse> {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.set('q', params.q)
    if (params.status) searchParams.set('status', params.status)
    if (params.dobMonth) searchParams.set('dobMonth', params.dobMonth)
    if (params.page !== undefined) searchParams.set('page', String(params.page))
    if (params.take !== undefined) searchParams.set('take', String(params.take))

    const res = await fetch(`/api/members?${searchParams.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch members')
    return res.json()
}

export function useMembers(params: MembersParams) {
    return useQuery({
        queryKey: ['members', params],
        queryFn: () => fetchMembers(params),
        staleTime: 30_000,  // 30 seconds — prevents tab-switch refetch
        gcTime: 5 * 60_000, // 5 minutes
    })
}
