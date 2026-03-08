'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLeads } from '@/hooks/use-leads'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
import {
    UserPlus, Search, Phone, MessageCircle, ArrowRightLeft,
    Plus, X, Calendar, Trash2, Users, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
    { value: '', label: 'All' },
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'INTERESTED', label: 'Interested' },
    { value: 'NOT_INTERESTED', label: 'Not Interested' },
    { value: 'CONVERTED', label: 'Converted' },
] as const

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700 border-blue-200',
    CONTACTED: 'bg-amber-100 text-amber-700 border-amber-200',
    INTERESTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    NOT_INTERESTED: 'bg-drift-200 text-drift-600 border-drift-300',
    CONVERTED: 'bg-primary-50 text-primary-700 border-primary-200',
}

const SOURCE_OPTIONS = ['Walk-in', 'Instagram', 'Facebook', 'Referral', 'Website', 'Other']

export default function LeadsPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params?.slug as string
    const queryClient = useQueryClient()

    const [statusFilter, setStatusFilter] = useState('')
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)

    // Quick add form state
    const [newName, setNewName] = useState('')
    const [newPhone, setNewPhone] = useState('')
    const [newPlanInterest, setNewPlanInterest] = useState('')
    const [newSource, setNewSource] = useState('')

    const { data, isLoading, error } = useLeads({
        status: statusFilter || undefined,
        q: debouncedSearch || undefined,
    })

    // Search debounce
    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timeout)
    }, [search])

    // Create lead mutation
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                let errText = 'Failed to create lead'
                try {
                    const err = await res.json()
                    errText = err.error || errText
                } catch {
                    try { errText = await res.text() || errText } catch { }
                }
                throw new Error(errText)
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] })
            toast.success('Lead added successfully')
            setShowAddForm(false)
            setNewName('')
            setNewPhone('')
            setNewPlanInterest('')
            setNewSource('')
        },
        onError: (err: Error) => toast.error(err.message),
    })

    // Update lead mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, ...data }: { id: string;[key: string]: any }) => {
            const res = await fetch(`/api/leads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                let errText = 'Failed to update lead'
                try {
                    const err = await res.json()
                    errText = err.error || errText
                } catch {
                    try { errText = await res.text() || errText } catch { }
                }
                throw new Error(errText)
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] })
            toast.success('Lead updated')
        },
        onError: (err: Error) => toast.error(err.message),
    })

    // Delete lead mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                let errText = 'Failed to delete lead'
                try {
                    const err = await res.json()
                    errText = err.error || errText
                } catch {
                    try { errText = await res.text() || errText } catch { }
                }
                throw new Error(errText)
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] })
            toast.success('Lead deleted')
        },
        onError: (err: Error) => toast.error(err.message),
    })

    const handleQuickAdd = () => {
        if (!newName.trim() || !newPhone.trim()) {
            toast.error('Name and phone are required')
            return
        }
        createMutation.mutate({
            name: newName.trim(),
            phone: newPhone.trim(),
            planInterest: newPlanInterest || undefined,
            source: newSource || undefined,
        })
    }

    const handleConvert = (lead: any) => {
        // Mark as converted then redirect to new member page with prefilled data
        updateMutation.mutate(
            { id: lead.id, status: 'CONVERTED' },
            {
                onSuccess: () => {
                    const memberParams = new URLSearchParams()
                    if (lead.name) memberParams.set('name', lead.name)
                    if (lead.phone) memberParams.set('phone', lead.phone)
                    if (lead.email) memberParams.set('email', lead.email)
                    router.push(`/${slug}/members/new?${memberParams.toString()}`)
                },
            }
        )
    }

    const handleWhatsApp = (lead: any) => {
        const gymName = String(slug).split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
        const message = templates.leadFollowUp(lead.name, gymName, lead.planInterest || undefined)
        const link = getWhatsAppLink(lead.phone, message)
        window.open(link, '_blank', 'noopener,noreferrer')
    }

    const leads = data?.leads || []

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                        <Users className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">Lead Management</h1>
                        <p className="text-drift-500 text-xs md:text-sm font-medium">
                            Inquiries & Conversions
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    size="sm"
                    className="bg-primary hover:bg-primary-600 text-white font-bold gap-2 shadow-sm rounded-lg h-9 md:h-10 md:px-4"
                >
                    {showAddForm ? <X className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                    <span>{showAddForm ? 'Cancel' : 'Add Lead'}</span>
                </Button>
            </div>

            {/* Quick Add Form */}
            {showAddForm && (
                <Card className="border-drift-200 shadow-sm border-t-4 border-t-primary animate-in slide-in-from-top-2 duration-200">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-slate-900 text-lg">
                            <UserPlus className="w-5 h-5 text-primary" />
                            Quick Add Lead
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="newName" className="text-[10px] font-black text-drift-600 uppercase tracking-wider">Name *</Label>
                                <Input
                                    id="newName"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Rahul Sharma"
                                    className="bg-drift-50 border-drift-200 focus:ring-primary h-11"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="newPhone" className="text-[10px] font-black text-drift-600 uppercase tracking-wider">Phone *</Label>
                                <Input
                                    id="newPhone"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    placeholder="9876543210"
                                    className="bg-drift-50 border-drift-200 focus:ring-primary h-11"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="newPlanInterest" className="text-[10px] font-black text-drift-600 uppercase tracking-wider">Plan Interest</Label>
                                <Input
                                    id="newPlanInterest"
                                    value={newPlanInterest}
                                    onChange={(e) => setNewPlanInterest(e.target.value)}
                                    placeholder="e.g. Gold Monthly"
                                    className="bg-drift-50 border-drift-200 focus:ring-primary h-11"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-drift-600 uppercase tracking-wider">Source</Label>
                                <Select value={newSource} onValueChange={setNewSource}>
                                    <SelectTrigger className="bg-drift-50 border-drift-200 h-11">
                                        <SelectValue placeholder="How they found you" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SOURCE_OPTIONS.map(s => (
                                            <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={handleQuickAdd}
                                disabled={createMutation.isPending || !newName.trim() || !newPhone.trim()}
                                className="bg-primary hover:bg-primary-600 text-white font-bold gap-2 shadow-sm"
                            >
                                <UserPlus className="w-4 h-4" />
                                {createMutation.isPending ? 'Adding...' : 'Add Lead'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-drift-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, phone, email..."
                        className="pl-10 bg-white border-drift-200 h-10 md:h-11 w-full"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={cn(
                                'px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all snap-start border',
                                statusFilter === tab.value
                                    ? 'bg-primary text-white border-primary shadow-md scale-105'
                                    : 'bg-white text-drift-500 border-drift-100 hover:border-drift-300'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            {data && (
                <div className="text-sm text-drift-500 font-medium">
                    Showing {leads.length} of {data.totalCount} leads
                </div>
            )}

            {/* Leads Table */}
            <div className="bg-white rounded-2xl border border-drift-200 overflow-hidden shadow-sm">
                <div className="mt-4">
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <div className="grid grid-cols-12 gap-4 p-4 bg-drift-50/50 border-b border-drift-100 text-[10px] font-black text-drift-500 uppercase tracking-wider">
                            <div className="col-span-3">Lead</div>
                            <div className="col-span-2">Contact</div>
                            <div className="col-span-2">Interest</div>
                            <div className="col-span-1">Source</div>
                            <div className="col-span-1">Status</div>
                            <div className="col-span-1">Follow-up</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>

                        {isLoading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-drift-400 font-medium">Loading your leads...</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center border-rose-100 bg-rose-50/30">
                                <X className="w-12 h-12 text-rose-300 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-rose-900 mb-2">Error Loading Leads</h3>
                                <p className="text-sm text-rose-600 mb-6 font-medium">{(error as any).details || error.message}</p>
                                <Button
                                    variant="outline"
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['leads'] })}
                                    className="rounded-full border-rose-200 text-rose-700 font-bold"
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : leads.length === 0 ? (
                            <div className="p-12 text-center space-y-6">
                                <div className="w-20 h-20 rounded-3xl bg-drift-50 flex items-center justify-center mx-auto shadow-inner border border-white">
                                    <Users className="w-10 h-10 text-drift-300" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">No leads captured yet.</h3>
                                    <p className="text-drift-500 text-sm font-medium italic">Your gym growth starts here.</p>
                                </div>
                                <Button
                                    onClick={() => setShowAddForm(true)}
                                    className="bg-primary hover:bg-primary-600 text-white font-black uppercase tracking-widest text-[10px] px-8 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Your First Lead
                                </Button>
                            </div>
                        ) : (
                            leads.map((lead: any) => (
                                <div
                                    key={lead.id}
                                    className="grid grid-cols-12 gap-4 p-4 border-b border-drift-50 hover:bg-drift-50/10 transition-colors items-center"
                                >
                                    {/* Name */}
                                    <div className="col-span-3">
                                        <p className="font-black text-slate-900 text-sm">{lead.name}</p>
                                        {lead.email && (
                                            <p className="text-[10px] text-drift-400 truncate font-bold uppercase tracking-tight">{lead.email}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="col-span-2 flex items-center gap-2">
                                        <span className="text-xs text-drift-600 font-bold">{lead.phone}</span>
                                    </div>

                                    {/* Plan Interest */}
                                    <div className="col-span-2 flex items-center gap-2">
                                        {lead.planInterest ? (
                                            <span className="text-xs text-slate-600 font-bold truncate">{lead.planInterest}</span>
                                        ) : (
                                            <span className="text-xs text-drift-200">—</span>
                                        )}
                                    </div>

                                    {/* Source */}
                                    <div className="col-span-1">
                                        {lead.source ? (
                                            <span className="text-[10px] font-black text-drift-400 uppercase tracking-widest bg-drift-50 px-1.5 py-0.5 rounded">{lead.source}</span>
                                        ) : (
                                            <span className="text-xs text-drift-200">—</span>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1">
                                        <Select
                                            value={lead.status}
                                            onValueChange={(val) => updateMutation.mutate({ id: lead.id, status: val })}
                                        >
                                            <SelectTrigger className={cn(
                                                'h-7 text-[10px] font-black uppercase border rounded-full px-2 w-fit min-w-[90px] shadow-none',
                                                STATUS_COLORS[lead.status] || 'bg-gray-100'
                                            )}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NEW">New</SelectItem>
                                                <SelectItem value="CONTACTED">Contacted</SelectItem>
                                                <SelectItem value="INTERESTED">Interested</SelectItem>
                                                <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                                                <SelectItem value="CONVERTED">Converted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Follow-up Date */}
                                    <div className="col-span-1">
                                        <Input
                                            type="date"
                                            defaultValue={lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    updateMutation.mutate({
                                                        id: lead.id,
                                                        followUpDate: e.target.value,
                                                    })
                                                }
                                            }}
                                            className="h-7 text-[10px] font-black bg-drift-50 border-transparent px-2 w-28 rounded-lg"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleWhatsApp(lead)}
                                            className="h-9 w-9 text-green-600 hover:bg-green-50 rounded-full"
                                            title="WhatsApp"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                        </Button>

                                        {lead.status !== 'CONVERTED' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleConvert(lead)}
                                                className="h-8 text-[10px] font-black uppercase tracking-wider text-primary border-primary/20 hover:bg-primary hover:text-white px-3 rounded-full"
                                            >
                                                Convert
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm('Delete this lead?')) {
                                                    deleteMutation.mutate(lead.id)
                                                }
                                            }}
                                            className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-full"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Mobile View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden p-4">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-drift-400 font-bold uppercase tracking-widest text-[10px]">Syncing Leads...</p>
                            </div>
                        ) : error ? (
                            <Card className="p-8 text-center border-rose-100 bg-rose-50/30">
                                <X className="w-10 h-10 text-rose-300 mx-auto mb-4" />
                                <p className="text-sm text-rose-900 font-black uppercase mb-4">Sync Failed</p>
                                <Button
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['leads'] })}
                                    className="rounded-xl bg-white border border-rose-200 text-rose-700 font-bold w-full"
                                >
                                    Retry Now
                                </Button>
                            </Card>
                        ) : leads.length === 0 ? (
                            <div className="py-12 bg-drift-50/50 rounded-3xl border-2 border-dashed border-drift-100 text-center px-6">
                                <Users className="h-12 w-12 text-drift-200 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-slate-900">Zero Leads Found</h3>
                                <p className="text-sm text-drift-500 font-medium mb-8">Ready to grow your gym? Add your first inquiry.</p>
                                <Button
                                    onClick={() => setShowAddForm(true)}
                                    className="w-full bg-primary text-white font-black py-6 rounded-2xl shadow-lg"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> CREATE LEAD
                                </Button>
                            </div>
                        ) : (
                            leads.map((lead: any) => (
                                <Card
                                    key={lead.id}
                                    className="overflow-hidden border-2 border-slate-100 shadow-sm rounded-2xl active:scale-[0.98] transition-transform"
                                >
                                    <div className="p-4 bg-white">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-black text-slate-900 text-lg leading-tight mb-1">{lead.name}</h3>
                                                <div className="flex items-center gap-2 text-drift-500">
                                                    <Phone className="w-3 h-3" />
                                                    <span className="text-xs font-bold">{lead.phone}</span>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "text-[10px] font-black uppercase px-2 h-6 shadow-none rounded-lg",
                                                STATUS_COLORS[lead.status] || 'bg-gray-100'
                                            )} variant="outline">
                                                {lead.status}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 p-3 bg-drift-50/50 rounded-xl mb-4 border border-drift-100">
                                            <div>
                                                <p className="text-[9px] font-black text-drift-400 uppercase tracking-widest">Interest</p>
                                                <p className="text-xs font-bold text-slate-700 truncate">{lead.planInterest || 'Unspecified'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-drift-400 uppercase tracking-widest">Source</p>
                                                <p className="text-xs font-bold text-slate-700 truncate">{lead.source || 'Direct'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleWhatsApp(lead)}
                                                    className="h-10 w-10 bg-green-50 text-green-600 rounded-xl"
                                                >
                                                    <MessageCircle className="w-5 h-5" />
                                                </Button>
                                                {lead.status !== 'CONVERTED' && (
                                                    <Button
                                                        onClick={() => handleConvert(lead)}
                                                        className="h-10 bg-primary/10 text-primary font-black uppercase text-[10px] px-4 rounded-xl border border-primary/20"
                                                    >
                                                        Convert
                                                    </Button>
                                                )}
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => confirm('Delete?') && deleteMutation.mutate(lead.id)}
                                                className="h-10 w-10 text-rose-300"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
