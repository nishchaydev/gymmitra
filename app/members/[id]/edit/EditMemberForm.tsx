'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface Member {
    id: string
    name: string
    email?: string | null
    phone: string
    dateOfBirth: Date | string
    address?: string | null
    status: string
    emergencyName: string
    emergencyPhone: string
    emergencyRelation: string
    notes?: string | null
}

export default function EditMemberForm({ member }: { member: Member }) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        name: member.name,
        email: member.email || '',
        phone: member.phone,
        dateOfBirth: new Date(member.dateOfBirth).toISOString().split('T')[0],
        address: member.address || '',
        status: member.status,
        emergencyName: member.emergencyName,
        emergencyPhone: member.emergencyPhone,
        emergencyRelation: member.emergencyRelation,
        notes: member.notes || '',
    })

    const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/members/${member.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to update member')
            }

            toast.success('Member profile updated!')
            router.push(`/members/${member.id}`)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={form.name} onChange={e => update('name', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" value={form.phone} onChange={e => update('phone', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input id="dob" type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" value={form.address} onChange={e => update('address', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="status">Membership Status</Label>
                            <Select value={form.status} onValueChange={val => update('status', val)}>
                                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">⏳ Pending (Unpaid)</SelectItem>
                                    <SelectItem value="ACTIVE">✅ Active</SelectItem>
                                    <SelectItem value="INACTIVE">⏸ Inactive</SelectItem>
                                    <SelectItem value="EXPIRED">❌ Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="eName">Name</Label>
                            <Input id="eName" value={form.emergencyName} onChange={e => update('emergencyName', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ePhone">Phone</Label>
                            <Input id="ePhone" value={form.emergencyPhone} onChange={e => update('emergencyPhone', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="eRelation">Relation</Label>
                            <Input id="eRelation" value={form.emergencyRelation} onChange={e => update('emergencyRelation', e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent>
                    <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Any additional notes about this member..." rows={3} />
                </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
    )
}
