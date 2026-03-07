'use client'

import { useQuery } from '@tanstack/react-query'

interface DashboardData {
    totalMembers: number
    activeMembers: number
    revenue: string
    revenueRaw: number
    lastMonthRevenue: number
    revenueChange: number
    pendingRevenue: number
    productSalesCount: number
    dailyCheckins: number
    recentInvoices: any[]
    todayAttendance: {
        count: number
        recentInitials: string[]
        lastCheckinLabel: string
    }
    upcomingBirthdays: {
        name: string
        phone?: string
        date: string
        img?: string
        diffDays?: number
    }[]
    monthlyRevenueData: { name: string; total: number }[]
    outstandingInvoices: any[]
}

export function useDashboardQuery(initialData?: DashboardData) {
    return useQuery<DashboardData>({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard')
            if (!res.ok) throw new Error('Failed to fetch dashboard data')
            return res.json()
        },
        staleTime: 300_000, // 5 minutes
        gcTime: 600_000, // 10 minutes
        refetchOnWindowFocus: false, // Avoid refetching when switching back to tab
        initialData,
    })
}
