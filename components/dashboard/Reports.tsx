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
import { MessageSquare } from "lucide-react"

interface ReportsProps {
    isDemo?: boolean
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
}

export function Reports({ isDemo = false }: ReportsProps) {
    return (
        <div className="space-y-4">
            <Tabs defaultValue="revenue" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="expiring">Expiring Memberships</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="space-y-4">
                    <RevenueReport />
                </TabsContent>

                <TabsContent value="attendance" className="space-y-4">
                    <AttendanceReport />
                </TabsContent>

                <TabsContent value="expiring" className="space-y-4">
                    <ExpiringMembershipsReport />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function RevenueReport() {
    const [data, setData] = useState<RevenueData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
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
    }, [])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Income from memberships and product sales over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                        <Tooltip
                            formatter={(value: any) => [`₹${value}`, 'Revenue']}
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

function AttendanceReport() {
    const [data, setData] = useState<AttendanceData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
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
    }, [])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle>Weekly Footfall</CardTitle>
                <CardDescription>Daily check-in counts for the past 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
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

function ExpiringMembershipsReport() {
    const [data, setData] = useState<ExpiringMembership[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/reports?type=expiring')
            .then(res => res.json())
            .then(data => {
                setData(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Expiring Soon
                </CardTitle>
                <CardDescription>Memberships ending in the next 7 days.</CardDescription>
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
                                            {Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                                        </Badge>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-brand-primary hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => {
                                            const daysLeft = Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                            const link = getWhatsAppLink(
                                                sub.member.phone,
                                                templates.renewalReminder(sub.member.name, daysLeft, "Your Gym") // TODO: Get actual gym name
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
