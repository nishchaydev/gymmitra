'use client'

import { useDashboardQuery } from '@/hooks/use-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Overview } from '@/components/dashboard/Overview'
import { RevenueSnapshot } from '@/components/dashboard/RevenueSnapshot'
import { AtRiskMembers } from '@/components/dashboard/AtRiskMembers'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const AttendanceWidget = dynamic(() => import('@/components/dashboard/AttendanceWidget').then(mod => mod.AttendanceWidget), {
    loading: () => <Skeleton className="w-full h-[150px] rounded-xl" />
})

const UpcomingBirthdays = dynamic(() => import('@/components/dashboard/UpcomingBirthdays').then(mod => mod.UpcomingBirthdays), {
    loading: () => <Skeleton className="w-full h-[200px] rounded-xl" />
})

const RecentInvoices = dynamic(() => import('@/components/dashboard/RecentInvoices').then(mod => mod.RecentInvoices), {
    loading: () => <Skeleton className="w-full h-[350px] rounded-xl" />
})

import { Button } from '@/components/ui/button'
import { DollarSign, Users, ShoppingBag, CalendarCheck, UserPlus, ReceiptText, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface DashboardOverviewProps {
    slug: string
    gymName?: string
    isDemo: boolean
    initialData: {
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
        todayAttendance: any
        upcomingBirthdays: any[]
        monthlyRevenueData: { name: string; total: number }[]
    }
}

export function DashboardOverview({ slug, gymName, isDemo, initialData }: DashboardOverviewProps) {
    const { data, isFetching, isLoading } = useDashboardQuery(
        isDemo ? undefined : initialData
    )

    const d = (!isDemo && data) ? data : initialData

    return (
        <div className="space-y-6 relative">
            {isFetching && !isLoading && (
                <div className="absolute -top-2 right-0 z-10">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="text-3xl font-bold tracking-tight text-slate-900">₹{d.revenue}</div>
                            {!isDemo && (
                                <div className="text-xs font-bold text-emerald-600 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-emerald-600 mr-1.5 animate-pulse" />
                                    LIVE
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Active Members
                        </CardTitle>
                        <Users className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="text-3xl font-bold tracking-tight text-slate-900">{d.activeMembers}</div>
                            <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">
                                {d.totalMembers} TOTAL · {d.totalMembers > 0 ? Math.round((d.activeMembers / d.totalMembers) * 100) : 0}% ACTIVE
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Product Sales
                        </CardTitle>
                        <ShoppingBag className="h-5 w-5 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="text-3xl font-bold tracking-tight text-slate-900">{d.productSalesCount}</div>
                            <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">
                                ALL-TIME ITEMS
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Today&apos;s Attendance
                        </CardTitle>
                        <CalendarCheck className="h-5 w-5 text-[#4FC3F7]" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="text-3xl font-bold tracking-tight text-slate-900">{d.dailyCheckins}</div>
                            {!isDemo && (
                                <div className="text-xs font-bold text-[#4FC3F7] mt-2 uppercase tracking-widest flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-[#4FC3F7] mr-1.5 animate-bounce" />
                                    REAL-TIME LOG
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts + Widgets */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                <div className="lg:col-span-4 h-full">
                    <RevenueSnapshot
                        revenue={d.revenue}
                        revenueChange={d.revenueChange}
                        pendingRevenue={d.pendingRevenue}
                        monthlyRevenueData={d.monthlyRevenueData}
                        isDemo={isDemo}
                    />
                </div>
                <div className="lg:col-span-3 space-y-6">
                    <AtRiskMembers
                        slug={slug}
                        gymName={gymName}
                        isDemo={isDemo}
                    />
                    <AttendanceWidget
                        isDemo={isDemo}
                        data={d.todayAttendance}
                    />
                    <UpcomingBirthdays
                        isDemo={isDemo}
                        gymName={gymName}
                        data={d.upcomingBirthdays}
                    />
                </div>
            </div>

            {/* Recent Invoices + Quick Actions */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                <div className="lg:col-span-4 overflow-hidden rounded-xl">
                    <RecentInvoices
                        isDemo={isDemo}
                        data={d.recentInvoices}
                    />
                </div>
                <Card className="lg:col-span-3 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                        <CardDescription>Most frequent operations</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                        <Link href={`/${slug}/members/new`} className="w-full">
                            <Button className="w-full justify-start h-12 text-sm font-bold shadow-sm" variant="outline">
                                <UserPlus className="mr-3 h-5 w-5 text-[#4FC3F7]" /> Add New Member
                            </Button>
                        </Link>
                        <Link href={`/${slug}/products/new`} className="w-full">
                            <Button className="w-full justify-start h-12 text-sm font-bold shadow-sm" variant="outline">
                                <ShoppingBag className="mr-3 h-5 w-5 text-[#4FC3F7]" /> Add Inventory
                            </Button>
                        </Link>
                        <Button className="w-full justify-start h-12 text-sm font-bold shadow-sm" variant="outline" disabled>
                            <ReceiptText className="mr-3 h-5 w-5 text-[#4FC3F7]" /> Generate Report
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
