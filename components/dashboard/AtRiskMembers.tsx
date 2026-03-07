'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAtRiskQuery } from '@/hooks/use-at-risk'
import { AlertCircle, CalendarClock, MessageCircle, Loader2 } from 'lucide-react'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
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
            <Card className="h-full border-slate-200">
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
            <Card className="h-full border-slate-200">
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
        <Card className="h-full border-drift-200 shadow-sm flex flex-col bg-white rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-drift-100 flex flex-row items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-5 bg-red-500 rounded-full" />
                        <CardTitle className="text-base font-semibold text-red-500">
                            At Risk Members
                        </CardTitle>
                        {count > 0 && (
                            <span className="bg-red-50 text-red-500 rounded-full px-2 py-0.5 text-xs font-medium">
                                {count}
                            </span>
                        )}
                    </div>
                    <CardDescription className="text-sm text-drift-400">
                        {count > 0 ? (
                            <span>Active members missing for {days}+ days</span>
                        ) : (
                            <span>All members are active</span>
                        )}
                    </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={days.toString()} onValueChange={onDaysChange}>
                        <SelectTrigger className="w-[110px] h-9 text-xs font-medium border-drift-200 bg-drift-50/50">
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

            <CardContent className="p-0 flex-grow max-h-[400px] overflow-y-auto custom-scrollbar">
                {count === 0 ? (
                    <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6 text-drift-400">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                            <CalendarClock className="h-8 w-8 text-emerald-400" />
                        </div>
                        <p className="font-semibold text-drift-900">System Healthy</p>
                        <p className="text-xs max-w-[200px] mx-auto mt-1">No active members have been absent for over {days} days.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-drift-100 relative">
                        {members.slice(0, 10).map((member) => {
                            const link = member.phone ? getWhatsAppLink(member.phone, templates.inactivityNudge(member.name, member.daysInactive, gymName)) : '';

                            // Urgency-based badge colors
                            const badgeStyle = member.daysInactive >= 300
                                ? "bg-red-50 text-red-500"
                                : member.daysInactive >= 30
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-drift-100 text-drift-500";

                            return (
                                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-drift-50/80 transition-all duration-150 group">
                                    <div className="space-y-1">
                                        <Link href={`/${slug}/members/${member.id}`} className="font-semibold text-sm text-drift-900 hover:text-ion-500 transition-colors line-clamp-1 block">
                                            {member.name}
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-300", badgeStyle)}>
                                                {member.daysInactive}d ago
                                            </span>
                                            {member.lastVisit && (
                                                <span className="text-[10px] text-drift-400 font-medium">
                                                    Check-in: {new Date(member.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {link ? (
                                        <Button size="sm" variant="outline" className="h-9 border-ion-500 text-ion-500 hover:bg-ion-50 hover:text-ion-600 rounded-lg text-sm px-4 font-medium transition-all duration-150" asChild>
                                            <a href={link} target="_blank" rel="noopener noreferrer">
                                                <MessageCircle className="h-4 w-4 mr-2" /> Nudge
                                            </a>
                                        </Button>
                                    ) : (
                                        <div className="px-2 py-1 rounded bg-drift-50 text-[10px] font-bold text-drift-300 uppercase tracking-widest">No Phone</div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
            {count > 10 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                    <span className="text-xs font-medium text-slate-500">+ {count - 10} more at-risk members</span>
                </div>
            )}
        </Card>
    )
}
