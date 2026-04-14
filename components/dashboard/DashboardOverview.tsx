'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueSnapshot } from '@/components/dashboard/RevenueSnapshot'
import { AtRiskMembers } from '@/components/dashboard/AtRiskMembers'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, useCallback } from 'react'
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
import { IndianRupee, Users, ShoppingBag, CalendarCheck, UserPlus, ReceiptText, Loader2, TrendingUp, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
    const router = useRouter()
    const queryClient = useQueryClient()
    const initialDataRef = useRef(initialData)

    const d = initialData
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Cache-busting refresh: clears Redis for this gym, then triggers Next.js revalidation
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return
        setIsRefreshing(true)
        try {
            await fetch('/api/cache/refresh', { method: 'POST' })
            // Invalidate all React Query cache too
            queryClient.invalidateQueries()
        } catch {
            // fail silently — router.refresh() below still works
        } finally {
            router.refresh()
            // Keep spinner for a moment so user sees feedback
            setTimeout(() => setIsRefreshing(false), 1500)
        }
    }, [isRefreshing, queryClient, router])

    useEffect(() => {
      if (!initialData) return

      // Seed Members default view (no filters, page 1)
      queryClient.setQueryData(
        ['members', { 
          q: '', 
          status: '', 
          dobMonth: '', 
          birthday: '', 
          page: 1, 
          take: 10,
          duration: ''
        }],
        {
          members: [],
          total: initialData.totalMembers,
        }
      )

      // Note: Renewals and invoices are NOT seeded here because initialData
      // doesn't contain the full data shape those hooks expect (e.g. urgent/upcoming/missed
      // arrays + summary object). They will fetch fresh on navigation.

      // Background prefetch other pages
      // Fires 3 seconds after dashboard loads
      // Low priority - browser idle time only
      const prefetchTimer = setTimeout(() => {

        // Prefetch members data
        // staleTime matches Redis TTL (2 min) — if already fetched, this is a no-op
        queryClient.prefetchQuery({
          queryKey: ['members', {
            q: '', status: '', dobMonth: '',
            birthday: '', page: 1, take: 10,
            duration: ''
          }],
          queryFn: () => fetch(`/api/members?page=1&take=10`)
            .then(r => r.json()),
          staleTime: 2 * 60 * 1000, // 2 min — matches Redis MEMBERS_LIST TTL
        })

        // Prefetch renewals
        // staleTime matches Redis TTL (5 min) — RenewalCommandCenter may have already
        // fetched this; if so React Query dedupes and this becomes a zero-cost no-op
        queryClient.prefetchQuery({
          queryKey: ['renewals-dashboard'],
          queryFn: () => fetch(`/api/renewals`)
            .then(r => r.json()),
          staleTime: 5 * 60 * 1000, // 5 min — matches Redis RENEWALS TTL
        })

        // Prefetch invoices
        queryClient.prefetchQuery({
          queryKey: ['invoices', { query: '', status: '', date: '', page: 1, limit: 10 }],
          queryFn: () => fetch(`/api/invoices?page=1&limit=10`)
            .then(r => r.json()),
          staleTime: 2 * 60 * 1000, // 2 min
        })

      }, 3000)

      // CRITICAL: cleanup timer on unmount
      return () => {
        clearTimeout(prefetchTimer)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryClient])

    // Computations
    const totalRev = Number(d.revenueRaw || 0)
    const totalExp = Number(d.totalExpenses || 0)
    const netIncome = totalRev - totalExp
    const expenseRatio = totalRev > 0 ? (totalExp / totalRev) * 100 : 0

    const statCardBase = "group relative overflow-hidden border border-drift-100 bg-white shadow-sm rounded-3xl [@media(hover:hover)]:hover:shadow-md [@media(hover:hover)]:hover:-translate-y-1 active:scale-[0.97] transition-transform duration-200 cursor-pointer"

    return (
        <div className="space-y-8 relative overflow-hidden min-h-screen">
            {/* Clean background */}

             {/* Dashboard Header */}
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
                 <div className="space-y-1">
                     <h1 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
                         Welcome back, <span className="text-primary">{gymName || 'Admin'}</span>
                     </h1>
                     <p className="text-sm font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <TrendingUp className="h-4 w-4 text-primary" />
                         Dashboard Overview • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                         <button
                           onClick={handleRefresh}
                           disabled={isRefreshing}
                           className="text-slate-400 hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10 ml-1 disabled:opacity-50"
                           title="Refresh dashboard (clears cache)"
                         >
                           <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                         </button>
                     </p>
                 </div>
             </header>

            {/* ━━━ ROW 1: Four Stat Cards ━━━ */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 relative z-[1]">
                <Link href={`/${slug}/invoices`} className="block">
                    <div className={statCardBase}>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[10px] font-semibold text-drift-500 uppercase tracking-[0.15em]">
                                Total Revenue
                            </CardTitle>
                            <div className="bg-primary-50 rounded-xl p-2.5 shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 pt-0">
                            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 truncate">₹{d.revenue}</div>
                            {!isDemo && (
                                <div className="flex items-center gap-1.5 bg-emerald-50 w-fit px-2 py-0.5 rounded-full mt-2.5 border border-emerald-100/80">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">LIVE</span>
                                </div>
                            )}
                        </CardContent>
                    </div>
                </Link>

                <Link href={`/${slug}/members`} className="block">
                    <div className={statCardBase}>
                        <div className="absolute inset-0 bg-gradient-to-br from-ocean/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[10px] font-semibold text-drift-500 uppercase tracking-[0.15em]">
                                Active Members
                            </CardTitle>
                            <div className="bg-ocean-50 rounded-xl p-2.5 shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-ocean" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 pt-0">
                            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 truncate">{d.activeMembers}</div>
                            <p className="text-[11px] text-drift-400 mt-2.5 font-semibold tracking-tight">
                                {d.totalMembers} total · {d.totalMembers > 0 ? Math.round((d.activeMembers / d.totalMembers) * 100) : 0}% active
                            </p>
                        </CardContent>
                    </div>
                </Link>

                <Link href={`/${slug}/invoices`} className="block">
                    <div className={statCardBase}>
                        <div className="absolute inset-0 bg-gradient-to-br from-midnight/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[10px] font-semibold text-drift-500 uppercase tracking-[0.15em]">
                                Net Income
                            </CardTitle>
                            <div className="bg-midnight-50 rounded-xl p-2.5 shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-midnight" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 pt-0">
                            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 truncate">
                                ₹{netIncome.toLocaleString('en-IN')}
                            </div>
                            <p className="text-[11px] text-drift-400 mt-2.5 font-semibold tracking-tight">
                                {expenseRatio.toFixed(1)}% expense ratio
                            </p>
                        </CardContent>
                    </div>
                </Link>

                <Link href={`/${slug}/attendance`} className="block">
                    <div className={statCardBase}>
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[10px] font-semibold text-drift-500 uppercase tracking-[0.15em]">
                                Today&apos;s Check-ins
                            </CardTitle>
                            <div className="bg-amber-50 rounded-xl p-2.5 shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 pt-0">
                            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 truncate">{d.dailyCheckins}</div>
                            {!isDemo && (
                                <div className="flex items-center gap-1.5 bg-amber-50 w-fit px-2 py-0.5 rounded-full mt-2.5 border border-amber-100/80">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">REAL-TIME</span>
                                </div>
                            )}
                        </CardContent>
                    </div>
                </Link>
            </div>

            {/* ━━━ ROW 2: Daily Briefing (40%) + Revenue Insights (60%) ━━━ */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-5 items-start relative z-[1]">
                <div className="lg:col-span-2">
                    <DailyBriefing
                        slug={slug}
                        ownerName={gymName?.split(' ')[0] || 'Owner'}
                        urgentRenewals={(d.expiringSubscriptions || []).filter((sub: any) => sub.daysLeft <= 1).map((sub: any) => ({
                            id: sub.id,
                            name: sub.member?.name || 'Unknown',
                            planName: sub.plan?.name || 'Plan',
                            daysLeft: sub.daysLeft
                        }))}
                        followUps={d.followUps || []}
                        partialPayments={(d.partialPayments || []).map((p: any) => ({
                            id: p.id,
                            memberName: p.member?.name || 'Unknown',
                            amountDue: Number(p.balanceDue),
                            invoiceNumber: p.invoiceNumber
                        }))}
                        overdueInvoices={(d.outstandingInvoices || []).map((i: any) => ({
                            id: i.id,
                            name: i.member?.name || 'Unknown',
                            amount: Number(i.total)
                        }))}
                        lowStockItems={d.lowStockItems || []}
                    />
                </div>
                <div className="lg:col-span-3">
                    <RevenueSnapshot
                        revenue={d.revenue}
                        revenueChange={d.revenueChange}
                        pendingRevenue={d.pendingRevenue}
                        monthlyRevenueData={d.monthlyRevenueData}
                        isDemo={isDemo}
                    />
                </div>
            </div>

            {/* ━━━ ROW 3: Recent Invoices (50%) + Quick Actions & Attendance (50%) ━━━ */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 relative z-[1]">
                <div>
                    <RecentInvoices
                        isDemo={isDemo}
                        data={d.recentInvoices}
                        slug={slug}
                    />
                </div>

                <div className="flex flex-col gap-6">
                    {/* Quick Actions */}
                    <Card className="border border-drift-100 bg-white shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="px-5 py-4 bg-gradient-to-r from-primary-50/20 to-transparent border-b border-drift-100/30">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                Quick Actions
                            </CardTitle>
                            <CardDescription className="text-[11px] text-drift-400 font-medium tracking-tight">Most frequent operations</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                            <Link href={`/${slug}/members/new`} className="w-full">
                                <Button className="w-full justify-start h-12 text-sm font-bold bg-white border border-drift-200/80 text-slate-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary group active:scale-[0.97] transition-transform duration-200 rounded-xl shadow-sm" variant="outline">
                                    <UserPlus className="mr-2.5 h-4 w-4 text-primary" /> Add Member
                                </Button>
                            </Link>
                            <Link href={`/${slug}/products/new`} className="w-full">
                                <Button className="w-full justify-start h-12 text-sm font-bold bg-white border border-drift-200/80 text-slate-700 hover:bg-ocean-50 hover:border-ocean-200 hover:text-ocean group active:scale-[0.97] transition-transform duration-200 rounded-xl shadow-sm" variant="outline">
                                    <ShoppingBag className="mr-2.5 h-4 w-4 text-ocean" /> Add Product
                                </Button>
                            </Link>
                            <Button className="w-full justify-start h-12 text-sm font-medium bg-drift-50/50 border border-drift-100 text-drift-400 cursor-not-allowed rounded-xl" variant="outline" disabled>
                                <ReceiptText className="mr-2.5 h-4 w-4 opacity-40" /> Report
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Attendance Widget */}
                    <AttendanceWidget
                        isDemo={isDemo}
                        data={d.todayAttendance}
                        slug={slug}
                    />
                </div>
            </div>

            {/* ━━━ ROW 4: Outstanding Balances + Upcoming Birthdays ━━━ */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 relative z-[1]">
                <div>
                    <OutstandingBalances
                        data={d.outstandingInvoices}
                        gymName={gymName || 'your gym'}
                        slug={slug}
                    />
                </div>
                <div>
                    <UpcomingBirthdays
                        isDemo={isDemo}
                        gymName={gymName}
                        data={d.upcomingBirthdays}
                    />
                </div>
            </div>

            {/* ━━━ ROW 5: At-Risk Members (full width) ━━━ */}
            <div className="relative z-[1]">
                <AtRiskMembers
                    slug={slug}
                    gymName={gymName}
                    isDemo={isDemo}
                />
            </div>
        </div>
    )
}
