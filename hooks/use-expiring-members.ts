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
            const res = await fetch('/api/dashboard/expiring-members')
            if (!res.ok) throw new Error('Failed to fetch expiring members')
            return res.json()
        },
        staleTime: 300_000, // 5 minutes
    })
}
