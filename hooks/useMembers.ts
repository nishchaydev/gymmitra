'use client'

import { useQuery } from '@tanstack/react-query'
import { SHOWCASE_MEMBERS } from '@/lib/showcase-data'

interface MembersParams {
    q?: string
    status?: string
    dobMonth?: string
    birthday?: string
    page?: number
    take?: number
    duration?: string
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
    if (params.birthday) searchParams.set('birthday', params.birthday)
    if (params.page !== undefined) searchParams.set('page', String(params.page))
    if (params.take !== undefined) searchParams.set('take', String(params.take))
    if (params.duration) searchParams.set('duration', params.duration)

    const res = await fetch(`/api/members?${searchParams.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch members')
    return res.json()
}

export function useMembers(params: MembersParams & { slug?: string; initialData?: MembersResponse }) {
    const isDemo = params.slug === 'demo'

    return useQuery<MembersResponse>({
        queryKey: ['members', params],
        queryFn: async () => {
            if (isDemo) {
                return {
                    members: SHOWCASE_MEMBERS,
                    totalCount: SHOWCASE_MEMBERS.length,
                    page: 1,
                    hasMore: false,
                }
            }
            return fetchMembers(params)
        },
        staleTime: isDemo ? Infinity : 2 * 60_000,
        gcTime: 10 * 60_000,
        initialData: params.initialData,
    })
}
