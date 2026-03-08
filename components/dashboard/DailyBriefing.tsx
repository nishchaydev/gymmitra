'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, BellRing, PhoneCall, AlertTriangle, IndianRupee, Clock, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'

interface DailyBriefingProps {
    slug: string
    ownerName: string
    urgentRenewals: { id: string, name: string, planName: string, daysLeft: number }[]
    followUps: { id: string, name: string, phone: string, planInterest: string | null }[]
    partialPayments: { id: string, memberName: string, amountDue: number, invoiceNumber: string }[]
    overdueInvoices: { id: string, name: string, amount: number }[]
    lowStockItems: { id: string, name: string, stock: number, category: string }[]
}

export function DailyBriefing({
    slug,
    ownerName,
    urgentRenewals,
    followUps,
    partialPayments,
    overdueInvoices,
    lowStockItems
}: DailyBriefingProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>(null)

    const sections = []

    if (urgentRenewals.length > 0) {
        sections.push({
            id: 'renewals',
            title: 'Urgent Renewals',
            description: `${urgentRenewals.length} memberships expire today or tomorrow`,
            icon: AlertTriangle,
            colorClass: 'text-rose-600',
            bgClass: 'bg-rose-50',
            borderColor: 'border-rose-200',
            count: urgentRenewals.length,
            link: `/${slug}/renewals`,
            content: (
                <div className="space-y-3 mt-3 ml-11">
                    {urgentRenewals.slice(0, 3).map(r => (
                        <div key={r.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                            <div>
                                <p className="font-medium text-slate-800">{r.name}</p>
                                <p className="text-xs text-slate-500">{r.planName}</p>
                            </div>
                            <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">
                                {r.daysLeft === 0 ? 'Today' : 'Tomorrow'}
                            </Badge>
                        </div>
                    ))}
                    {urgentRenewals.length > 3 && (
                        <p className="text-xs text-slate-500 font-medium pt-1">+ {urgentRenewals.length - 3} more members</p>
                    )}
                </div>
            )
        })
    }

    if (followUps.length > 0) {
        sections.push({
            id: 'followups',
            title: 'Follow-ups Due Today',
            description: `${followUps.length} leads to contact today`,
            icon: PhoneCall,
            colorClass: 'text-blue-600',
            bgClass: 'bg-blue-50',
            borderColor: 'border-blue-200',
            count: followUps.length,
            link: `/${slug}/leads`,
            content: (
                <div className="space-y-3 mt-3 ml-11">
                    {followUps.slice(0, 3).map(l => (
                        <div key={l.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                            <div>
                                <p className="font-medium text-slate-800">{l.name} <span className="text-slate-400 text-xs ml-1">{l.phone}</span></p>
                                {l.planInterest && <p className="text-xs text-slate-500">Interested in: {l.planInterest}</p>}
                            </div>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-green-500 text-green-700 hover:bg-green-50" onClick={() => {
                                const link = getWhatsAppLink(l.phone, templates.leadFollowUp(l.name, ownerName, l.planInterest || undefined))
                                window.open(link, '_blank', 'noopener,noreferrer')
                            }}>
                                WhatsApp
                            </Button>
                        </div>
                    ))}
                    {followUps.length > 3 && (
                        <p className="text-xs text-slate-500 font-medium pt-1">+ {followUps.length - 3} more leads</p>
                    )}
                </div>
            )
        })
    }

    if (partialPayments.length > 0) {
        sections.push({
            id: 'partial',
            title: 'Partial Payments Due',
            description: `${partialPayments.length} members with outstanding balances`,
            icon: IndianRupee,
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50',
            borderColor: 'border-amber-200',
            count: partialPayments.length,
            link: `/${slug}/invoices?filter=partial`,
            content: (
                <div className="space-y-3 mt-3 ml-11">
                    {partialPayments.slice(0, 3).map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                            <div>
                                <p className="font-medium text-slate-800">{p.memberName}</p>
                                <p className="text-xs text-slate-500">Inv: {p.invoiceNumber}</p>
                            </div>
                            <span className="font-bold text-slate-700">₹{p.amountDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} due</span>
                        </div>
                    ))}
                    {partialPayments.length > 3 && (
                        <p className="text-xs text-slate-500 font-medium pt-1">+ {partialPayments.length - 3} more pending</p>
                    )}
                </div>
            )
        })
    }

    if (overdueInvoices.length > 0) {
        sections.push({
            id: 'overdue',
            title: 'Overdue Invoices',
            description: `${overdueInvoices.length} invoices are marked overdue`,
            icon: Clock,
            colorClass: 'text-orange-600',
            bgClass: 'bg-orange-50',
            borderColor: 'border-orange-200',
            count: overdueInvoices.length,
            link: `/${slug}/invoices?filter=overdue`,
            content: (
                <div className="space-y-3 mt-3 ml-11">
                    {overdueInvoices.slice(0, 3).map(i => (
                        <div key={i.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                            <p className="font-medium text-slate-800">{i.name}</p>
                            <span className="font-bold text-slate-700">₹{i.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                    ))}
                    {overdueInvoices.length > 3 && (
                        <p className="text-xs text-slate-500 font-medium pt-1">+ {overdueInvoices.length - 3} more overdue</p>
                    )}
                </div>
            )
        })
    }

    const outOfStockCount = lowStockItems.filter(i => i.stock <= 0).length
    if (lowStockItems.length > 0) {
        sections.push({
            id: 'stock',
            title: 'Low Stock Alert',
            description: `${lowStockItems.length} products low on stock${outOfStockCount > 0 ? `, ${outOfStockCount} out of stock` : ''}`,
            icon: BellRing,
            colorClass: 'text-purple-600',
            bgClass: 'bg-purple-50',
            borderColor: 'border-purple-200',
            count: lowStockItems.length,
            link: `/${slug}/products`,
            content: (
                <div className="space-y-3 mt-3 ml-11">
                    {lowStockItems.slice(0, 3).map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                            <div>
                                <p className="font-medium text-slate-800">{p.name}</p>
                                <p className="text-xs text-slate-500">{p.category}</p>
                            </div>
                            <Badge variant="outline" className={p.stock <= 0 ? "border-rose-300 text-rose-700 bg-rose-50" : "border-amber-300 text-amber-700 bg-amber-50"}>
                                {p.stock <= 0 ? 'Out of Stock' : `${p.stock} left`}
                            </Badge>
                        </div>
                    ))}
                    {lowStockItems.length > 3 && (
                        <p className="text-xs text-slate-500 font-medium pt-1">+ {lowStockItems.length - 3} more products</p>
                    )}
                </div>
            )
        })
    }


    if (sections.length === 0) {
        return (
            <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-900 text-lg">All clear for today, {ownerName}!</h3>
                            <p className="text-emerald-700 text-sm">No urgent renewals, follow-ups, or payments due.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
                            <BellRing className="h-5 w-5 text-primary" />
                            Daily Briefing
                        </CardTitle>
                        <p suppressHydrationWarning className="text-sm text-slate-500 font-medium mt-1">Operational focus for {format(new Date(), 'EEEE, MMMM d')}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="bg-white border rounded-lg px-3 py-2 flex flex-col min-w-[80px] shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Renewals</span>
                            <span className="text-lg font-black text-rose-600">{urgentRenewals.length}</span>
                        </div>
                        <div className="bg-white border rounded-lg px-3 py-2 flex flex-col min-w-[80px] shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Follow-ups</span>
                            <span className="text-lg font-black text-blue-600">{followUps.length}</span>
                        </div>
                        <div className="bg-white border rounded-lg px-3 py-2 flex flex-col min-w-[80px] shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Payments</span>
                            <span className="text-lg font-black text-amber-600">{partialPayments.length + overdueInvoices.length}</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <div className="divide-y divide-slate-100">
                {sections.map(section => {
                    const isExpanded = expandedSection === section.id
                    return (
                        <div key={section.id} className={`transition-colors ${isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
                            {/* Header row */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer select-none"
                                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${section.bgClass} ${section.colorClass} border ${section.borderColor}`}>
                                        <section.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 text-sm">{section.title}</h4>
                                        <p className="text-xs text-slate-500">{section.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                        <Button size="sm" variant="secondary" className="h-8 text-xs font-medium" asChild>
                                            <Link href={section.link} onClick={(e) => e.stopPropagation()}>
                                                Take Action <ArrowRight className="ml-1.5 h-3 w-3" />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="font-bold">{section.count}</Badge>
                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                        </div>
                                    )}
                                    {isExpanded && <ChevronUp className="h-4 w-4 text-slate-400" />}
                                </div>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div className="px-4 pb-5 pt-0 animate-in slide-in-from-top-2">
                                    {section.content}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}
