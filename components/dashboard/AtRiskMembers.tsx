'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAtRiskQuery } from '@/hooks/use-at-risk'
import { AlertCircle, CalendarClock, MessageCircle, Loader2, Clock } from 'lucide-react'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
import { format } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface AtRiskMembersProps {
    slug: string
    gymName?: string
    isDemo?: boolean
}

export function AtRiskMembers({ slug, gymName = "Gym Mitra", isDemo = false }: AtRiskMembersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Parse ?inactiveDays= from URL, defaulting to 14
    const inactiveDaysParam = searchParams?.get('inactiveDays')
    const parsedDays = inactiveDaysParam ? parseInt(inactiveDaysParam, 10) : 14
    const configDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 14

    const { data: atRiskData, isLoading, isError } = useAtRiskQuery(configDays, { enabled: !isDemo })

    const handleDaysChange = (value: string) => {
        const newParams = new URLSearchParams(searchParams?.toString())
        newParams.set('inactiveDays', value)
        router.push(`?${newParams.toString()}`, { scroll: false })
    }

    if (isDemo) {
        // Return dummy data for showcase mode
        return renderWidget(
            {
                count: 3,
                daysThreshold: configDays,
                members: [
                    { id: '1', name: 'Rahul Sharma', phone: '919876543210', lastVisit: '2023-10-01', daysInactive: configDays + 2 },
                    { id: '2', name: 'Priya Singh', phone: '919876543211', lastVisit: '2023-10-05', daysInactive: configDays + 5 },
                    { id: '3', name: 'Amit Kumar', phone: '919876543212', lastVisit: null, daysInactive: configDays + 10 },
                ]
            },
            configDays,
            handleDaysChange,
            slug,
            gymName
        )
    }

    if (isLoading) {
        return (
            <Card className="h-full border border-drift-200 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.06)] rounded-[14px] overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
                            <AlertCircle className="h-5 w-5" />
                            At Risk Members
                        </CardTitle>
                        <CardDescription>Active members missing for {configDays}+ days</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                </CardContent>
            </Card>
        )
    }

    if (isError || !atRiskData) {
        return (
            <Card className="h-full border border-drift-200 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.06)] rounded-[14px] overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
                        <AlertCircle className="h-5 w-5" />
                        At Risk Members
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center text-sm text-slate-500">
                    Failed to load at-risk members.
                </CardContent>
            </Card>
        )
    }

    return renderWidget(atRiskData, configDays, handleDaysChange, slug, gymName)
}

interface AtRiskMember {
    id: string;
    name: string;
    phone: string | null;
    lastVisit: string | null;
    daysInactive: number;
}

interface AtRiskData {
    count: number;
    members: AtRiskMember[];
    daysThreshold: number;
}

function renderWidget(data: AtRiskData, days: number, onDaysChange: (v: string) => void, slug: string, gymName: string) {
    const { count, members } = data

    return (
        <Card className="border border-drift-200 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.06)] rounded-[14px] flex flex-col overflow-hidden h-fit">
            <CardHeader className="pb-3 border-b border-drift-100 flex flex-row items-center justify-between bg-drift-50/5">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-5 w-5 text-rose-600" />
                        <CardTitle className="text-base font-bold text-slate-900">
                            At-Risk Members
                        </CardTitle>
                        {count > 0 && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold">
                                {count}
                            </Badge>
                        )}
                    </div>
                    <CardDescription className="text-xs font-medium text-drift-400">
                        {count > 0 ? (
                            <span>Missing {days}+ days since check-in</span>
                        ) : (
                            <span>All members active</span>
                        )}
                    </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={days.toString()} onValueChange={onDaysChange}>
                        <SelectTrigger className="w-[90px] h-8 text-[10px] font-bold border-drift-200 bg-white">
                            <SelectValue placeholder="Days" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-drift-200 shadow-xl">
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="14">14 Days</SelectItem>
                            <SelectItem value="21">21 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="p-0 overflow-y-auto custom-scrollbar max-h-[450px]">
                {count === 0 ? (
                    <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-6 text-drift-400">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                            <CalendarClock className="h-8 w-8 text-emerald-400" />
                        </div>
                        <p className="font-semibold text-drift-900">System Healthy</p>
                        <p className="text-xs max-w-[200px] mx-auto mt-1">No active members haven&apos;t checked in for {days} days.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-drift-100 relative">
                        {members.slice(0, 15).map((member) => {
                            const link = member.phone ? getWhatsAppLink(member.phone, templates.inactivityNudge(member.name, member.daysInactive, gymName)) : '';

                            // Urgency-based badge colors
                            const badgeStyle = member.daysInactive >= 30
                                ? "bg-rose-50 text-rose-600 border-rose-100"
                                : member.daysInactive >= 14
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-blue-50 text-blue-600 border-blue-100";

                            return (
                                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all duration-150 group">
                                    <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                                        <Link href={`/${slug}/members/${member.id}`} className="font-bold text-sm text-slate-900 hover:text-primary transition-colors truncate block">
                                            {member.name}
                                        </Link>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", badgeStyle)}>
                                                {member.daysInactive}d inactive
                                            </span>
                                            {member.lastVisit && (
                                                <div className="flex items-center text-xs text-slate-500 font-medium">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Visit: {format(new Date(member.lastVisit), "d MMM")}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {link ? (
                                        <Button size="sm" variant="outline" className="h-8 bg-white border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg text-xs px-3 font-bold transition-all duration-200" asChild>
                                            <a href={link} target="_blank" rel="noopener noreferrer">
                                                <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Nudge
                                            </a>
                                        </Button>
                                    ) : (
                                        <Badge variant="outline" className="h-6 text-[9px] text-slate-400 border-dashed border-slate-200">No Phone</Badge>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    {count > 15 ? `+ ${count - 15} others` : 'End of list'}
                </span>
                <Link href={`/${slug}/members?status=ACTIVE`} className="text-[10px] font-black text-primary hover:underline uppercase tracking-tighter">
                    View All Members →
                </Link>
            </div>
        </Card>
    )
}
