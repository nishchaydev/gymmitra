'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { adminCreateTrialGym } from '@/app/actions/trial'

export default function ManualTrialGenerator() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{
        slug?: string
        tempPassword?: string
        email?: string
    } | null>(null)

    const [form, setForm] = useState({
        gymName: '',
        ownerName: '',
        email: '',
        phone: '',
        city: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copied!`)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setResult(null)

        try {
            const res = await adminCreateTrialGym(form)
            if (res.success) {
                setResult({
                    slug: res.slug,
                    tempPassword: res.tempPassword,
                    email: form.email,
                })
                toast.success('Trial gym created!')
            } else {
                toast.error(res.error)
            }
        } catch {
            toast.error('Failed to create trial gym.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="max-w-lg">
            <CardHeader>
                <CardTitle className="text-lg">Manual Trial Onboard</CardTitle>
                <CardDescription>Create a trial gym account for a new owner. They&apos;ll receive an email + WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="mt-gymName">Gym Name</Label>
                            <Input id="mt-gymName" name="gymName" value={form.gymName} onChange={handleChange} required minLength={2} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="mt-ownerName">Owner Name</Label>
                            <Input id="mt-ownerName" name="ownerName" value={form.ownerName} onChange={handleChange} required minLength={2} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="mt-email">Email</Label>
                        <Input id="mt-email" name="email" type="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="mt-phone">Phone</Label>
                            <Input id="mt-phone" name="phone" type="tel" inputMode="numeric" value={form.phone} onChange={handleChange} required pattern="^\d{10}$" maxLength={10} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="mt-city">City</Label>
                            <Input id="mt-city" name="city" value={form.city} onChange={handleChange} required minLength={2} />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Trial Gym'}
                    </Button>
                </form>

                {result && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-semibold">Trial Created</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Email:</span>
                                <div className="flex items-center gap-1">
                                    <code className="bg-white px-2 py-0.5 rounded text-xs">{result.email}</code>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(result.email!, 'Email')}>
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Temp Password:</span>
                                <div className="flex items-center gap-1">
                                    <code className="bg-white px-2 py-0.5 rounded text-xs font-mono">{result.tempPassword}</code>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(result.tempPassword!, 'Password')}>
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Slug:</span>
                                <code className="bg-white px-2 py-0.5 rounded text-xs">{result.slug}</code>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">Share the email + temp password with the gym owner via WhatsApp.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
