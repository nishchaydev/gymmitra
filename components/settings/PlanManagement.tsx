'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Plus, Edit2, Trash2, Download } from "lucide-react"

interface Plan {
    id: string
    name: string
    description?: string
    duration: number
    price: number
}

export function PlanManagement() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration: 1,
        price: 0,
    })

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/memberships/plans')
            if (res.ok) {
                const data = await res.json()
                setPlans(data)
            }
        } catch (err) {
            toast.error("Failed to load plans")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPlans()
    }, [])

    const handleSave = async () => {
        if (!formData.name || formData.duration <= 0 || formData.price < 0) {
            toast.error("Please fill in all required fields correctly.")
            return
        }

        setSaving(true)
        try {
            const url = editingId ? `/api/memberships/plans/${editingId}` : '/api/memberships/plans'
            const method = editingId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error("Failed to save plan")

            toast.success(`Plan ${editingId ? 'updated' : 'created'} successfully`)
            setIsFormOpen(false)
            setEditingId(null)
            fetchPlans()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred"
            toast.error(message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this plan? Active memberships might be affected.")) return

        try {
            const res = await fetch(`/api/memberships/plans/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error("Failed to delete plan")

            toast.success("Plan deleted successfully")
            fetchPlans()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred"
            toast.error(message)
        }
    }

    const openEdit = (plan: Plan) => {
        setFormData({
            name: plan.name,
            description: plan.description || '',
            duration: Number(plan.duration),
            price: Number(plan.price)
        })
        setEditingId(plan.id)
        setIsFormOpen(true)
    }

    const openCreate = () => {
        setFormData({ name: '', description: '', duration: 1, price: 0 })
        setEditingId(null)
        setIsFormOpen(true)
    }

    if (loading) return <div className="flex h-32 items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

    if (isFormOpen) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{editingId ? 'Edit Plan' : 'Create New Plan'}</CardTitle>
                    <CardDescription>Configure membership pricing and duration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Plan Name</Label>
                        <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Monthly Gold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Duration (Months)</Label>
                            <Input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Suggested Price (₹)</Label>
                            <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                            <p className="text-[10px] text-muted-foreground">Shown as a reference when adding members. Actual price is set per-member.</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Plan details..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button disabled={saving} onClick={handleSave}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Plan
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Membership Plans</CardTitle>
                    <CardDescription>Manage your gym's membership offerings.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/api/reports/download?type=plans', '_blank')}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Add Plan
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {plans.map(plan => (
                        <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50">
                            <div>
                                <h4 className="font-bold text-slate-900">{plan.name}</h4>
                                <p className="text-sm text-slate-500">{plan.duration} Month{plan.duration !== 1 ? 's' : ''} · Suggested ₹{Number(plan.price).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                                    <Edit2 className="w-4 h-4 text-slate-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {plans.length === 0 && (
                        <div className="text-center p-8 border border-dashed rounded-lg">
                            <p className="text-slate-500">No membership plans found.</p>
                            <Button variant="link" onClick={openCreate} className="mt-2">Create your first plan</Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
