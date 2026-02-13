import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/dashboard/Overview"
import { Analytics } from "@/components/dashboard/Analytics"
import { Reports } from "@/components/dashboard/Reports"
import { UpcomingBirthdays } from "@/components/dashboard/UpcomingBirthdays"
import { RecentInvoices } from "@/components/dashboard/RecentInvoices"
import { AttendanceWidget } from "@/components/dashboard/AttendanceWidget"
import { Button } from "@/components/ui/button"
import { Users, CreditCard, DollarSign, Dumbbell, UserPlus, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { startOfToday, endOfToday } from "date-fns"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SHOWCASE_STATS } from "@/lib/showcase-data"
import { cookies } from "next/headers"
import { exitDemo } from "./actions"

export const metadata: Metadata = {
    title: "Dashboard | Gym Mitra",
    description: "Manage your gym's members, revenue, and attendance with ease.",
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()
    // If user is logged in, FORCIBLY disable demo mode, regardless of cookie.
    // Demo mode is ONLY for unauthenticated visitors or explicit demo users.
    const isDemo = !user && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemo) {
        redirect("/login")
    }

    // Get the gym profile for this user
    // @ts-ignore - Temporary bypass until Prisma client is regenerated
    const gym = isDemo ? { id: "demo-gym", name: "Gym Mitra Showcase", isVerified: true } : await prisma.gymProfile.findUnique({
        where: { userId: user?.id }
    })

    if (!isDemo && gym && !(gym as any).isVerified) {
        redirect("/onboarding")
    }

    if (!gym && !isDemo) {
        // This shouldn't happen with the new signup flow, but if it does:
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Welcome to Gym Mitra!</CardTitle>
                        <CardDescription>We&apos;re finishing setting up your profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>It looks like your gym profile wasn&apos;t created yet.</p>
                        <Link href="/onboarding">
                            <Button className="w-full">Initialize Gym Profile</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Data fetching logic - Logged in users ALWAYS see real data (even if 0)
    let dashboardData;

    if (isDemo) {
        dashboardData = {
            totalMembers: SHOWCASE_STATS.totalMembers,
            activeMembers: SHOWCASE_STATS.activeMembers,
            revenue: SHOWCASE_STATS.totalRevenue.toLocaleString('en-IN'),
            productSalesCount: SHOWCASE_STATS.productSales,
            dailyCheckins: 12 // Mock value for demo
        }
    } else {
        const [totalMembers, activeMembers, totalRevenue, productSalesCount, dailyCheckins] = await Promise.all([
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
                    date: {
                        gte: startOfToday(),
                        lte: endOfToday()
                    }
                } as any
            })
        ])
        dashboardData = {
            totalMembers,
            activeMembers,
            revenue: Number((totalRevenue as any)._sum.total || 0).toLocaleString('en-IN'),
            productSalesCount,
            dailyCheckins
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {isDemo && (
                <div className="bg-primary text-white p-2 text-center text-sm font-medium rounded-md shadow-sm mb-4 flex items-center justify-center gap-4">
                    <span>✨ Running in Showcase Mode with Demo Data. Real database is bypassed.</span>
                    <form action={exitDemo}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs bg-white text-primary hover:bg-primary/5 border-0">
                            Exit Demo
                        </Button>
                    </form>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">{gym?.name}</h2>
                        {isDemo && (
                            <div className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-1.5 animate-in fade-in zoom-in duration-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Showcase Mode</span>
                            </div>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
                        Welcome back! Here&apos;s your gym overview.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/members/new">
                        <Button className="bg-primary hover:bg-primary-600 shadow-md">
                            <UserPlus className="mr-2 h-4 w-4" /> Add Member
                        </Button>
                    </Link>
                    <Link href="/products/new">
                        <Button variant="secondary" className="shadow-sm">
                            <ShoppingBag className="mr-2 h-4 w-4" /> New Product
                        </Button>
                    </Link>
                </div>
            </div>
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="reports">
                        Reports
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    Total Revenue
                                </CardTitle>
                                <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold">₹{dashboardData.revenue}</div>
                                    <div className="flex items-center text-sm">
                                        <span className="text-emerald-600 font-medium">Real-time</span>
                                        <span className="text-slate-500 ml-1">• All payments</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    Active Members
                                </CardTitle>
                                <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold">{dashboardData.activeMembers}</div>
                                    <div className="flex items-center text-sm">
                                        <span className="text-slate-600 font-medium">{dashboardData.totalMembers} total</span>
                                        <span className="text-slate-500 ml-1">• {dashboardData.totalMembers > 0 ? Math.round((dashboardData.activeMembers / dashboardData.totalMembers) * 100) : 0}% active</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">Product Sales</CardTitle>
                                <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold">{dashboardData.productSalesCount}</div>
                                    <div className="flex items-center text-sm">
                                        <span className="text-slate-600 font-medium">Items sold</span>
                                        <span className="text-slate-500 ml-1">• All-time</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">
                                    Daily Check-ins
                                </CardTitle>
                                <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                                    <Dumbbell className="h-5 w-5 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold">{dashboardData.dailyCheckins}</div>
                                    <div className="flex items-center text-sm">
                                        <span className="text-slate-600 font-medium">Today's energy</span>
                                        <span className="text-slate-500 ml-1">• Live tracking</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Revenue Overview</CardTitle>
                                <CardDescription>
                                    Monthly revenue breakdown from memberships and product sales.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <Overview />
                            </CardContent>
                        </Card>
                        <div className="col-span-3 space-y-4">
                            <AttendanceWidget />
                            <UpcomingBirthdays />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <RecentInvoices isDemo={isDemo} />
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Common tasks</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href="/members/new" className="w-full">
                                    <Button className="w-full justify-start" variant="outline">
                                        <UserPlus className="mr-2 h-4 w-4" /> Add New Member
                                    </Button>
                                </Link>
                                <Link href="/products/new" className="w-full">
                                    <Button className="w-full justify-start" variant="outline">
                                        <ShoppingBag className="mr-2 h-4 w-4" /> Add Inventory
                                    </Button>
                                </Link>
                                <Button className="w-full justify-start" variant="outline" disabled>
                                    <CreditCard className="mr-2 h-4 w-4" /> Generate Report
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="analytics" className="space-y-4">
                    <Analytics isDemo={isDemo} />
                </TabsContent>
                <TabsContent value="reports" className="space-y-4">
                    <Reports isDemo={isDemo} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
