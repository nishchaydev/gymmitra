'use client'

import { useDashboardQuery } from '@/hooks/use-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Overview } from '@/components/dashboard/Overview'
import { RevenueSnapshot } from '@/components/dashboard/RevenueSnapshot'
import { AtRiskMembers } from '@/components/dashboard/AtRiskMembers'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const AttendanceWidget = dynamic(() => import('@/components/dashboard/AttendanceWidget').then(mod => mod.AttendanceWidget), {
    loading: () => <Skeleton className="w-full h-[150px] rounded-xl" />,
    ssr: false
})

const UpcomingBirthdays = dynamic(() => import('@/components/dashboard/UpcomingBirthdays').then(mod => mod.UpcomingBirthdays), {
    loading: () => <Skeleton className="w-full h-[200px] rounded-xl" />,
    ssr: false
})

const RecentInvoices = dynamic(() => import('@/components/dashboard/RecentInvoices').then(mod => mod.RecentInvoices), {
    loading: () => <Skeleton className="w-full h-[350px] rounded-xl" />,
    ssr: false
})

import { OutstandingBalances } from '@/components/dashboard/OutstandingBalances'
import { DailyBriefing } from '@/components/dashboard/DailyBriefing'

import { Button } from '@/components/ui/button'
import { IndianRupee, Users, ShoppingBag, CalendarCheck, UserPlus, ReceiptText, Loader2, TrendingUp } from 'lucide-react'
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
        outstandingInvoices: any[]
        urgentCount: number
        birthdayCount: number
        followUps?: any[]
        partialPayments?: any[]
        lowStockItems?: any[]
        expiringSubscriptions?: any[]
        totalExpenses?: number
    }
}

