'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Save, Trash2 } from 'lucide-react'

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
    pincode?: string | null
    state?: string | null
    city?: string | null
    notes?: string | null
}

export default function EditMemberForm({ member, gymSlug }: { member: Member, gymSlug: string }) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const safeDate = member.dateOfBirth ? new Date(member.dateOfBirth) : null
    const initialDate = safeDate && !isNaN(safeDate.getTime()) ? safeDate.toISOString().split('T')[0] : ''

    const [form, setForm] = useState({
        name: member.name,
        email: member.email || '',
        phone: member.phone,
        dateOfBirth: initialDate,
        address: member.address || '',
        status: member.status,
        emergencyName: member.emergencyName || '',
        emergencyPhone: member.emergencyPhone || '',
        emergencyRelation: member.emergencyRelation || '',
        pincode: member.pincode || '',
        state: member.state || '',
        city: member.city || '',
        notes: member.notes || '',
    })

    const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

    useEffect(() => {
        const fetchPincodeDetails = async () => {
            if (form.pincode && form.pincode.length === 6) {
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`);
                    const data = await res.json();
                    if (data && data[0] && data[0].Status === 'Success') {
                        const postOffice = data[0].PostOffice[0];
                        setForm(f => ({ ...f, state: postOffice.State, city: postOffice.District }));
                    }
                } catch (error) {
                    console.warn("Failed to fetch pincode details (API may be down or blocked):", error);
                }
            }
        };

        const timeoutId = setTimeout(() => {
            fetchPincodeDetails();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [form.pincode]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) return

        setSaving(true)
        try {
            const res = await fetch(`/api/members/${member.id}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to delete member')
            }

            toast.success('Member deleted successfully')
            router.push(`/${gymSlug}/members`)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'An error occurred while deleting')
            setSaving(false)
        }
    }

    const handleSave = async () => {
        if (!form.name.trim() || !form.phone.trim()) {
            toast.error('Name and Phone are required')
            return
        }
        if (!form.emergencyName?.trim() || !form.emergencyPhone?.trim() || !form.emergencyRelation?.trim()) {
            toast.error('Emergency contact information is required')
            return
        }

        setSaving(true)
        try {
            const res = await fetch(`/api/members/${member.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            if (!res.ok) {
                let errMessage = 'Failed to update member'
                try {
                    const clonedRes = res.clone()
                    const err = await clonedRes.json()
                    errMessage = err.error || errMessage
                } catch {
                    const text = await res.text()
                    errMessage = `HTTP ${res.status}: ${text || errMessage}`
                }
                throw new Error(errMessage)
            }

            toast.success('Member profile updated!')
            router.push(`/${gymSlug}/members/${member.id}`)
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={e => {
                                    const val = e.target.value;
                                    const formatted = val
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ');
                                    update('name', formatted);
                                }}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Mobile Number</Label>
                            <Input id="phone" value={form.phone} onChange={e => update('phone', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input id="dob" type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" value={form.address} onChange={e => update('address', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input id="pincode" maxLength={6} value={form.pincode} onChange={e => update('pincode', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="state">State</Label>
                            <Select value={form.state || undefined} onValueChange={val => update('state', val)}>
                                <SelectTrigger id="state"><SelectValue placeholder="Select state" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                                    <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                                    <SelectItem value="Assam">Assam</SelectItem>
                                    <SelectItem value="Bihar">Bihar</SelectItem>
                                    <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                                    <SelectItem value="Delhi">Delhi</SelectItem>
                                    <SelectItem value="Goa">Goa</SelectItem>
                                    <SelectItem value="Gujarat">Gujarat</SelectItem>
                                    <SelectItem value="Haryana">Haryana</SelectItem>
                                    <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                                    <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                                    <SelectItem value="Karnataka">Karnataka</SelectItem>
                                    <SelectItem value="Kerala">Kerala</SelectItem>
                                    <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                                    <SelectItem value="Manipur">Manipur</SelectItem>
                                    <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                                    <SelectItem value="Mizoram">Mizoram</SelectItem>
                                    <SelectItem value="Nagaland">Nagaland</SelectItem>
                                    <SelectItem value="Odisha">Odisha</SelectItem>
                                    <SelectItem value="Punjab">Punjab</SelectItem>
                                    <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                                    <SelectItem value="Sikkim">Sikkim</SelectItem>
                                    <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                                    <SelectItem value="Telangana">Telangana</SelectItem>
                                    <SelectItem value="Tripura">Tripura</SelectItem>
                                    <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                                    <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                                    <SelectItem value="West Bengal">West Bengal</SelectItem>
                                    {form.state && !["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"].includes(form.state) && (
                                        <SelectItem value={form.state}>{form.state}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" value={form.city} onChange={e => update('city', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="flex gap-4 pt-4">
                <Button variant="destructive" type="button" onClick={handleDelete} disabled={saving} className="w-1/3" size="lg">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
                <Button onClick={handleSave} disabled={saving} className="w-2/3" size="lg">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div >
    )
}
