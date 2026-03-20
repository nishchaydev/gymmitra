'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAtRiskQuery } from '@/hooks/use-at-risk'
import { useExpiringMembersQuery } from '@/hooks/use-expiring-members'
import { AlertCircle, AlertTriangle, CalendarClock, MessageCircle, Loader2, Clock, CalendarDays, UserMinus } from 'lucide-react'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
import { format, parseISO, isValid } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'

interface AtRiskMembersProps {
    slug: string
    gymName?: string
    isDemo?: boolean
}

export function AtRiskMembers({ slug, gymName = "GymMitra", isDemo = false }: AtRiskMembersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState('at-risk')

    // Parse ?inactiveDays= from URL, defaulting to 14
    const inactiveDaysParam = searchParams?.get('inactiveDays')
    const parsedDays = inactiveDaysParam ? parseInt(inactiveDaysParam, 10) : 14
    const configDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 14

    const { data: atRiskData, isLoading: isLoadingAtRisk } = useAtRiskQuery(configDays, { enabled: !isDemo })
    const { data: expiringData, isLoading: isLoadingExpiring } = useExpiringMembersQuery({ enabled: !isDemo })

    const handleDaysChange = (value: string) => {
        const newParams = new URLSearchParams(searchParams?.toString())
        newParams.set('inactiveDays', value)
        router.push(`?${newParams.toString()}`, { scroll: false })
    }

    const isLoading = isLoadingAtRisk || isLoadingExpiring

    return (
        <Card className="border-0 bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden h-fit group/card hover:shadow-primary/5 transition-all duration-300">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CardHeader className="pb-0 border-b border-drift-100/30 bg-gradient-to-r from-primary-50/20 to-transparent p-0">
                    <div className="px-6 pt-6 pb-4 flex flex-row items-center justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                                Action Required
                            </CardTitle>
                        </div>
                        {activeTab === 'at-risk' && (
                            <Select value={configDays.toString()} onValueChange={handleDaysChange}>
                                <SelectTrigger className="w-[110px] h-9 text-[11px] font-bold border-drift-200/60 bg-white shadow-sm hover:border-primary/40 transition-colors rounded-xl font-mono">
                                    <SelectValue placeholder="Period" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-drift-100 shadow-2xl p-1">
                                    <SelectItem value="7" className="rounded-xl focus:bg-primary-50 text-xs">7 Days</SelectItem>
                                    <SelectItem value="14" className="rounded-xl focus:bg-primary-50 text-xs">14 Days</SelectItem>
                                    <SelectItem value="21" className="rounded-xl focus:bg-primary-50 text-xs">21 Days</SelectItem>
                                    <SelectItem value="30" className="rounded-xl focus:bg-primary-50 text-xs">30 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="px-6">
                        <TabsList className="bg-transparent h-11 w-full justify-start p-0 gap-8 border-b-0">
                            <TabsTrigger 
                                value="at-risk" 
                                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-11 px-0 text-[11px] font-black uppercase tracking-widest transition-all"
                            >
                                <UserMinus className="h-3.5 w-3.5 mr-2" />
                                Inactive
                                {atRiskData && atRiskData.count > 0 && (
                                    <Badge variant="secondary" className="ml-2 bg-rose-500 text-white border-none h-4 px-1.5 min-w-[18px] flex items-center justify-center text-[9px] font-black rounded-full shadow-sm">
                                        {atRiskData.count}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger 
                                value="expiring" 
                                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-11 px-0 text-[11px] font-black uppercase tracking-widest transition-all"
                            >
                                <CalendarDays className="h-3.5 w-3.5 mr-2" />
                                Expiring
                                {expiringData && expiringData.count > 0 && (
                                    <Badge variant="secondary" className="ml-2 bg-amber-500 text-white border-none h-4 px-1.5 min-w-[18px] flex items-center justify-center text-[9px] font-black rounded-full shadow-sm">
                                        {expiringData.count}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-y-auto custom-scrollbar max-h-[450px]">
                    <TabsContent value="at-risk" className="m-0 focus-visible:outline-none">
                        {isLoadingAtRisk ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                            </div>
                        ) : !atRiskData || atRiskData.count === 0 ? (
                            <EmptyState 
                                icon={<CalendarClock className="h-8 w-8 text-emerald-400" />}
                                title="System Healthy"
                                description={`No active members haven't checked in for ${configDays} days.`}
                                color="emerald"
                            />
                        ) : (
                            <div className="divide-y divide-drift-100">
                                {atRiskData.members.slice(0, 15).map((member) => {
                                    const link = member.phone ? getWhatsAppLink(member.phone, templates.inactivityNudge(member.name, member.daysInactive, gymName)) : '';
                                    const badgeStyle = getAtRiskBadgeStyle(member.daysInactive)

                                    return (
                                        <MemberActionItem 
                                            key={member.id}
                                            id={member.id}
                                            name={member.name}
                                            slug={slug}
                                            badgeText={`${member.daysInactive}d inactive`}
                                            badgeStyle={badgeStyle}
                                            link={link}
                                            subtitle={member.lastVisit ? `Visit: ${format(parseISO(member.lastVisit), "d MMM")}` : 'No visits'}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="expiring" className="m-0 focus-visible:outline-none">
                        {isLoadingExpiring ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                            </div>
                        ) : !expiringData || expiringData.count === 0 ? (
                            <EmptyState 
                                icon={<CalendarClock className="h-8 w-8 text-blue-400" />}
                                title="All Good"
                                description="No memberships expiring in the next 30 days."
                                color="blue"
                            />
                        ) : (
                            <div className="divide-y divide-drift-100">
                                {expiringData.members.slice(0, 15).map((member) => {
                                    const link = member.phone ? getWhatsAppLink(member.phone, templates.renewalReminder(member.name, member.daysLeft, gymName)) : '';
                                    const badgeStyle = getExpiringBadgeStyle(member.daysLeft)

                                    return (
                                        <MemberActionItem 
                                            key={member.id}
                                            id={member.id}
                                            name={member.name}
                                            slug={slug}
                                            badgeText={`${member.daysLeft}d left`}
                                            badgeStyle={badgeStyle}
                                            link={link}
                                            subtitle={`Ends: ${format(parseISO(member.endDate), "d MMM")} • ${member.planName}`}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>
                </CardContent>
            </Tabs>

            <div className="px-6 py-4 border-t border-drift-100/30 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {activeTab === 'at-risk' 
                        ? (atRiskData && atRiskData.count > 15 ? `+ ${atRiskData.count - 15} more` : 'End of list')
                        : (expiringData && expiringData.count > 15 ? `+ ${expiringData.count - 15} more` : 'End of list')
                    }
                </span>
                <Link href={`/${slug}/members?status=ACTIVE`} className="text-[10px] font-black text-primary hover:text-primary-600 uppercase tracking-widest flex items-center gap-1.5 group/link transition-colors">
                    View Registry
                    <span className="group-hover/link:translate-x-0.5 transition-transform">→</span>
                </Link>
            </div>
        </Card>
    )
}

function EmptyState({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: 'emerald' | 'blue' }) {
    const bgColors = {
        emerald: 'bg-emerald-50',
        blue: 'bg-blue-50'
    }
    
    return (
        <div className="min-h-[250px] flex flex-col items-center justify-center text-center p-6 text-drift-400">
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", bgColors[color])}>
                {icon}
            </div>
            <p className="font-semibold text-drift-900">{title}</p>
            <p className="text-xs max-w-[200px] mx-auto mt-1">{description}</p>
        </div>
    )
}

function MemberActionItem({ id, name, slug, badgeText, badgeStyle, link, subtitle }: { 
    id: string, name: string, slug: string, badgeText: string, badgeStyle: string, link: string, subtitle: string 
}) {
    return (
        <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/40 transition-all duration-200 group/item">
            <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                <Link href={`/${slug}/members/${id}`} className="font-bold text-sm text-slate-900 group-hover/item:text-primary transition-colors truncate block">
                    {name}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border", badgeStyle)}>
                        {badgeText}
                    </span>
                    <div className="flex items-center text-[11px] text-slate-400 font-medium font-mono">
                        <Clock className="h-3 w-3 mr-1 opacity-50" />
                        {subtitle}
                    </div>
                </div>
            </div>

            {link ? (
                <Button size="sm" variant="outline" className="h-9 bg-white border-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl text-[11px] px-4 font-black uppercase tracking-widest transition-all duration-300 shadow-sm active:scale-95" asChild>
                    <a href={link} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-3.5 w-3.5 mr-2 fill-primary/10 group-hover/item:fill-white/20" /> Nudge
                    </a>
                </Button>
            ) : (
                <Badge variant="outline" className="h-6 text-[9px] text-slate-300 border-dashed border-slate-200 uppercase tracking-tighter font-black">No Contact</Badge>
            )}
        </div>
    )
}

function getAtRiskBadgeStyle(days: number) {
    if (days >= 30) return "bg-rose-50 text-rose-600 border-rose-100"
    if (days >= 14) return "bg-amber-50 text-amber-600 border-amber-100"
    return "bg-blue-50 text-blue-600 border-blue-100"
}

function getExpiringBadgeStyle(days: number) {
    if (days <= 3) return "bg-rose-50 text-rose-600 border-rose-100 animate-pulse"
    if (days <= 10) return "bg-amber-50 text-amber-600 border-amber-100"
    return "bg-emerald-50 text-emerald-600 border-emerald-100"
}
