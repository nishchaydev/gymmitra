'use client'

import { useQuery } from '@tanstack/react-query'

interface DashboardData {
    totalMembers: number
    activeMembers: number
    revenue: string
    revenueRaw: number
    productSalesCount: number
    dailyCheckins: number
    recentInvoices: any[]
    todayAttendance: {
        count: number
        recentInitials: string[]
        lastCheckinLabel: string
    }
    upcomingBirthdays: any[]
    monthlyRevenueData: { name: string; total: number }[]
}

export function useDashboardQuery(initialData?: DashboardData) {
    return useQuery<DashboardData>({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard')
            if (!res.ok) throw new Error('Failed to fetch dashboard data')
            return res.json()
        },
        staleTime: 30_000,
        gcTime: 300_000,
        initialData,
    })
}
