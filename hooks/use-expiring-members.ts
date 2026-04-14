import { useQuery } from '@tanstack/react-query'
import { SHOWCASE_MEMBERS } from '@/lib/showcase-data'

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

export function useExpiringMembersQuery(options?: { enabled?: boolean; slug?: string; initialData?: ExpiringData }) {
    const isDemo = options?.slug === 'demo'

    return useQuery<ExpiringData>({
        queryKey: ['expiring-members', options?.slug],
        enabled: options?.enabled,
        queryFn: async () => {
            if (isDemo) {
                const today = new Date()
                const members = SHOWCASE_MEMBERS
                    .filter(m => m.status === 'ACTIVE' && new Date(m.endDate) > today)
                    .map(m => {
                        const daysLeft = Math.ceil((new Date(m.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        return {
                            id: m.id,
                            name: m.name,
                            phone: m.phone,
                            endDate: m.endDate.toISOString(),
                            daysLeft,
                            planName: m.planName
                        }
                    })
                    .sort((a, b) => a.daysLeft - b.daysLeft)

                return {
                    count: members.length,
                    members
                }
            }

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
        staleTime: isDemo ? Infinity : 300_000, // 5 minutes
        initialData: options?.initialData,
    })
}
