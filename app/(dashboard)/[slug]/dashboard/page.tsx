import * as React from "react"
import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Analytics } from "@/components/dashboard/Analytics"
import { Reports } from "@/components/dashboard/Reports"
import { RetentionMetrics } from "@/components/dashboard/RetentionMetrics"
import { DashboardOverview } from "@/components/dashboard/DashboardOverview"
import { RenewalCommandCenter } from "@/components/renewals/RenewalCommandCenter"
import { AtRiskMembers } from "@/components/dashboard/AtRiskMembers"
import { OutstandingBalances } from "@/components/dashboard/OutstandingBalances"
import { UpcomingBirthdays } from "@/components/dashboard/UpcomingBirthdays"
import { Button } from "@/components/ui/button"
import { UserPlus, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { startOfToday, endOfToday, startOfMonth, subMonths, endOfMonth, startOfDay, subDays, format, eachMonthOfInterval, addDays, isEqual } from "date-fns"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SHOWCASE_STATS, MOCKUP_DATA } from "@/lib/showcase-data"
import { cookies } from "next/headers"
import { exitDemo } from "./actions"
import { getWhatsAppLink, templates } from "@/lib/whatsapp"
import { isBirthdayToday } from "@/lib/utils"

interface DashboardSummary {
    gym_id: string
    active_members: bigint
    total_members: bigint
    monthly_revenue: number
    pending_revenue: number
    last_month_revenue: number
    today_checkins: bigint
    urgent_renewals: bigint
    product_sales: bigint
}


export const revalidate = 60

export const metadata: Metadata = {
    title: "GymMitra Dashboard",
    description: "Manage your gym with ease.",
}

function DashboardGreeting({ ownerName, urgentCount, birthdayCount, gymName, slug }: { ownerName: string, urgentCount: number, birthdayCount: number, gymName: string, slug: string }) {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning'
        : hour < 17 ? 'Good afternoon' : 'Good evening'

    return (
        <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">{gymName}</h2>
            <p className="text-slate-500 mt-1 font-medium flex flex-wrap items-center gap-1.5 text-sm md:text-base">
                <span>{greeting}, {ownerName}.</span>
                {urgentCount > 0 && (
                    <Link href={`/${slug}/dashboard?tab=reports`} className="inline-flex items-center gap-1 cursor-pointer group">
                        <span className="text-rose-600 font-bold justify-center items-center bg-rose-100 dark:bg-rose-900/30 px-2.5 py-1 rounded-md text-xs md:text-sm shadow-sm hover:shadow transition-all group-hover:bg-rose-200 dark:group-hover:bg-rose-900/50">
                            🚨 {urgentCount} renewals need attention.
                        </span>
                    </Link>
                )}
                {birthdayCount > 0 && (
                    <Link href={`/${slug}/members?birthday=today`} className="inline-flex items-center gap-1 cursor-pointer group">
                        <span className="text-amber-600 font-bold justify-center items-center bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-md text-xs md:text-sm shadow-sm hover:shadow transition-all group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50">
                            🎂 {birthdayCount} {birthdayCount === 1 ? 'birthday' : 'birthdays'} today!
                        </span>
                    </Link>
                )}
            </p>
        </div>
    )
}

