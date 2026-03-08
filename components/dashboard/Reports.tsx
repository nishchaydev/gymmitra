"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertTriangle } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getWhatsAppLink, templates } from "@/lib/whatsapp"
import { MessageSquare, Download } from "lucide-react"

interface ReportsProps {
    isDemo?: boolean
    gymName?: string
}

const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }


interface RevenueData {
    name: string
    total: number
}

interface AttendanceData {
    name: string
    total: number
}

interface ExpiringMembership {
    id: string
    endDate: string
    member: {
        name: string
        photo: string | null
        phone: string
    }
    plan: {
        name: string
    }
    daysLeft?: number
}

export function Reports({ isDemo = false, initialData, gymName = "Your Gym" }: ReportsProps & { initialData?: any }) {
    return (
        <div className="space-y-4">
            <Tabs defaultValue="revenue" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="expiring">Expiring Memberships</TabsTrigger>
                    <TabsTrigger value="reminders" className="relative">
                        Reminders
                        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="space-y-4">
                    <RevenueReport initialData={initialData?.revenue} />
                </TabsContent>

                <TabsContent value="attendance" className="space-y-4">
                    <AttendanceReport initialData={initialData?.attendance} />
                </TabsContent>

                <TabsContent value="expiring" className="space-y-4">
                    <ExpiringMembershipsReport initialData={initialData?.expiring} gymName={gymName} />
                </TabsContent>

                <TabsContent value="reminders" className="space-y-4">
                    <RemindersReport isDemo={isDemo} initialData={initialData?.reminders} />
                </TabsContent>
            </Tabs>
        </div>
    )
}