export function DashboardOverview({ slug, gymName, isDemo, initialData }: DashboardOverviewProps) {
    const { data, isFetching, isLoading } = useDashboardQuery(
        isDemo ? undefined : initialData
    )

    const d = (!isDemo && data) ? data : initialData

    // Computations
    const totalRev = Number(d.revenueRaw || 0)
    const totalExp = Number(d.totalExpenses || 0)
    const netIncome = totalRev - totalExp
    const expenseRatio = totalRev > 0 ? (totalExp / totalRev) * 100 : 0

    return (
        <div className="space-y-6 relative">
            {isFetching && !isLoading && (
                <div className="absolute -top-2 right-0 z-10">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Stat Cards - 2x2 on mobile for better density */}
            <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-drift-200 border-l-4 border-l-primary bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-drift-400 uppercase tracking-widest">
                            Total Revenue
                        </CardTitle>
                        <div className="bg-primary-50 rounded-lg p-2.5">
                            <IndianRupee className="h-5 w-5 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="text-3xl font-black tracking-tight text-slate-900">₹{d.revenue}</div>
                            {!isDemo && (
                                <div className="flex items-center gap-1.5 bg-emerald-50 w-fit px-2 py-0.5 rounded-full mt-2 border border-emerald-100">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">LIVE</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-drift-200 border-l-4 border-l-indigo-500 bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-drift-400 uppercase tracking-widest">
                            Active Members
                        </CardTitle>
                        <div className="bg-indigo-50 rounded-lg p-2.5">
                            <Users className="h-5 w-5 text-indigo-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="text-3xl font-black tracking-tight text-slate-900">{d.activeMembers}</div>
                            <p className="text-xs text-drift-400 mt-2 font-medium">
                                {d.totalMembers} TOTAL · {d.totalMembers > 0 ? Math.round((d.activeMembers / d.totalMembers) * 100) : 0}% ACTIVE
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-drift-200 border-l-4 border-l-emerald-500 bg-white shadow-sm lg:order-3 xl:order-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-drift-400 uppercase tracking-widest">
                            Net Income
                        </CardTitle>
                        <div className="bg-emerald-50 rounded-lg p-2.5">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="text-3xl font-black tracking-tight text-slate-900">
                                ₹{netIncome.toLocaleString('en-IN')}
                            </div>
                            <p className="text-xs text-drift-400 mt-2 font-medium uppercase tracking-tight">
                                {expenseRatio.toFixed(1)}% EXPENSE RATIO (₹{totalExp.toLocaleString('en-IN')})
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-drift-200 border-l-4 border-l-rose-500 bg-white shadow-sm lg:order-4 xl:order-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-drift-400 uppercase tracking-widest">
                            Product Sales
                        </CardTitle>
                        <div className="bg-rose-50 rounded-lg p-2.5">
                            <ShoppingBag className="h-5 w-5 text-rose-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="text-3xl font-black tracking-tight text-slate-900">{d.productSalesCount}</div>
                            <p className="text-xs text-drift-400 mt-2 font-medium uppercase tracking-tight">
                                ALL-TIME ITEMS
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-drift-200 border-l-4 border-l-amber-500 bg-white shadow-sm lg:order-5 xl:order-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-drift-400 uppercase tracking-widest">
                            Today&apos;s Attendance
                        </CardTitle>
                        <div className="bg-amber-50 rounded-lg p-2.5">
                            <CalendarCheck className="h-5 w-5 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="text-3xl font-black tracking-tight text-slate-900">{d.dailyCheckins}</div>
                            {!isDemo && (
                                <div className="flex items-center gap-1.5 bg-amber-50 w-fit px-2 py-0.5 rounded-full mt-2 border border-amber-100">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">REAL-TIME</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dashboard Content - Masonry style to prevent vertical overlap anomalies */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
                {/* Left Column */}
                <div className="lg:col-span-8 flex flex-col space-y-6">
                    <DailyBriefing
                        slug={slug}
                        ownerName={gymName?.split(' ')[0] || 'Owner'}
                        urgentRenewals={d.expiringSubscriptions?.filter((sub: any) => sub.daysLeft <= 1).map((sub: any) => ({
                            id: sub.id,
                            name: sub.member?.name || 'Unknown',
                            planName: sub.plan?.name || 'Plan',
                            daysLeft: sub.daysLeft
                        })) || []}
                        followUps={d.followUps || []}
                        partialPayments={d.partialPayments?.map((p: any) => ({
                            id: p.id,
                            memberName: p.member?.name || 'Unknown',
                            amountDue: Number(p.balanceDue),
                            invoiceNumber: p.invoiceNumber
                        })) || []}
                        overdueInvoices={d.outstandingInvoices?.map((i: any) => ({
                            id: i.id,
                            name: i.member?.name || 'Unknown',
                            amount: Number(i.total)
                        })) || []}
                        lowStockItems={d.lowStockItems || []}
                    />
                    <RevenueSnapshot
                        revenue={d.revenue}
                        revenueChange={d.revenueChange}
                        pendingRevenue={d.pendingRevenue}
                        monthlyRevenueData={d.monthlyRevenueData}
                        isDemo={isDemo}
                    />
                    <div className="overflow-hidden rounded-xl">
                        <RecentInvoices
                            isDemo={isDemo}
                            data={d.recentInvoices}
                            slug={slug}
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 flex flex-col space-y-6">
                    <Card className="border-drift-200 shadow-sm rounded-xl bg-white overflow-hidden">
                        <CardHeader className="border-l-4 border-l-primary pl-4 py-4 bg-primary-50/20">
                            <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
                            <CardDescription className="text-xs text-primary-700/70 font-medium tracking-tight">Most frequent operations</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 pt-4">
                            <Link href={`/${slug}/members/new`} className="w-full">
                                <Button className="w-full justify-start h-14 text-sm font-bold bg-drift-50 border-drift-200 text-slate-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary group transition-all duration-150 rounded-xl" variant="outline">
                                    <UserPlus className="mr-3 h-5 w-5 text-primary" /> <span className="flex-1">Add New Member</span>
                                </Button>
                            </Link>
                            <Link href={`/${slug}/products/new`} className="w-full">
                                <Button className="w-full justify-start h-14 text-sm font-bold bg-drift-50 border-drift-200 text-slate-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary group transition-all duration-150 rounded-xl" variant="outline">
                                    <ShoppingBag className="mr-3 h-5 w-5 text-primary" /> <span className="flex-1">Add Inventory</span>
                                </Button>
                            </Link>
                            <Button className="w-full justify-start h-14 text-sm font-medium bg-drift-50/50 border-drift-100 text-drift-400 cursor-not-allowed rounded-xl" variant="outline" disabled>
                                <ReceiptText className="mr-3 h-5 w-5 opacity-40" /> Generate Report
                            </Button>
                        </CardContent>
                    </Card>

                    <OutstandingBalances
                        data={d.outstandingInvoices}
                        gymName={gymName || 'your gym'}
                        slug={slug}
                    />

                    <AtRiskMembers
                        slug={slug}
                        gymName={gymName}
                        isDemo={isDemo}
                    />
                    <AttendanceWidget
                        isDemo={isDemo}
                        data={d.todayAttendance}
                        slug={slug}
                    />

                    <UpcomingBirthdays
                        isDemo={isDemo}
                        gymName={gymName}
                        data={d.upcomingBirthdays}
                    />
                </div>
            </div>
        </div>
    )
}
