'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRenewalsQuery, RenewalMember } from '@/hooks/use-renewals'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
import { Loader2, Send, AlertTriangle, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface RenewalCommandCenterProps {
    gymName: string
    isDemo?: boolean
}

export function RenewalCommandCenter({ gymName }: RenewalCommandCenterProps) {
    const { data, isLoading, isError } = useRenewalsQuery()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isSending, setIsSending] = useState(false)
    const [sendProgress, setSendProgress] = useState(0)
    const [showFallbackList, setShowFallbackList] = useState(false)
    const [fallbackMembers, setFallbackMembers] = useState<RenewalMember[]>([])

    const handleSelectAll = (members: RenewalMember[]) => {
        if (selectedIds.size === members.length && members.length > 0) {
            setSelectedIds(new Set()) // Deselect all
        } else {
            setSelectedIds(new Set(members.map(m => m.id))) // Select all
        }
    }

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    const getAllSelectedMembers = () => {
        if (!data) return []
        const allMembers = [...data.urgent, ...data.upcoming, ...data.missed]
        return allMembers.filter(m => selectedIds.has(m.id) && m.phone) // Only those with phones
    }

    const sendBulkWhatsApp = async () => {
        const membersToSend = getAllSelectedMembers()
        if (membersToSend.length === 0) return

        if (membersToSend.length > 20) {
            // Option B Fallback for > 20 members (Browser Limit)
            setFallbackMembers(membersToSend)
            setShowFallbackList(true)
            return
        }

        // Option A Hybrid: Sequential Auto-Open with Delay
        setIsSending(true)
        setSendProgress(0)

        for (let i = 0; i < membersToSend.length; i++) {
            const member = membersToSend[i]
            const msg = templates.renewalReminder(member.memberName, Math.abs(member.daysOffset), gymName)
            const link = getWhatsAppLink(member.phone, msg)

            // Open in new tab
            window.open(link, '_blank')

            // Update progress
            setSendProgress(i + 1)

            // Wait 800ms before next link to avoid browser popup blockers tripping
            if (i < membersToSend.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 800))
            }
        }

        setTimeout(() => {
            setIsSending(false)
            setSendProgress(0)
            setSelectedIds(new Set()) // Clear selection after sending
        }, 1000)
    }

    const renderTable = (members: RenewalMember[], emptyMessage: string) => {
        if (members.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 border border-dashed rounded-lg bg-slate-50 mt-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-200 mb-3" />
                    <p className="font-medium text-slate-900">{emptyMessage}</p>
                </div>
            )
        }

        const isAllSelected = members.length > 0 &&
            members.every(m => m.phone ? selectedIds.has(m.id) : true) &&
            members.some(m => m.phone); // At least one selectable

        return (
            <div className="border rounded-md mt-4 overflow-x-auto bg-white">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={() => handleSelectAll(members.filter(m => m.phone))}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => {
                            const hasPhone = !!member.phone
                            const isMissed = member.daysOffset < 0
                            const msg = templates.renewalReminder(member.memberName, Math.abs(member.daysOffset), gymName)
                            const link = hasPhone ? getWhatsAppLink(member.phone, msg) : ''

                            return (
                                <TableRow key={member.id} className={selectedIds.has(member.id) ? 'bg-blue-50/50' : ''}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(member.id)}
                                            onCheckedChange={() => toggleSelection(member.id)}
                                            disabled={!hasPhone}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {member.memberName}
                                        <div className="text-xs text-slate-500">{hasPhone ? member.phone : 'No Phone'}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">{member.planName}</TableCell>
                                    <TableCell className="text-sm">
                                        {format(new Date(member.endDate), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`
                                            ${isMissed ? 'text-rose-600 bg-rose-50 border-rose-200' : ''}
                                            ${!isMissed && member.daysOffset <= 7 ? 'text-amber-600 bg-amber-50 border-amber-200' : ''}
                                            ${!isMissed && member.daysOffset > 7 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : ''}
                                        `}>
                                            {isMissed ? `Missed ${Math.abs(member.daysOffset)}d ago` : `Expires in ${member.daysOffset}d`}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {hasPhone ? (
                                            <Button size="sm" variant="outline" className="h-8 gap-1.5" asChild>
                                                <a href={link} target="_blank" rel="noopener noreferrer">
                                                    <Send className="h-3 w-3" /> Remind
                                                </a>
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">No WhatsApp</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        )
    }

    if (isLoading) {
        return (
            <Card className="min-h-[500px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </Card>
        )
    }

    if (isError || !data) {
        return (
            <Card className="min-h-[300px] flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="h-10 w-10 text-rose-500 mb-4" />
                <CardTitle className="mb-2">Failed to load renewals</CardTitle>
                <CardDescription>Could not fetch the renewal data. Please try refreshing.</CardDescription>
            </Card>
        )
    }

    const totalSelected = selectedIds.size

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        Command Center
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        View and manage upcoming and missed membership renewals.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    {totalSelected > 0 && (
                        <div className="flex items-center gap-3 justify-between w-full sm:w-auto p-2 sm:p-0 bg-blue-50 sm:bg-transparent rounded-md border sm:border-0 border-blue-100">
                            <span className="text-sm font-semibold text-blue-700">
                                {totalSelected} selected
                            </span>
                            <Button
                                onClick={sendBulkWhatsApp}
                                disabled={isSending}
                                className="bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm flex items-center gap-2 whitespace-nowrap"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Sending {sendProgress}/{totalSelected}...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Bulk WhatsApp
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {totalSelected > 20 && !showFallbackList && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p>
                        <strong>Note:</strong> You have selected {totalSelected} members. To prevent your browser from blocking popups, sending to more than 20 members will switch to a manual Summary List mode.
                    </p>
                </div>
            )}

            {showFallbackList && fallbackMembers.length > 0 && (
                <Card className="border-amber-200 shadow-md">
                    <CardHeader className="bg-amber-50 pb-4 border-b border-amber-100">
                        <CardTitle className="text-amber-800 flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Bulk WhatsApp Limit Exceeded
                        </CardTitle>
                        <CardDescription className="text-amber-700">
                            You selected {fallbackMembers.length} members. Browsers block opening this many tabs at once. Please click &quot;Send&quot; for each member below.
                        </CardDescription>
                        <Button variant="outline" size="sm" onClick={() => setShowFallbackList(false)} className="mt-2 w-fit">
                            Cancel & Go Back
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                        <div className="divide-y divide-slate-100">
                            {fallbackMembers.map(member => {
                                const msg = templates.renewalReminder(member.memberName, Math.abs(member.daysOffset), gymName)
                                const link = getWhatsAppLink(member.phone, msg)
                                return (
                                    <div key={`fallback-${member.id}`} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                        <div>
                                            <p className="font-semibold text-sm">{member.memberName}</p>
                                            <p className="text-xs text-slate-500">{member.phone}</p>
                                        </div>
                                        <Button size="sm" className="bg-[#25D366] hover:bg-[#128C7E]" asChild>
                                            <a href={link} target="_blank" rel="noopener noreferrer">
                                                <Send className="h-3.5 w-3.5 mr-1.5" /> Send
                                            </a>
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {!showFallbackList && (
                <Card className="border-slate-200 shadow-sm">
                    <Tabs defaultValue="urgent" className="w-full">
                        <CardHeader className="pb-0 border-b border-slate-100">
                            <TabsList className="w-full justify-start h-auto bg-transparent p-0 space-x-6">
                                <TabsTrigger
                                    value="urgent"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-rose-500 data-[state=active]:shadow-none rounded-none py-3 px-1 data-[state=active]:bg-transparent"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-rose-600">Urgent</span>
                                        <Badge variant="secondary" className="bg-rose-100 text-rose-700">{data.summary.urgentCount}</Badge>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="upcoming"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none py-3 px-1 data-[state=active]:bg-transparent"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-blue-600">Upcoming</span>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">{data.summary.upcomingCount}</Badge>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="missed"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-slate-800 data-[state=active]:shadow-none rounded-none py-3 px-1 data-[state=active]:bg-transparent"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-800">Missed</span>
                                        <Badge variant="secondary" className="bg-slate-200 text-slate-800">{data.summary.missedCount}</Badge>
                                    </div>
                                </TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <CardContent className="pt-0 pb-6 px-6">
                            <TabsContent value="urgent" className="mt-0 outline-none">
                                {renderTable(data.urgent, "No urgent renewals in the next 7 days.")}
                            </TabsContent>
                            <TabsContent value="upcoming" className="mt-0 outline-none">
                                {renderTable(data.upcoming, "No upcoming renewals between 8 and 30 days.")}
                            </TabsContent>
                            <TabsContent value="missed" className="mt-0 outline-none">
                                {renderTable(data.missed, "No missed renewals in the past 30 days.")}
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>
            )}
        </div>
    )
}
