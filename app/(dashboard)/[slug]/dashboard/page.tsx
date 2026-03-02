import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Analytics } from "@/components/dashboard/Analytics"
import { Reports } from "@/components/dashboard/Reports"
import { RetentionMetrics } from "@/components/dashboard/RetentionMetrics"
import { DashboardOverview } from "@/components/dashboard/DashboardOverview"
import { Button } from "@/components/ui/button"
import { UserPlus, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { startOfToday, endOfToday } from "date-fns"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SHOWCASE_STATS, MOCKUP_DATA } from "@/lib/showcase-data"
import { cookies } from "next/headers"
import { exitDemo } from "./actions"

export const metadata: Metadata = {
    title: "Dashboard | Gym Mitra",
    description: "Manage your gym's members, revenue, and attendance with ease.",
}

export default async function DashboardPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()
    const isDemo = !user && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemo) {
        redirect("/login")
    }

    let gym = null
    let dbError = false
    try {
        if (isDemo) {
            gym = { id: "demo-gym", name: "Gym Mitra Showcase", isVerified: true }
        } else if (user) {
            gym = await prisma.gymProfile.findUnique({
                where: { userId: user.id }
            })
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
                        <CardTitle>System Maintenance</CardTitle>
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

    if (!isDemo && gym && !(gym as any).isVerified) {
        redirect("/onboarding")
    }

    if (!gym && !isDemo) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Welcome to Gym Mitra!</CardTitle>
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
            productSalesCount: SHOWCASE_STATS.productSales,
            dailyCheckins: 12
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
        const [
            totalMembers,
            activeMembers,
            totalRevenue,
            productSalesCount,
            dailyCheckins,
            invoices,
            attendance,
            birthdays,
            monthlyRevenue,
        ] = await Promise.all([
            prisma.member.count({ where: { gymId: gym!.id } as any }),
            prisma.member.count({ where: { gymId: gym!.id, status: 'ACTIVE' } as any }),
            prisma.invoice.aggregate({
                where: { paymentStatus: 'PAID', gymId: gym!.id } as any,
                _sum: { total: true }
            }),
            prisma.sale.count({ where: { product: { gymId: gym!.id } } as any }),
            prisma.attendance.count({
                where: {
                    gymId: gym!.id,
                    date: { gte: today, lte: endOfToday() }
                } as any
            }),
            prisma.invoice.findMany({
                where: { gymId: gym!.id } as any,
                include: { member: { select: { name: true } } } as any,
                orderBy: { createdAt: 'desc' } as any,
                take: 5
            }),
            prisma.attendance.findMany({
                where: { gymId: gym!.id, date: { gte: today, lte: endOfToday() } } as any,
                include: { member: { select: { name: true } } },
                orderBy: { checkInTime: 'desc' },
                take: 3,
            }),
            prisma.member.findMany({
                where: { gymId: gym!.id, status: 'ACTIVE' },
                select: { name: true, phone: true, dateOfBirth: true },
                take: 50,
            }),
            prisma.$queryRaw`
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
            ` as Promise<{ month: number; total: any }[]>,
        ])

        dashboardData = {
            totalMembers,
            activeMembers,
            revenue: Number((totalRevenue as any)._sum.total || 0).toLocaleString('en-IN'),
            productSalesCount,
            dailyCheckins: dailyCheckins || 0
        }
        recentInvoices = invoices as any[]

        // Process Attendance
        if (attendance.length > 0) {
            const last = attendance[0]
            const checkIn = new Date((last as any).checkInTime)
            const minutesAgo = Math.max(0, Math.round((Date.now() - checkIn.getTime()) / 60000))
            todayAttendance = {
                count: dailyCheckins,
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
            .map((m: any) => {
                const dobString = typeof m.dateOfBirth === 'string' ? m.dateOfBirth : m.dateOfBirth.toISOString();
                const [year, month, day] = dobString.split('T')[0].split('-').map(Number);
                const dob = new Date(year, month - 1, day);
                let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
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
        if (monthlyRevenue && monthlyRevenue.length > 0) {
            const revenueMap = new Map<number, number>()
            for (const row of monthlyRevenue) {
                revenueMap.set(row.month, Number(row.total) || 0)
            }
            monthlyRevenueData = monthNames.map((name, i) => ({
                name,
                total: revenueMap.get(i + 1) || 0,
            }))
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
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">{gym?.name}</h2>
                        {isDemo && (
                            <div className="px-2.5 py-1 rounded-full bg-[#4FC3F7]/10 border border-[#4FC3F7]/20 flex items-center gap-1.5 animate-in fade-in zoom-in duration-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#4FC3F7] animate-pulse" />
                                <span className="text-[10px] font-bold text-[#1a365d] uppercase tracking-wider">Showcase</span>
                            </div>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1 font-medium flex items-center gap-2 text-sm md:text-base">
                        Manage your gym operations in one place.
                    </p>
                </div>
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
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-6">
                    <DashboardOverview
                        slug={slug}
                        gymName={(gym as any)?.businessName || gym?.name}
                        isDemo={isDemo}
                        initialData={{
                            totalMembers: dashboardData.totalMembers,
                            activeMembers: dashboardData.activeMembers,
                            revenue: dashboardData.revenue,
                            productSalesCount: dashboardData.productSalesCount,
                            dailyCheckins: dashboardData.dailyCheckins,
                            recentInvoices: JSON.parse(JSON.stringify(recentInvoices)),
                            todayAttendance,
                            upcomingBirthdays: JSON.parse(JSON.stringify(upcomingBirthdays)),
                            monthlyRevenueData,
                        }}
                    />
                </TabsContent>
                <TabsContent value="analytics" className="space-y-4">
                    <Analytics isDemo={isDemo} />
                </TabsContent>
                <TabsContent value="insights" className="space-y-4">
                    <RetentionMetrics isDemo={isDemo} />
                </TabsContent>
                <TabsContent value="reports" className="space-y-4">
                    <Reports isDemo={isDemo} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