export default async function DashboardPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { slug } = await params
    const resolvedSearchParams = await searchParams
    const searchParamTab = Array.isArray(resolvedSearchParams?.tab) ? resolvedSearchParams.tab[0] : resolvedSearchParams?.tab
    const rawTab = searchParamTab?.toString().toLowerCase() || "overview"
    const allowedTabs = ["overview", "analytics", "insights", "reports"]
    const tab = allowedTabs.includes(rawTab) ? rawTab : "overview"
    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())
    const cookieStore = await cookies()
    const envDemoEnabled = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true'
    const isDemo = envDemoEnabled && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!auth && !isDemo) {
        redirect("/login")
    }

    let gym = null
    let dbError = false
    try {
        if (isDemo) {
            gym = { id: "demo-gym", name: "GymMitra Showcase", isVerified: true }
        } else if (auth) {
            gym = auth.gym
        }
    } catch (error) {
        console.error("Failed to load gym profile:", error)
        dbError = true
    }

    if (dbError) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error Loading Profile</CardTitle>
                        <CardDescription>We&apos;re experiencing temporary database issues.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We could not load your profile at this time. Please check back in a few minutes.</p>
                        <Link href={`/${slug}/dashboard`} className="w-full">
                            <Button className="w-full">Reload Dashboard</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!isDemo && gym && gym.slug !== slug) {
        redirect("/login")
    }

    if (!isDemo && gym && !gym.isVerified) {
        redirect("/onboarding")
    }

    if (!gym && !isDemo) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Welcome to GymMitra Showcase!</CardTitle>
                        <CardDescription>We&apos;re finishing setting up your profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>It looks like your gym profile wasn&apos;t created yet, or we&apos;re having trouble loading it.</p>
                        <Link href="/onboarding">
                            <Button className="w-full">Initialize Gym Profile</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Data fetching logic - Centralized for performance (Anti-Waterfall)
    let dashboardData;
    let recentInvoices: any[] = []
    let todayAttendance = { count: 0, recentInitials: [] as string[], lastCheckinLabel: "No check-ins today" }
    let upcomingBirthdays: any[] = []
    let monthlyRevenueData: { name: string; total: number }[] = []

    if (isDemo) {
        dashboardData = {
            totalMembers: SHOWCASE_STATS.totalMembers,
            activeMembers: SHOWCASE_STATS.activeMembers,
            revenue: SHOWCASE_STATS.totalRevenue.toLocaleString('en-IN'),
            revenueRaw: SHOWCASE_STATS.totalRevenue,
            productSalesCount: SHOWCASE_STATS.productSales,
            dailyCheckins: 12,
            urgentCount: 3,
            birthdayCount: 1,
        }
        recentInvoices = SHOWCASE_STATS.recentInvoices.map((inv, idx) => ({
            ...inv,
            id: `demo-${inv.id}`,
            invoiceNumber: `DEMO-INV-${String(idx + 1).padStart(4, '0')}`,
            total: inv.amount,
            paymentStatus: inv.status,
            createdAt: new Date(inv.date)
        }))
        upcomingBirthdays = (MOCKUP_DATA as any).birthdays
        monthlyRevenueData = SHOWCASE_STATS.overviewData
    } else {
        const today = startOfToday()
        const startOfThisMonth = startOfMonth(today)
        const startOfLastMonth = startOfMonth(subMonths(today, 1))
        const endOfLastMonth = endOfMonth(subMonths(today, 1))
        const startDate5Months = startOfMonth(subMonths(today, 5))
        const thirtyDaysAgo = startOfDay(subDays(today, 30))
        const lastWeekStart = startOfDay(subDays(today, 6))

                // Direct Prisma queries - replaces broken mv_dashboard_summary
        const [
            _activeMembers,
            _totalMembers,
            _monthlyRevenueAgg,
            _pendingRevenueAgg,
            _lastMonthRevenueAgg,
            _todayCheckinsCount,
            _urgentRenewalsCount,
            _productSalesCount,
        ] = await Promise.all([
            prisma.member.count({ where: { gymId: gym!.id, status: 'ACTIVE' } }).catch(() => 0),
            prisma.member.count({ where: { gymId: gym!.id } }).catch(() => 0),
            prisma.invoice.aggregate({ where: { gymId: gym!.id, paymentStatus: 'PAID', createdAt: { gte: startOfThisMonth }, deletedAt: null }, _sum: { total: true } }).catch(() => ({ _sum: { total: null } })),
            prisma.invoice.aggregate({ where: { gymId: gym!.id, paymentStatus: { in: ['PENDING', 'PARTIAL'] }, deletedAt: null }, _sum: { total: true } }).catch(() => ({ _sum: { total: null } })),
            prisma.invoice.aggregate({ where: { gymId: gym!.id, paymentStatus: 'PAID', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, deletedAt: null }, _sum: { total: true } }).catch(() => ({ _sum: { total: null } })),
            prisma.attendance.count({ where: { gymId: gym!.id, date: { gte: today, lte: endOfToday() } } }).catch(() => 0),
            prisma.memberSubscription.count({ where: { gymId: gym!.id, status: 'ACTIVE', endDate: { gte: today, lte: addDays(today, 7) } } }).catch(() => 0),
            prisma.invoice.count({ where: { gymId: gym!.id, type: 'PRODUCT' as any, createdAt: { gte: startOfThisMonth }, deletedAt: null } }).catch(() => 0),
        ])

        const summary: DashboardSummary = {
            gym_id: gym!.id,
            active_members: BigInt(_activeMembers),
            total_members: BigInt(_totalMembers),
            monthly_revenue: Number(_monthlyRevenueAgg._sum?.total || 0),
            pending_revenue: Number(_pendingRevenueAgg._sum?.total || 0),
            last_month_revenue: Number(_lastMonthRevenueAgg._sum?.total || 0),
            today_checkins: BigInt(_todayCheckinsCount),
            urgent_renewals: BigInt(_urgentRenewalsCount),
            product_sales: BigInt(_productSalesCount),
        }

        const [
            invoices,
            attendance,
            birthdays,
            monthlyRevenue,
            churnResult,
            retentionResult,
            frequencyResult,
            expiringSubscriptions,
            followUpsToday,
            partialInvoices,
            lowStockProducts,
            remindersResult,
            outstandingInvoicesResult,
            memberGrowthRaw,
            attendanceRaw,
            birthdayDataRaw,
            totalExpensesResult,
            membersBeforeWindow,
        ] = await Promise.all([
            prisma.invoice.findMany({
                where: { gymId: gym!.id } as any,
                include: { member: { select: { name: true } } } as any,
                orderBy: { createdAt: 'desc' } as any,
                take: 5
            }).catch(() => []),
            prisma.attendance.findMany({
                where: { gymId: gym!.id, date: { gte: today, lte: endOfToday() } } as any,
                include: { member: { select: { name: true } } },
                orderBy: { checkInTime: 'desc' },
                take: 3,
            }).catch(() => []),
            prisma.member.findMany({
                where: { gymId: gym!.id, status: 'ACTIVE' },
                select: { name: true, phone: true, dateOfBirth: true },
                take: 50,
            }).catch(() => []),
            (prisma.$queryRaw`
                SELECT
                    EXTRACT(MONTH FROM "createdAt")::int AS month,
                    COALESCE(SUM("total"), 0) AS total
                FROM "Invoice"
                WHERE "gymId" = ${gym!.id}
                    AND "paymentStatus" = 'PAID'
                    AND EXTRACT(YEAR FROM "createdAt") = EXTRACT(YEAR FROM NOW())
                    AND "deletedAt" IS NULL
                GROUP BY month
                ORDER BY month
            ` as Promise<{ month: number; total: any }[]>).catch(() => []),

            // Churn Raw Query
            (prisma.$queryRaw`
                WITH MonthlyActive AS (
                    SELECT 
                        date_trunc('month', "createdAt") as create_month,
                        COUNT(*) as count
                    FROM "Member"
                    WHERE "gymId" = ${gym!.id} AND status NOT IN ('INACTIVE', 'EXPIRED')
                    GROUP BY 1
                )
                SELECT 
                    to_char(date_trunc('month', m."updatedAt"), 'YYYY-MM-DD') as month,
                    COUNT(m.id)::bigint as churned,
                    (SELECT COALESCE(SUM(count), 0)::bigint FROM MonthlyActive WHERE create_month <= date_trunc('month', m."updatedAt") + interval '1 month') as total_active
                FROM "Member" m
                WHERE m."gymId" = ${gym!.id}
                    AND m.status IN ('INACTIVE', 'EXPIRED')
                    AND m."updatedAt" >= ${startDate5Months}
                GROUP BY date_trunc('month', m."updatedAt")
                ORDER BY month ASC
            ` as Promise<{ month: string; churned: bigint; total_active: bigint }[]>).catch(() => []),
            // Retention Raw Query
            (prisma.$queryRaw`
                SELECT 
                    to_char(date_trunc('month', "endDate"), 'YYYY-MM-DD') as month,
                    SUM(CASE WHEN "status" = 'ACTIVE' THEN 1 ELSE 0 END)::bigint as renewed,
                    SUM(CASE WHEN "status" = 'EXPIRED' THEN 1 ELSE 0 END)::bigint as expired
                FROM "MemberSubscription"
                WHERE "gymId" = ${gym!.id}
                  AND "endDate" >= ${startDate5Months}
                  AND "endDate" <= ${today}
                GROUP BY 1
                ORDER BY 1 ASC
            ` as Promise<{ month: string; renewed: bigint; expired: bigint }[]>).catch(() => []),
            // Member Frequency
            (prisma.$queryRaw`
                SELECT 
                    m.id as member_id,
                    m.name as member_name,
                    m.phone,
                    COUNT(a.id)::bigint as visit_count,
                    MAX(a.date) as last_visit
                FROM "Member" m
                LEFT JOIN "Attendance" a ON m.id = a."memberId" AND a.date >= ${thirtyDaysAgo}
                WHERE m."gymId" = ${gym!.id}
                  AND m.status = 'ACTIVE'
                GROUP BY m.id
                ORDER BY visit_count DESC, last_visit DESC NULLS FIRST
                LIMIT 50
            ` as Promise<{ member_id: string; member_name: string; phone: string; visit_count: bigint; last_visit: string | null }[]>).catch(() => []),
            // Expiring Soon
            prisma.memberSubscription.findMany({
                where: {
                    gymId: gym!.id,
                    endDate: { gte: today, lte: addDays(today, 7) },
                    status: 'ACTIVE'
                },
                select: {
                    id: true,
                    endDate: true,
                    status: true,
                    member: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            photo: true
                        }
                    },
                    plan: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: { endDate: 'asc' }
            }).catch(() => []),
            // Daily briefing queries
            prisma.lead.findMany({
                where: {
                    gymId: gym!.id,
                    followUpDate: { gte: today, lte: endOfToday() },
                    status: { notIn: ['CONVERTED', 'NOT_INTERESTED'] }
                },
                select: { id: true, name: true, phone: true, planInterest: true }
            }).catch(() => []),
            prisma.invoice.findMany({
                where: {
                    gymId: gym!.id,
                    paymentStatus: 'PARTIAL',
                    deletedAt: null
                },
                select: { id: true, invoiceNumber: true, balanceDue: true, member: { select: { name: true } } }
            }).catch(() => []),
            prisma.product.findMany({
                where: {
                    gymId: gym!.id,
                    stock: { lte: 5 }
                },
                select: { id: true, name: true, stock: true, category: true }
            }).catch(() => []),
            // End daily briefing queries
            Promise.all([
                prisma.member.findMany({
                    where: { gymId: gym!.id, status: 'ACTIVE' },
                    select: { id: true, name: true, phone: true, dateOfBirth: true }
                }).catch(() => []),
                prisma.invoice.findMany({
                    where: { gymId: gym!.id, paymentStatus: 'OVERDUE', memberId: { not: null } },
                    select: { id: true, invoiceNumber: true, total: true, member: { select: { name: true, phone: true } } }
                }).catch(() => [])
            ]).catch(() => [[], []]),
            prisma.invoice.findMany({
                where: {
                    gymId: gym!.id,
                    paymentStatus: { in: ['PARTIAL', 'PENDING'] },
                    deletedAt: null
                },
                include: { member: { select: { name: true, phone: true } } },
                orderBy: { issueDate: 'asc' },
                take: 5
            }).catch(() => []),

            // REAL Member Growth query
            (prisma.$queryRaw`
                SELECT 
                    to_char(date_trunc('month', "createdAt"), 'YYYY-MM-DD') as month,
                    COUNT(*)::bigint as count
                FROM "Member"
                WHERE "gymId" = ${gym!.id}
                  AND "createdAt" >= ${startDate5Months}
                  AND "name" NOT ILIKE '%Seed%'
                  AND "name" NOT ILIKE '%Demo%'
                GROUP BY 1
                ORDER BY 1 ASC
            ` as Promise<{ month: string; count: bigint }[]>).catch(() => []),
            // SEGMENTED Attendance query
            (prisma.$queryRaw`
                SELECT
                    to_char(date_trunc('day', "checkInTime"), 'YYYY-MM-DD') as day,
                    COUNT(CASE WHEN EXTRACT(HOUR FROM "checkInTime") < 12 THEN 1 END)::bigint as morning,
                    COUNT(CASE WHEN EXTRACT(HOUR FROM "checkInTime") >= 12 THEN 1 END)::bigint as evening
                FROM "Attendance"
                WHERE "gymId" = ${gym!.id}
                  AND "checkInTime" >= ${lastWeekStart}
                  AND "checkInTime" <= ${endOfToday()}
                GROUP BY 1
                ORDER BY 1 ASC
            ` as Promise<{ day: string; morning: bigint; evening: bigint }[]>).catch(() => []),
            prisma.member.findMany({
                where: { gymId: gym!.id, status: 'ACTIVE' },
                select: { dateOfBirth: true }
            }).catch(() => []),
            // Safely fetch expenses if model exists
            (async () => {
                const model = (prisma as any).expense
                if (model && typeof model.aggregate === 'function') {
                    try {
                        return await model.aggregate({
                            where: { gymId: gym!.id, date: { gte: startOfThisMonth } },
                            _sum: { amount: true }
                        })
                    } catch (e) {
                        return { _sum: { amount: null } }
                    }
                }
                return { _sum: { amount: null } }
            })(),
            prisma.member.count({
                where: {
                    gymId: gym!.id,
                    createdAt: { lt: startDate5Months },
                    NOT: [
                        { name: { contains: 'Seed', mode: 'insensitive' as any } },
                        { name: { contains: 'Demo', mode: 'insensitive' as any } }
                    ]
                } as any
            }).catch(() => 0)
        ])

         const birthdayCount = (birthdayDataRaw as any[]).filter((m: any) => isBirthdayToday(m.dateOfBirth)).length

        // Process REAL Member Growth data
        const growthMap = new Map<string, number>()
        memberGrowthRaw.forEach(row => {
            growthMap.set(row.month, Number(row.count || 0))
        })
        const growthData = []
        // membersBeforeWindow comes from prisma.member.count earlier in the Promise.all
        // totalMembers is also fetched, maybe we need to double check how membersBeforeWindow is assigned.
        // It's assigned from the result of the Promise.all at the end.
        let cumulative = Number(membersBeforeWindow || 0)
        for (let i = 5; i >= 0; i--) {
            const date = startOfMonth(subMonths(today, i))
            const key = format(date, 'yyyy-MM-01')
            const count = growthMap.get(key) || 0
            cumulative += count
            growthData.push({
                name: format(date, 'MMM'),
                members: cumulative
            })
        }

        // Process SEGMENTED Attendance data
        const attMap = new Map<string, { morning: number; evening: number }>()
        attendanceRaw.forEach(row => {
            attMap.set(row.day, { morning: Number(row.morning || 0), evening: Number(row.evening || 0) })
        })
        const weeklyAttendanceData = []
        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i)
            const key = format(date, 'yyyy-MM-dd')
            const vals = attMap.get(key) || { morning: 0, evening: 0 }
            weeklyAttendanceData.push({
                name: format(date, 'EEE'),
                fullDate: key,
                morning: vals.morning,
                evening: vals.evening,
                total: vals.morning + vals.evening
            })
        }

        const thisMonthRev = Number(summary.monthly_revenue);
        const lastMonthRev = Number(summary.last_month_revenue);
        const pendingRev = Number(summary.pending_revenue);

        let revChange = 0;
        if (lastMonthRev > 0) {
            revChange = ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100;
        } else if (lastMonthRev === 0 && thisMonthRev > 0) {
            revChange = 100;
        }

        dashboardData = {
            totalMembers: Number(summary.total_members),
            activeMembers: Number(summary.active_members),
            revenue: thisMonthRev.toLocaleString('en-IN'),
            revenueRaw: thisMonthRev,
            lastMonthRevenue: lastMonthRev,
            revenueChange: Number(revChange.toFixed(2)),
            pendingRevenue: pendingRev,
            productSalesCount: Number(summary.product_sales),
            dailyCheckins: Number(summary.today_checkins),
            // Pass the rest of the results
            churnData: churnResult,
            retentionData: retentionResult,
            frequencyData: frequencyResult,
            expiringSubscriptions,
            remindersRaw: remindersResult,
            weeklyAttendance: weeklyAttendanceData,
            growthData: growthData,
            outstandingInvoices: JSON.parse(JSON.stringify(outstandingInvoicesResult || [])),
            urgentCount: Number(summary.urgent_renewals),
            birthdayCount: birthdayCount,
            followUps: JSON.parse(JSON.stringify(followUpsToday || [])),
            partialPayments: JSON.parse(JSON.stringify(partialInvoices || [])),
            lowStockItems: JSON.parse(JSON.stringify(lowStockProducts || [])),
            totalExpenses: Number(totalExpensesResult?._sum?.amount || 0),
        }
        recentInvoices = invoices as any[]

        // Process Attendance
        if (attendance.length > 0) {
            const last = attendance[0]
            const checkIn = new Date((last as any).checkInTime)
            const now = new Date().getTime()
            const minutesAgo = Math.max(0, Math.round((now - checkIn.getTime()) / 60000))
            todayAttendance = {
                count: Number(summary.today_checkins),
                lastCheckinLabel: minutesAgo < 60
                    ? `Last check-in ${minutesAgo} min${minutesAgo !== 1 ? 's' : ''} ago`
                    : `Last check-in ${Math.round(minutesAgo / 60)}h ago`,
                recentInitials: attendance.map((a: any) =>
                    a.member?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? '?'
                )
            }
        }

         // Process Birthdays
         upcomingBirthdays = birthdays
             .filter((m: any) => {
                 // Validate DOB before processing
                 if (!m.dateOfBirth) return false;
                 const dob = new Date(m.dateOfBirth);
                 // Check if date is valid (not Invalid Date)
                 return !isNaN(dob.getTime());
             })
             .map((m: any) => {
                 const dobString = typeof m.dateOfBirth === 'string' ? m.dateOfBirth : m.dateOfBirth.toISOString();
                 const [year, month, day] = dobString.split('T')[0].split('-').map(Number);
                 const dob = new Date(year, month - 1, day);
                 const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
                 if (next < today) next.setFullYear(today.getFullYear() + 1)
                 const diffDays = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                 const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                 const label = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${dob.getDate()} ${monthNames[dob.getMonth()]}`
                 return { ...m, date: label, diffDays }
             })
             .sort((a: any, b: any) => a.diffDays - b.diffDays)
             .slice(0, 5)

        // Process monthly revenue for chart
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        if (monthlyRevenue && Array.isArray(monthlyRevenue) && monthlyRevenue.length > 0) {
            const revenueMap = new Map<number, number>()
            for (const row of monthlyRevenue) {
                // Ensure row.month and row.total are handled as numbers
                const m = Number(row.month)
                const t = Number(row.total?.toString() || row.total || 0)
                if (!isNaN(m)) {
                    revenueMap.set(m, t)
                }
            }
            // Get current month (1-12)
            const currentMonth = new Date().getMonth() + 1
            // Find the first month with data
            let firstMonthWithData = null
            for (let m = 1; m <= 12; m++) {
                if (revenueMap.has(m)) {
                    firstMonthWithData = m
                    break
                }
            }
            if (firstMonthWithData !== null) {
                // Generate data from firstMonthWithData to currentMonth (inclusive)
                // Fill in zeros for months without data
                monthlyRevenueData = []
                for (let m = firstMonthWithData; m <= currentMonth; m++) {
                    monthlyRevenueData.push({
                        name: monthNames[m - 1],
                        total: revenueMap.get(m) || 0
                    })
                }
            } else {
                // No data in any month, set empty array so hasRevenueData will be false
                monthlyRevenueData = []
            }
        } else {
            // No revenue data at all
            monthlyRevenueData = []
        }
    }


    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            {isDemo && (
                <div className="bg-[#1a365d] border-b border-[#4FC3F7]/20 text-white px-4 py-3 text-xs sm:text-sm font-medium shadow-sm mb-6 -mx-4 md:-mx-8 -mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 relative z-10">
                    <div className="flex items-center gap-2 text-[#4FC3F7]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4FC3F7] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4FC3F7]"></span>
                        </span>
                        <span>Running in <span className="font-bold text-white uppercase tracking-tight">Showcase Mode</span> with demo data. Real database is bypassed.</span>
                    </div>
                    <form action={exitDemo}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs bg-[#4FC3F7] text-[#1a365d] hover:bg-white border-0 font-bold px-4 transition-colors">
                            Exit Demo
                        </Button>
                    </form>
                </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <DashboardGreeting
                    gymName={gym?.name || "Your Gym"}
                    ownerName={gym?.ownerName || "Owner"}
                    urgentCount={dashboardData.urgentCount}
                    birthdayCount={dashboardData.birthdayCount}
                    slug={slug}
                />
                <div className="flex items-center space-x-2">
                    <Link href={`/${slug}/members/new`}>
                        <Button className="bg-primary hover:bg-primary-600 shadow-md w-full md:w-auto">
                            <UserPlus className="mr-2 h-4 w-4" /> Add Member
                        </Button>
                    </Link>
                    <Link href={`/${slug}/products/new`}>
                        <Button variant="secondary" className="shadow-sm w-full md:w-auto">
                            <ShoppingBag className="mr-2 h-4 w-4" /> New Product
                        </Button>
                    </Link>
                </div>
            </div>
            <Tabs defaultValue={tab} key={tab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="reports">Reports (Renewals)</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6" forceMount={true}>
                    <React.Suspense fallback={<div className="h-96 w-full flex items-center justify-center animate-pulse bg-gray-50 dark:bg-[#1e293b] rounded-xl"><span className="text-gray-500">Loading Overview...</span></div>}>
                        <DashboardOverview
                            slug={slug}
                            gymName={(gym as any)?.businessName || gym?.name || "GymMitra Showcase"}
                            isDemo={isDemo}
                            initialData={{
                                totalMembers: dashboardData.totalMembers,
                                activeMembers: dashboardData.activeMembers,
                                revenue: dashboardData.revenue,
                                revenueRaw: dashboardData.revenueRaw,
                                lastMonthRevenue: (dashboardData as any).lastMonthRevenue || 0,
                                revenueChange: (dashboardData as any).revenueChange || 0,
                                pendingRevenue: (dashboardData as any).pendingRevenue || 0,
                                productSalesCount: dashboardData.productSalesCount,
                                dailyCheckins: dashboardData.dailyCheckins,
                                recentInvoices: JSON.parse(JSON.stringify(recentInvoices)),
                                todayAttendance,
                                upcomingBirthdays: JSON.parse(JSON.stringify(upcomingBirthdays)),
                                monthlyRevenueData,
                                outstandingInvoices: JSON.parse(JSON.stringify(dashboardData.outstandingInvoices || [])),
                                urgentCount: dashboardData.urgentCount,
                                birthdayCount: dashboardData.birthdayCount,
                                totalExpenses: (dashboardData as any).totalExpenses || 0,
                            }}
                        />
                    </React.Suspense>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4" forceMount={true}>
                    <React.Suspense fallback={<div className="h-96 w-full flex items-center justify-center animate-pulse bg-gray-50 dark:bg-[#1e293b] rounded-xl"><span className="text-gray-500">Loading Analytics...</span></div>}>
                        <Analytics
                            isDemo={isDemo}
                            initialData={isDemo ? undefined : {
                                isEstimated: false,
                                memberGrowth: dashboardData.growthData || [],
                                attendance: dashboardData.weeklyAttendance || []
                            }}
                        />
                    </React.Suspense>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4" forceMount={true}>
                    <React.Suspense fallback={<div className="h-96 w-full flex items-center justify-center animate-pulse bg-gray-50 dark:bg-[#1e293b] rounded-xl"><span className="text-gray-500">Loading Insights...</span></div>}>
                        <RetentionMetrics
                            isDemo={isDemo}
                            initialData={isDemo ? undefined : {
                                churnData: dashboardData.churnData?.map((row: any) => {
                                    const monthName = row.month ? format(new Date(row.month), 'MMM') : '???'
                                    const churned = Number(row.churned || 0)
                                    const totalActive = Number(row.total_active || 0)
                                    return {
                                        name: monthName,
                                        churnRate: totalActive > 0 ? Math.min(100, Math.round((churned / totalActive) * 100)) : null
                                    }
                                }) || [],
                                retentionRate: dashboardData.retentionData?.length ? (() => {
                                    const last = dashboardData.retentionData[dashboardData.retentionData.length - 1]
                                    const renewed = Number(last.renewed || 0)
                                    const expired = Number(last.expired || 0)
                                    return (renewed + expired) > 0 ? Math.round((renewed / (renewed + expired)) * 100) : 100
                                })() : 0,
                                atRiskMembers: dashboardData.frequencyData?.filter((m: any) => Number(m.visit_count || 0) < 4).map((m: any) => ({
                                    memberId: m.member_id,
                                    memberName: m.member_name,
                                    phone: m.phone,
                                    visitCount: Number(m.visit_count || 0),
                                    lastVisit: m.last_visit ? format(new Date(m.last_visit), 'yyyy-MM-dd') : null
                                })) || []
                            }}
                        />
                    </React.Suspense>
                </TabsContent>

                <TabsContent value="reports" className="space-y-6" forceMount={true}>
                    <React.Suspense fallback={<div className="h-96 w-full flex items-center justify-center animate-pulse bg-gray-50 dark:bg-[#1e293b] rounded-xl"><span className="text-gray-500">Loading Reports...</span></div>}>
                      <div className="relative premium-bg rounded-3xl p-1 space-y-6">
                        {/* Decorative background blobs */}
                        <div className="absolute top-0 -left-4 w-48 h-48 bg-primary/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob pointer-events-none" />
                        <div className="absolute top-0 -right-4 w-48 h-48 bg-ocean/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 pointer-events-none" />
                        <div className="absolute -bottom-8 left-20 w-48 h-48 bg-midnight/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 pointer-events-none" />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-[1]">
                            <RenewalCommandCenter gymName={gym?.name || ''} isDemo={isDemo} waRenewalMsg={gym?.waRenewalMsg} />
                            <AtRiskMembers slug={slug} gymName={gym?.name || ''} isDemo={isDemo} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-[1]">
                            <OutstandingBalances data={dashboardData.outstandingInvoices} gymName={gym?.name || ''} slug={slug} waOverdueMsg={gym?.waOverdueMsg} />
                            <UpcomingBirthdays data={upcomingBirthdays} gymName={gym?.name || ''} />
                        </div>
                        <div className="relative z-[1]">
                        <Reports
                            isDemo={isDemo}
                            gymName={gym?.name || "GymMitra"}
                            initialData={isDemo ? undefined : {
                                revenue: monthlyRevenueData,
                                attendance: dashboardData.weeklyAttendance || [],
                                expiring: dashboardData.expiringSubscriptions?.map((sub: any) => {
                                    const diff = new Date(sub.endDate).getTime() - new Date().getTime();
                                    return { ...sub, daysLeft: Math.max(0, Math.ceil(diff / (1000 * 3600 * 24))) };
                                }) || [],
                                reminders: {
                                    reminders: (() => {
                                        if (!dashboardData.remindersRaw) {
                                            return { birthdays: [], overdue: [], inactive: [], expiring: [] }
                                        }

                                        const today = new Date()

                                        const birthdays = dashboardData.remindersRaw[0]?.filter((m: any) => isBirthdayToday(m.dateOfBirth)) || []

                                        const overdueInvoices = dashboardData.remindersRaw[1] || []

                                        const fourteenDaysAgo = subDays(startOfDay(today), 14)
                                        const inactiveMembers = dashboardData.frequencyData?.filter((m: any) => {
                                            return !m.last_visit || new Date(m.last_visit) < fourteenDaysAgo
                                        }) || []

                                        const overdue = overdueInvoices.map((inv: any) => {
                                            const msg = templates.paymentOverdue(inv.member?.name || 'Unknown', Number(inv.total), gym?.name || 'GymMitra', gym?.waOverdueMsg || undefined)
                                            return {
                                                type: 'OVERDUE',
                                                invoiceId: inv.id,
                                                name: inv.member?.name || 'Unknown',
                                                amount: Number(inv.total),
                                                message: msg,
                                                link: inv.member?.phone ? getWhatsAppLink(inv.member?.phone, msg) : null
                                            }
                                        })

                                        const expiring = dashboardData.expiringSubscriptions?.map((sub: any) => {
                                            const diffTime = new Date(sub.endDate).getTime() - today.getTime();
                                            const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 3600 * 24)));
                                            const msg = templates.renewalReminder(sub.member?.name || 'Unknown', daysLeft, gym?.name || 'GymMitra', gym?.waRenewalMsg || undefined)
                                            return {
                                                type: 'EXPIRING',
                                                subId: sub.id,
                                                name: sub.member?.name || 'Unknown',
                                                daysLeft,
                                                message: msg,
                                                link: sub.member?.phone ? getWhatsAppLink(sub.member?.phone, msg) : null
                                            }
                                        }) || []

                                        return {
                                            birthdays: birthdays.map((m: any) => ({
                                                type: 'BIRTHDAY',
                                                memberId: m.id,
                                                name: m.name,
                                                link: m.phone ? getWhatsAppLink(m.phone, templates.birthdayWish(m.name, gym?.name || 'GymMitra')) : null
                                            })),
                                            overdue: overdue,
                                            inactive: inactiveMembers.map((m: any) => {
                                                const daysSince = m.last_visit ? Math.floor((today.getTime() - new Date(m.last_visit).getTime()) / (1000 * 3600 * 24)) : 30
                                                return {
                                                    type: 'INACTIVE',
                                                    memberId: m.member_id,
                                                    name: m.member_name,
                                                    daysInactive: daysSince,
                                                    link: m.phone ? getWhatsAppLink(m.phone, templates.inactivityNudge(m.member_name, daysSince, gym?.name || 'GymMitra')) : null
                                                }
                                            }),
                                            expiring: expiring
                                        }
                                    })()
                                }
                            }}
                        />
                        </div>
                      </div>
                    </React.Suspense>
                </TabsContent>
            </Tabs>

        </div >
    )
}
