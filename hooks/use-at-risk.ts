import { useQuery } from '@tanstack/react-query'
import { SHOWCASE_AT_RISK } from '@/lib/showcase-data'

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

export function useAtRiskQuery(days: number = 14, options?: { enabled?: boolean; slug?: string }) {
    const isDemo = options?.slug === 'demo'

    return useQuery<AtRiskData>({
        queryKey: ['at-risk', days, options?.slug],
        enabled: options?.enabled,
        queryFn: async () => {
            if (isDemo) {
                return {
                    count: SHOWCASE_AT_RISK.length,
                    members: SHOWCASE_AT_RISK as any[],
                    daysThreshold: days
                }
            }
            const res = await fetch(`/api/members/at-risk?days=${days}`)
            if (!res.ok) throw new Error('Failed to fetch at-risk members')
            return res.json()
        },
        staleTime: isDemo ? Infinity : 300_000, // 5 minutes
        gcTime: 600_000, // 10 minutes
        refetchOnWindowFocus: false,
    })
}
