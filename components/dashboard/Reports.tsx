"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertTriangle, TrendingUp, Users, Calendar, Bell } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getWhatsAppLink, templates } from "@/lib/whatsapp"
import { MessageSquare, Download } from "lucide-react"
import { format } from "date-fns"

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

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SECTION HEADER — consistent premium header for each section
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function SectionHeader({ icon, title, subtitle, accentColor }: {
    icon: React.ReactNode
    title: string
    subtitle: string
    accentColor: string
}) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${accentColor} shadow-sm`}>
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
                <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
            </div>
        </div>
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * MAIN REPORTS — all sections scroll vertically, no sub-tabs
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function Reports({ isDemo = false, initialData, gymName = "Your Gym" }: ReportsProps & { initialData?: any }) {
    const sectionCard = "border-0 bg-white/80 backdrop-blur-sm shadow-[0_1px_12px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden"

    return (
        <div className="space-y-8">
            {/* ── Section 1: Revenue ── */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SectionHeader
                    icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                    title="Revenue Overview"
                    subtitle="Monthly income from memberships & product sales"
                    accentColor="from-emerald-50 to-emerald-100"
                />
                <Card className={sectionCard}>
                    <RevenueReport initialData={initialData?.revenue} />
                </Card>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* ── Section 2: Attendance ── */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
                <SectionHeader
                    icon={<Users className="h-5 w-5 text-blue-600" />}
                    title="Attendance Trends"
                    subtitle="Daily check-in counts for the past week"
                    accentColor="from-blue-50 to-blue-100"
                />
                <Card className={sectionCard}>
                    <AttendanceReport initialData={initialData?.attendance} />
                </Card>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* ── Section 3: Expiring Memberships ── */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <SectionHeader
                    icon={<Calendar className="h-5 w-5 text-amber-600" />}
                    title="Expiring Memberships"
                    subtitle="Members whose plans end within 7 days"
                    accentColor="from-amber-50 to-amber-100"
                />
                <Card className={sectionCard}>
                    <ExpiringMembershipsReport initialData={initialData?.expiring} gymName={gymName} />
                </Card>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* ── Section 4: Reminders ── */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                <SectionHeader
                    icon={<Bell className="h-5 w-5 text-rose-600" />}
                    title="Smart Reminders"
                    subtitle="Birthdays, overdue payments, and inactive members"
                    accentColor="from-rose-50 to-rose-100"
                />
                <RemindersReport isDemo={isDemo} initialData={initialData?.reminders} />
            </div>
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

    if (loading) return (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-[0_1px_12px_rgba(0,0,0,0.06)] rounded-2xl">
            <CardContent className="flex justify-center p-8">
                <Loader2 className="animate-spin text-primary" />
            </CardContent>
        </Card>
    )

    if (!data) return (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-[0_1px_12px_rgba(0,0,0,0.06)] rounded-2xl">
            <CardContent className="text-center p-8 text-muted-foreground">Failed to load reminders.</CardContent>
        </Card>
    )

    const totalReminders = (data.birthdays?.length || 0) + (data.overdue?.length || 0) + (data.inactive?.length || 0) + (data.expiring?.length || 0)

    if (totalReminders === 0) {
        return (
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-[0_1px_12px_rgba(0,0,0,0.06)] rounded-2xl">
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

    const categoryConfig = [
        { key: 'birthdays', title: 'Birthdays Today', icon: '🎂', gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50', text: 'text-rose-700', subtitleFn: () => 'Wish them a happy birthday!' },
        { key: 'overdue', title: 'Overdue Payments', icon: '💳', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700', subtitleFn: (i: any) => `₹${i.amount} pending` },
        { key: 'expiring', title: 'Expiring Soon', icon: '📅', gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', text: 'text-blue-700', subtitleFn: (i: any) => `Expires in ${i.daysLeft} days` },
        { key: 'inactive', title: 'Inactive Members', icon: '⚠️', gradient: 'from-slate-500 to-gray-600', bg: 'bg-slate-50', text: 'text-slate-700', subtitleFn: (i: any) => `Absent for ${i.daysInactive} days` },
    ]

    const activeCategories = categoryConfig.filter(c => data[c.key]?.length > 0)

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {activeCategories.map(cat => (
                <Card key={cat.key} className="border-0 bg-white/80 backdrop-blur-sm shadow-[0_1px_12px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden">
                    {/* Gradient top strip */}
                    <div className={`h-1 bg-gradient-to-r ${cat.gradient}`} />
                    <CardHeader className="px-4 py-3 pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-base">{cat.icon}</span>
                                <CardTitle className={`text-sm font-bold ${cat.text}`}>{cat.title}</CardTitle>
                            </div>
                            <Badge variant="secondary" className={`text-[10px] font-bold ${cat.bg} ${cat.text} border-0 px-2`}>
                                {data[cat.key].length}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 space-y-2">
                        {data[cat.key].map((item: any, i: number) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${cat.bg}/50 border border-slate-100/80 hover:shadow-sm transition-all duration-200`}>
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`flex-shrink-0 h-8 w-8 rounded-lg ${cat.bg} flex items-center justify-center`}>
                                        <span className={`text-xs font-black ${cat.text}`}>{(item.name || '?')[0]}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 text-[13px] truncate">{item.name}</p>
                                        <p className="text-[11px] font-medium text-slate-500 truncate">{cat.subtitleFn(item)}</p>
                                    </div>
                                </div>
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 ml-2">
                                    <Button size="sm" className="h-7 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm gap-1.5 rounded-lg text-[11px] font-bold px-2.5">
                                        <MessageSquare className="h-3 w-3" /> Send
                                    </Button>
                                </a>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
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

    if (loading) return (
        <CardContent className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" />
        </CardContent>
    )

    return (
        <>
            <CardHeader className="px-5 py-4 bg-gradient-to-r from-emerald-50/40 to-transparent border-b border-slate-100/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-900">Monthly Revenue</CardTitle>
                        <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">Income from memberships and sales over 6 months</CardDescription>
                    </div>
                    <a href="/api/reports/download?type=invoices" download>
                        <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-slate-200 hover:bg-slate-50 shadow-sm">
                            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                        </Button>
                    </a>
                </div>
            </CardHeader>
            <CardContent className="pl-2 pr-4 py-4">
                <ResponsiveContainer width="100%" height={320}>
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
                            cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                            contentStyle={tooltipStyle}
                        />
                        <Bar dataKey="total" radius={[8, 8, 0, 0]} className="fill-primary" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </>
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

    if (loading) return (
        <CardContent className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" />
        </CardContent>
    )

    return (
        <>
            <CardHeader className="px-5 py-4 bg-gradient-to-r from-blue-50/40 to-transparent border-b border-slate-100/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-900">Weekly Footfall</CardTitle>
                        <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">Daily check-in counts for the past 7 days</CardDescription>
                    </div>
                    <a href="/api/reports/download?type=attendance" download>
                        <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-slate-200 hover:bg-slate-50 shadow-sm">
                            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                        </Button>
                    </a>
                </div>
            </CardHeader>
            <CardContent className="pl-2 pr-4 py-4">
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={data}>
                        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, 'auto']} />
                        <Tooltip
                            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                            contentStyle={tooltipStyle}
                        />
                        <Bar dataKey="total" radius={[8, 8, 0, 0]} className="fill-primary" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </>
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

    if (loading) return (
        <CardContent className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" />
        </CardContent>
    )

    return (
        <>
            <CardHeader className="px-5 py-4 bg-gradient-to-r from-amber-50/40 to-transparent border-b border-slate-100/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Expiring Soon
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">Memberships ending in the next 7 days</CardDescription>
                    </div>
                    <a href="/api/reports/download?type=members" download>
                        <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-slate-200 hover:bg-slate-50 shadow-sm">
                            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                        </Button>
                    </a>
                </div>
            </CardHeader>
            <CardContent className="p-5">
                {data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                            <Calendar className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="font-medium text-slate-700">No memberships expiring soon</p>
                        <p className="text-xs text-slate-400 mt-1">All members are safely within their plan period</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                                        <AvatarImage src={sub.member.photo || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 font-bold text-xs">
                                            {(sub.member?.name || "?")[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-900">{sub.member.name}</p>
                                        <p className="text-xs text-slate-500">{sub.plan.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="text-right">
                                        <div className="text-xs font-medium text-slate-600">
                                            {format(new Date(sub.endDate), "dd MMM yyyy")}
                                        </div>
                                        <Badge variant="outline" className="mt-1 text-[10px] font-bold border-amber-200 text-amber-700 bg-amber-50">
                                            {sub.daysLeft ?? 0}d left
                                        </Badge>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-lg text-[#25D366] hover:text-emerald-700 hover:bg-emerald-50"
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
        </>
    )
}
