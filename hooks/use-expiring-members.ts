import { useQuery } from '@tanstack/react-query'

interface ExpiringMember {
    id: string
    name: string
    phone: string | null
    endDate: string
    daysLeft: number
    planName: string
}

interface ExpiringData {
    count: number
    members: ExpiringMember[]
}

export function useExpiringMembersQuery(options?: { enabled?: boolean }) {
    return useQuery<ExpiringData>({
        queryKey: ['expiring-members'],
        enabled: options?.enabled,
        queryFn: async () => {
            const res = await fetch('/api/renewals')
            if (!res.ok) throw new Error('Failed to fetch expiring members')
            const data = await res.json()
            
            // Map the renewals data (urgent + upcoming) to ExpiringData format
            const members = [...(data.urgent || []), ...(data.upcoming || [])].map((m: any) => ({
                id: m.memberId,
                name: m.memberName,
                phone: m.phone,
                endDate: m.endDate,
                daysLeft: m.daysOffset,
                planName: m.planName,
            })).sort((a, b) => a.daysLeft - b.daysLeft)

            return {
                count: (data.summary?.urgentCount || 0) + (data.summary?.upcomingCount || 0),
                members
            }
        },
        staleTime: 300_000, // 5 minutes
    })
}
