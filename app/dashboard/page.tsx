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
import { Users, CreditCard, DollarSign, Activity, Dumbbell, UserPlus, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Dashboard | Gym Mitra",
    description: "Manage your gym's members, revenue, and attendance with ease.",
}

import { SHOWCASE_STATS } from "@/lib/showcase-data"
import { cookies } from "next/headers"

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()
    const isDemo = cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemo) {
        redirect("/login")
    }

    // Get the gym profile for this user
    const gym = isDemo ? { id: "demo-gym", name: "Showcase Gym (Demo)" } : await prisma.gymProfile.findUnique({
        where: { userId: user?.id }
    })

    if (!gym && !isDemo) {
        // This shouldn't happen with the new signup flow, but if it does:
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Welcome to Gym Mitra!</CardTitle>
                        <CardDescription>We're finishing setting up your profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>It looks like your gym profile wasn't created yet.</p>
                        <Link href="/settings">
                            <Button className="w-full">Create Gym Profile</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Data fetching logic
    let dashboardData;

    if (isDemo) {
        dashboardData = {
            totalMembers: SHOWCASE_STATS.totalMembers,
            activeMembers: SHOWCASE_STATS.activeMembers,
            revenue: SHOWCASE_STATS.totalRevenue.toLocaleString('en-IN'),
            productSalesCount: SHOWCASE_STATS.productSales
        }
    } else {
        const [totalMembers, activeMembers, totalRevenue, productSalesCount] = await Promise.all([
            prisma.member.count({ where: { gymId: gym!.id } }),
            prisma.member.count({ where: { gymId: gym!.id, status: 'ACTIVE' } }),
            prisma.invoice.aggregate({
                where: { paymentStatus: 'PAID', subscription: { member: { gymId: gym!.id } } },
                _sum: { total: true }
            }),
            prisma.sale.count({ where: { product: { gymId: gym!.id } } })
        ])
        dashboardData = {
            totalMembers,
            activeMembers,
            revenue: Number(totalRevenue._sum.total || 0).toLocaleString('en-IN'),
            productSalesCount
        }
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            {isDemo && (
                <div className="bg-emerald-600 text-white p-2 text-center text-sm font-medium rounded-md shadow-sm mb-4">
                    ✨ Running in Showcase Mode with Demo Data. Real database is bypassed.
                </div>
            )}
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">{gym?.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/members/new">
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" /> Add Member
                        </Button>
                    </Link>
                    <Link href="/products/new">
                        <Button variant="secondary">
                            <ShoppingBag className="mr-2 h-4 w-4" /> New Product
                        </Button>
                    </Link>
                </div>
            </div>
            <Tabs defaultValue="overview" className="space-y-4">
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
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Revenue
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{dashboardData.revenue}</div>
                                <p className="text-xs text-muted-foreground">
                                    Real-time payments
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Active Members
                                </CardTitle>
                                <Users className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardData.activeMembers}</div>
                                <p className="text-xs text-muted-foreground">
                                    Out of {dashboardData.totalMembers} total
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Product Sales</CardTitle>
                                <CreditCard className="h-4 w-4 text-indigo-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardData.productSalesCount}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total items sold
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Daily Check-ins
                                </CardTitle>
                                <Dumbbell className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Calculated</div>
                                <p className="text-xs text-muted-foreground">
                                    Today's energy
                                </p>
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
                        <RecentInvoices />
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
                    <Analytics />
                </TabsContent>
                <TabsContent value="reports" className="space-y-4">
                    <Reports />
                </TabsContent>
            </Tabs>
        </div>
    )
}
