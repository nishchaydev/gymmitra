'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAtRiskQuery } from '@/hooks/use-at-risk'
import { AlertCircle, CalendarClock, MessageCircle, Loader2 } from 'lucide-react'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
import { useRouter, useSearchParams } from 'next/navigation'
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
    const configDays = inactiveDaysParam ? parseInt(inactiveDaysParam) : 14

    const { data: atRiskData, isLoading, isError } = useAtRiskQuery(configDays)

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
            gymName,
            false
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

    return renderWidget(atRiskData, configDays, handleDaysChange, slug, gymName, false)
}

function renderWidget(data: any, days: number, onDaysChange: (v: string) => void, slug: string, gymName: string, isLoading: boolean) {
    const { count, members } = data

    return (
        <Card className="h-full border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
                        <AlertCircle className="h-5 w-5" />
                        At Risk Members
                    </CardTitle>
                    <CardDescription>
                        {count > 0 ? (
                            <span className="font-semibold text-rose-600">{count} member{count !== 1 ? 's' : ''} at risk this week</span>
                        ) : (
                            <span>Active members missing for {days}+ days</span>
                        )}
                    </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={days.toString()} onValueChange={onDaysChange}>
                        <SelectTrigger className="w-[110px] h-8 text-xs font-medium">
                            <SelectValue placeholder="Days" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="14">14 Days</SelectItem>
                            <SelectItem value="21">21 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-grow max-h-[350px] overflow-y-auto custom-scrollbar">
                {count === 0 ? (
                    <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <CalendarClock className="h-10 w-10 text-emerald-100 mb-3" />
                        <p className="font-medium text-slate-900">All good!</p>
                        <p className="text-sm">No active members have been absent for over {days} days.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        )}
                        {members.slice(0, 10).map((member: any) => {
                            const link = member.phone ? getWhatsAppLink(member.phone, templates.inactivityNudge(member.name, member.daysInactive, gymName)) : '';

                            return (
                                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="space-y-1">
                                        <Link href={`/${slug}/members/${member.id}`} className="font-medium text-sm text-slate-900 hover:text-primary transition-colors line-clamp-1">
                                            {member.name}
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px] font-bold text-rose-600 bg-rose-50 border-rose-200 uppercase tracking-widest px-1.5 py-0 h-4">
                                                {member.daysInactive}d ago
                                            </Badge>
                                            {member.lastVisit && (
                                                <span className="text-[10px] text-slate-400">
                                                    Last check-in: {new Date(member.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {link ? (
                                        <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" asChild>
                                            <a href={link} target="_blank" rel="noopener noreferrer">
                                                <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Nudge
                                            </a>
                                        </Button>
                                    ) : (
                                        <Badge variant="secondary" className="text-[10px] uppercase font-bold text-slate-400">No Phone</Badge>
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
