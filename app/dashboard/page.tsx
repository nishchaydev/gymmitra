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

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Gym Mitra ERP Dashboard",
}

export default function DashboardPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    {/* <CalendarDateRangePicker /> */}
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
                    <TabsTrigger value="notifications" disabled>
                        Notifications
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
                                <div className="text-2xl font-bold">₹45,231.89</div>
                                <p className="text-xs text-muted-foreground">
                                    +20.1% from last month
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
                                <div className="text-2xl font-bold">+2350</div>
                                <p className="text-xs text-muted-foreground">
                                    +180.1% from last month
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">product Sales</CardTitle>
                                <CreditCard className="h-4 w-4 text-indigo-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+12,234</div>
                                <p className="text-xs text-muted-foreground">
                                    +19% from last month
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
                                <div className="text-2xl font-bold">+573</div>
                                <p className="text-xs text-muted-foreground">
                                    +201 since last hour
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
