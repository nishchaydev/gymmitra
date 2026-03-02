import { useQuery } from '@tanstack/react-query'

export interface RenewalMember {
    id: string
    memberId: string
    memberName: string
    phone: string
    planName: string
    endDate: string
    daysOffset: number
}

interface RenewalsData {
    urgent: RenewalMember[]
    upcoming: RenewalMember[]
    missed: RenewalMember[]
    summary: {
        urgentCount: number
        upcomingCount: number
        missedCount: number
    }
}

export function useRenewalsQuery() {
    return useQuery<RenewalsData>({
        queryKey: ['renewals-dashboard'],
        queryFn: async () => {
            const res = await fetch('/api/renewals')
            if (!res.ok) throw new Error('Failed to fetch renewals data')
            return res.json()
        },
        staleTime: 300_000, // 5 minutes
        gcTime: 600_000, // 10 minutes
        refetchOnWindowFocus: false,
    })
}
