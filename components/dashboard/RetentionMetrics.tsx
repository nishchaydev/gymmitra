"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, AlertTriangle, Activity, RefreshCw } from "lucide-react"
import { MOCKUP_DATA } from "@/lib/showcase-data"
import { getWhatsAppLink, templates } from "@/lib/whatsapp"

interface ChurnData {
    name: string
    churnRate: number
}

interface RetentionData {
    name: string
    retentionRate: number
}

interface MemberFrequency {
    memberId: string
    memberName: string
    phone: string
    visitCount: number
    lastVisit: string | null
}

const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }

export function RetentionMetrics({ isDemo = false }: { isDemo?: boolean }) {
    const [churnData, setChurnData] = useState<ChurnData[]>([])
    const [retentionRate, setRetentionRate] = useState<number>(0)
    const [atRiskMembers, setAtRiskMembers] = useState<MemberFrequency[]>([])
    const [loading, setLoading] = useState(!isDemo)

    useEffect(() => {
        if (isDemo) {
            // Mock data for showcase
            setChurnData([
                { name: 'Oct', churnRate: 5 },
                { name: 'Nov', churnRate: 8 },
                { name: 'Dec', churnRate: 12 },
                { name: 'Jan', churnRate: 4 },
                { name: 'Feb', churnRate: 2 },
            ])
            setRetentionRate(92)
            setAtRiskMembers([
                { memberId: '1', memberName: 'Rahul Sharma', phone: '9876543210', visitCount: 1, lastVisit: '2024-02-01' },
                { memberId: '2', memberName: 'Priya Singh', phone: '9876543211', visitCount: 2, lastVisit: '2024-02-10' },
            ])
            return
        }

        async function fetchMetrics() {
            try {
                const [churnRes, retentionRes, freqRes] = await Promise.all([
                    fetch('/api/reports?type=churn'),
                    fetch('/api/reports?type=retention'),
                    fetch('/api/reports?type=member-frequency')
                ])

                if (churnRes.ok) setChurnData(await churnRes.json())

                if (retentionRes.ok) {
                    const data: RetentionData[] = await retentionRes.json()
                    // Get the latest month's retention rate
                    if (data.length > 0) {
                        setRetentionRate(data[data.length - 1].retentionRate)
                    }
                }

                if (freqRes.ok) {
                    const data: MemberFrequency[] = await freqRes.json()
                    // Filter to only show members with < 4 visits in 30 days
                    setAtRiskMembers(data.filter(m => m.visitCount < 4))
                }
            } catch (error) {
                console.error('Failed to load retention metrics:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchMetrics()
    }, [isDemo])

    if (loading) {
        return <div className="h-[400px] flex items-center justify-center text-muted-foreground animate-pulse">Loading insights...</div>
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-2 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-rose-500" />
                            Monthly Churn Rate
                        </CardTitle>
                        <CardDescription>Percentage of members going inactive over the last 5 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={churnData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(225, 29, 72, 0.05)' }} />
                                    <Bar dataKey="churnRate" name="Churn Rate %" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 flex flex-col justify-center items-center text-center p-6">
                    <RefreshCw className="h-12 w-12 text-emerald-500 mb-4 opacity-80" />
                    <h3 className="text-xl font-bold text-slate-700 mb-1">Current Retention</h3>
                    <div className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
                        {retentionRate}%
                    </div>
                    <p className="text-sm text-slate-500 max-w-[200px]">
                        Of expiring subscriptions were renewed this month.
                    </p>
                </Card>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-rose-600">
                        <AlertTriangle className="h-5 w-5" />
                        At-Risk Members
                    </CardTitle>
                    <CardDescription>Members with fewer than 4 visits in the last 30 days. Reach out to re-engage them.</CardDescription>
                </CardHeader>
                <CardContent>
                    {atRiskMembers.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3 opacity-50" />
                            <p>All active members have good attendance!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Last 30 Days</TableHead>
                                        <TableHead>Last Visit</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {atRiskMembers.map((member) => {
                                        const daysInactive = member.lastVisit ?
                                            Math.floor((new Date().getTime() - new Date(member.lastVisit).getTime()) / (1000 * 3600 * 24))
                                            : 30

                                        const msg = templates.inactivityNudge(member.memberName, daysInactive, 'Gym Mitra')
                                        const link = getWhatsAppLink(member.phone, msg)

                                        return (
                                            <TableRow key={member.memberId}>
                                                <TableCell className="font-medium">{member.memberName}</TableCell>
                                                <TableCell>
                                                    <Badge variant={member.visitCount === 0 ? "destructive" : "secondary"}>
                                                        {member.visitCount} visits
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {member.lastVisit ? new Date(member.lastVisit).toLocaleDateString() : 'Never'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <a href={link} target="_blank" rel="noopener noreferrer">
                                                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                                            <MessageSquare className="h-4 w-4 mr-2" /> Nudge
                                                        </Button>
                                                    </a>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function CheckCircle2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
