import { useQuery } from '@tanstack/react-query'

interface AtRiskMember {
    id: string
    name: string
    phone: string
    lastVisit: string | null
    daysInactive: number
}

interface AtRiskData {
    count: number
    members: AtRiskMember[]
    daysThreshold: number
}

export function useAtRiskQuery(days: number = 14, options?: { enabled?: boolean }) {
    return useQuery<AtRiskData>({
        queryKey: ['at-risk', days],
        enabled: options?.enabled,
        queryFn: async () => {
            const res = await fetch(`/api/members/at-risk?days=${days}`)
            if (!res.ok) throw new Error('Failed to fetch at-risk members')
            return res.json()
        },
        staleTime: 300_000, // 5 minutes
        gcTime: 600_000, // 10 minutes
        refetchOnWindowFocus: false,
    })
}