function RemindersReport({ isDemo = false, initialData }: { isDemo?: boolean, initialData?: any }) {
    const [data, setData] = useState<any>(() => {
        if (initialData) return initialData
        if (isDemo) {
            return {
                birthdays: [{ type: 'BIRTHDAY', memberId: '1', name: 'Rahul Sharma', message: 'Happy Bday!', link: getWhatsAppLink('919876543210', templates.birthdayWish('Rahul Sharma', 'GymMitra Demo')) }],
                overdue: [{ type: 'OVERDUE', invoiceId: '2', name: 'Priya Singh', amount: 2500, message: 'Overdue!', link: getWhatsAppLink('919876543210', templates.paymentOverdue('Priya Singh', 2500, 'GymMitra Demo')) }],
                inactive: [{
                    type: 'INACTIVE', memberId: '3', name: 'Amit Kumar', daysInactive: 18, message: 'Miss you!', link: getWhatsAppLink('919876543210', templates.inactivityNudge(
                        'Amit Kumar',
                        18,
                        'GymMitra Demo'
                    ))
                }],
                expiring: [{ type: 'EXPIRING', subId: '4', name: 'Neha Gupta', daysLeft: 3, message: 'Expiring!', link: getWhatsAppLink('919876543210', templates.renewalReminder('Neha Gupta', 3, 'GymMitra Demo')) }]
            }
        }
        return null
    })
    const [loading, setLoading] = useState(!isDemo && !initialData)

    useEffect(() => {
        if (isDemo || initialData || loading === false) return;

        fetch('/api/reminders')
            .then(res => res.json())
            .then(data => {
                setData(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [isDemo, initialData])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>

    if (!data) return <div className="text-center p-8 text-muted-foreground">Failed to load reminders.</div>

    const totalReminders = (data.birthdays?.length || 0) + (data.overdue?.length || 0) + (data.inactive?.length || 0) + (data.expiring?.length || 0)

    if (totalReminders === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                        <MessageSquare className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-lg font-medium text-slate-900">All caught up!</p>
                    <p className="text-sm">There are no pending reminders for today.</p>
                </CardContent>
            </Card>
        )
    }

    const renderActionList = (title: string, items: any[], icon: any, colorClass: string, subtitleFunc: (item: any) => string) => {
        if (!items || items.length === 0) return null

        return (
            <div className="space-y-3 mb-6">
                <h3 className={`text-sm font-bold flex items-center gap-2 ${colorClass}`}>
                    {icon} {title} ({items.length})
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                    {items.map((item, i) => (
                        <Card key={i} className="shadow-sm border-slate-200">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900">{item.name}</p>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{subtitleFunc(item)}</p>
                                </div>
                                <a href={item.link} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" className="bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm gap-2">
                                        <MessageSquare className="h-4 w-4" /> Send
                                    </Button>
                                </a>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {renderActionList("Birthdays Today", data.birthdays, <span className="text-xl">🎂</span>, "text-rose-500", () => "Wish them a happy birthday!")}
            {renderActionList("Overdue Payments", data.overdue, <span className="text-xl">💳</span>, "text-amber-600", (i) => `₹${i.amount} pending`)}
            {renderActionList("Expiring Soon (≤ 7 days)", data.expiring, <span className="text-xl">📅</span>, "text-blue-600", (i) => `Expires in ${i.daysLeft} days`)}
            {renderActionList("Inactive (> 14 days)", data.inactive, <span className="text-xl">⚠️</span>, "text-slate-600", (i) => `Absent for ${i.daysInactive} days`)}
        </div>
    )
}


function RevenueReport({ initialData }: { initialData?: RevenueData[] }) {
    const [data, setData] = useState<RevenueData[]>(initialData || [])
    const [loading, setLoading] = useState(!initialData)

    useEffect(() => {
        if (initialData) {
            setData(Array.isArray(initialData) ? initialData : [])
            setLoading(false)
            return;
        }
        fetch('/api/reports?type=revenue')
            .then(res => res.json())
            .then(data => {
                setData(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [initialData])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Monthly Revenue</CardTitle>
                        <CardDescription>Income from memberships and product sales over the last 6 months.</CardDescription>
                    </div>
                    <a href="/api/reports/download?type=invoices" download>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                    </a>
                </div>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, 'auto']} tickFormatter={(value) => {
                            if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
                            if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                            if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                            return `₹${value}`;
                        }} />
                        <Tooltip
                            formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                            cursor={{ fill: 'var(--color-primary-light, rgba(0, 102, 255, 0.05))' }}
                            contentStyle={tooltipStyle}
                        />
                        <Bar dataKey="total" radius={[6, 6, 0, 0]} className="fill-primary" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

function AttendanceReport({ initialData }: { initialData?: AttendanceData[] }) {
    const [data, setData] = useState<AttendanceData[]>(initialData || [])
    const [loading, setLoading] = useState(!initialData)

    useEffect(() => {
        if (initialData) {
            setData(Array.isArray(initialData) ? initialData : [])
            setLoading(false)
            return;
        }
        fetch('/api/reports?type=attendance')
            .then(res => res.json())
            .then(data => {
                setData(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [initialData])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Weekly Footfall</CardTitle>
                        <CardDescription>Daily check-in counts for the past 7 days.</CardDescription>
                    </div>
                    <a href="/api/reports/download?type=attendance" download>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                    </a>
                </div>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, 'auto']} />
                        <Tooltip
                            cursor={{ fill: 'var(--color-primary-light, rgba(0, 102, 255, 0.05))' }}
                            contentStyle={tooltipStyle}
                        />
                        <Bar dataKey="total" radius={[6, 6, 0, 0]} className="fill-primary" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

function ExpiringMembershipsReport({ initialData, gymName = "this gym" }: { initialData?: ExpiringMembership[], gymName?: string }) {
    const [data, setData] = useState<ExpiringMembership[]>(initialData || [])
    const [loading, setLoading] = useState(!initialData)

    useEffect(() => {
        if (initialData) {
            const processed = (Array.isArray(initialData) ? initialData : []).map(sub => {
                const diff = new Date(sub.endDate).getTime() - new Date().getTime();
                return { ...sub, daysLeft: Math.max(0, Math.ceil(diff / (1000 * 3600 * 24))) };
            });
            setData(processed)
            setLoading(false)
            return;
        }
        fetch('/api/reports?type=expiring')
            .then(res => res.json())
            .then(data => {
                const processed = (Array.isArray(data) ? data : []).map(sub => {
                    const diff = new Date(sub.endDate).getTime() - new Date().getTime();
                    return { ...sub, daysLeft: Math.max(0, Math.ceil(diff / (1000 * 3600 * 24))) };
                });
                setData(processed)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [initialData])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Expiring Soon
                        </CardTitle>
                        <CardDescription>Memberships ending in the next 7 days.</CardDescription>
                    </div>
                    <a href="/api/reports/download?type=members" download>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                    </a>
                </div>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No memberships expiring soon.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={sub.member.photo || undefined} />
                                        <AvatarFallback>
                                            {(sub.member?.name || "?")[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{sub.member.name}</p>
                                        <p className="text-sm text-muted-foreground">{sub.plan.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <div className="font-medium text-sm">
                                            Expires: {new Date(sub.endDate).toLocaleDateString()}
                                        </div>
                                        <Badge variant="outline" className="mt-1 border-yellow-500 text-yellow-600 bg-yellow-50">
                                            {sub.daysLeft ?? 0} days left
                                        </Badge>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-brand-primary hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => {
                                            const link = getWhatsAppLink(
                                                sub.member.phone,
                                                templates.renewalReminder(sub.member.name, sub.daysLeft || 0, gymName)
                                            )
                                            window.open(link, '_blank')
                                        }}
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
