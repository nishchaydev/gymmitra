'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { GymMitraLogo } from '@/components/brand/GymMitraLogo'
import { createTrialGym } from '@/app/actions/trial'
import Link from 'next/link'

export default function TrialRequestForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState<{ slug: string } | null>(null)
    const [form, setForm] = useState({
        gymName: '',
        ownerName: '',
        email: '',
        phone: '',
        city: '',
        approxMembers: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const result = await createTrialGym({
                gymName: form.gymName,
                ownerName: form.ownerName,
                email: form.email,
                phone: form.phone,
                city: form.city,
                approxMembers: form.approxMembers ? Number(form.approxMembers) : undefined,
            })

            if (result.success) {
                setSuccess({ slug: result.slug })
                toast.success('Trial created successfully!')
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Success state — show confirmation instead of redirecting to onboarding
    if (success) {
        return (
            <Card className="w-full max-w-md mx-auto shadow-xl border border-border bg-white">
                <CardContent className="pt-8 pb-6 px-6 text-center space-y-5">
                    <div className="mx-auto w-16 h-16 bg-ocean-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-ocean" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re All Set! 🎉</h2>
                        <p className="text-muted-foreground">
                            Your <strong>30-day free trial</strong> has been activated.
                        </p>
                    </div>
                    <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-left space-y-1">
                        <p className="font-semibold text-slate-900">📧 Check your email to verify your account</p>
                        <p className="text-muted-foreground">
                            We&apos;ve sent a verification link to <strong>{form.email}</strong>. Please verify your email to receive your login credentials.
                        </p>
                    </div>
                    <Button asChild variant="outline" className="w-full h-12 text-base font-semibold">
                        <Link href="/">
                            Back to Home
                        </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground pt-2">
                        Don&apos;t see the email? Check your spam folder.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md mx-auto shadow-xl border border-border bg-white">
            <CardHeader className="text-center space-y-3 pb-2">
                <div className="mx-auto">
                    <GymMitraLogo showText={false} iconClassName="p-2.5 w-14 h-14" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Start Your Free Trial</CardTitle>
                <CardDescription className="text-base">
                    30 days free · No credit card · Full access
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="gymName">Gym Name</Label>
                        <Input
                            id="gymName"
                            name="gymName"
                            value={form.gymName}
                            onChange={handleChange}
                            placeholder="e.g. Fit India Gym"
                            required
                            minLength={2}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="ownerName">Owner Name</Label>
                        <Input
                            id="ownerName"
                            name="ownerName"
                            value={form.ownerName}
                            onChange={handleChange}
                            placeholder="e.g. Nishchay Gupta"
                            required
                            minLength={2}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                            className="h-11"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone (WhatsApp)</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                inputMode="numeric"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="9876543210"
                                required
                                pattern="^\d{10}$"
                                maxLength={10}
                                title="10-digit mobile number"
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                placeholder="e.g. Jaipur"
                                required
                                minLength={2}
                                className="h-11"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="approxMembers">
                            Approx. Members <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Input
                            id="approxMembers"
                            name="approxMembers"
                            type="number"
                            inputMode="numeric"
                            value={form.approxMembers}
                            onChange={handleChange}
                            placeholder="e.g. 150"
                            min={1}
                            max={10000}
                            className="h-11"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary-600 shadow-lg shadow-primary/20"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Setting up your gym...
                            </>
                        ) : (
                            'Start Free Trial →'
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground pt-1">
                        By signing up you agree to our Terms of Service.
                        <br />
                        We&apos;ll send a verification link to your email.
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}
