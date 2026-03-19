'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, ArrowRight, CheckCircle2, ChevronLeft, Building2, UserCircle2, Sparkles } from 'lucide-react'
import { GymMitraLogo } from '@/components/brand/GymMitraLogo'
import { createTrialGym } from '@/app/actions/trial'
import { resendVerificationEmail } from '@/app/actions/auth'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function TrialRequestForm() {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState<{ slug: string } | null>(null)
    const [isResending, setIsResending] = useState(false)
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

    const nextStep = () => {
        if (step === 1) {
            if (!form.gymName || !form.city) {
                toast.error('Please fill in gym name and city')
                return
            }
            setStep(2)
        }
    }

    const prevStep = () => setStep(1)

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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-lg mx-auto shadow-2xl border-border/50 glass-card rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles className="w-24 h-24 text-primary" />
                    </div>
                    
                    <CardContent className="pt-12 pb-10 px-8 text-center space-y-8 relative z-10">
                        <div className="mx-auto w-24 h-24 bg-ocean-50/50 rounded-full flex items-center justify-center relative">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                                className="w-16 h-16 bg-ocean rounded-full flex items-center justify-center shadow-lg shadow-ocean/30"
                            >
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </motion.div>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-2 border-dashed border-ocean/20 rounded-full"
                            />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">You&apos;re All Set! 🎉</h2>
                            <p className="text-lg text-muted-foreground">
                                Your 30-day <span className="text-primary font-semibold">Premium</span> trial is now active.
                            </p>
                        </div>

                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-sm text-left space-y-3 relative overflow-hidden group">
                           <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <p className="font-bold text-slate-900 flex items-center gap-2">
                                <span className="text-lg">📧</span> Confirm your email address
                            </p>
                            <p className="text-slate-600 leading-relaxed">
                                We&apos;ve sent a magic link to <strong className="text-midnight">{form.email}</strong>. 
                                Click it to verify your account and receive your access credentials.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Button asChild className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 rounded-xl premium-gradient">
                                <Link href="/">
                                    Go to Dashboard
                                </Link>
                            </Button>
                            
                            <p className="text-xs text-muted-foreground">
                                Didn&apos;t receive it?{' '}
                                <button
                                    className="text-primary font-semibold hover:underline disabled:opacity-50"
                                    disabled={isResending}
                                    onClick={async () => {
                                        setIsResending(true)
                                        try {
                                            const email = form.email
                                            const result = await resendVerificationEmail(email)
                                            if (result.success) {
                                                toast.success('Verification email resent! Check your inbox.')
                                            } else {
                                                toast.error(result.error || 'Failed to resend email')
                                            }
                                        } catch {
                                            toast.error('Something went wrong. Please try again.')
                                        } finally {
                                            setIsResending(false)
                                        }
                                    }}
                                >
                                    {isResending ? 'Sending...' : 'Resend Verification'}
                                </button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        )
    }

    return (
        <Card className="w-full max-w-lg mx-auto shadow-2xl border-border/50 glass-card rounded-3xl overflow-hidden">
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100 flex">
                <motion.div 
                    initial={{ width: "50%" }}
                    animate={{ width: step === 1 ? "50%" : "100%" }}
                    className="h-full bg-primary"
                />
            </div>

            <CardHeader className="text-center space-y-4 pt-10 pb-6">
                <div className="mx-auto relative group">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                    <GymMitraLogo showText={false} iconClassName="p-3 w-16 h-16 relative bg-white rounded-2xl shadow-sm border border-border" />
                </div>
                <div className="space-y-2">
                    <CardTitle className="text-3xl font-bold tracking-tight text-midnight">
                        {step === 1 ? 'Gym Details' : 'Owner Details'}
                    </CardTitle>
                    <CardDescription className="text-lg">
                        {step === 1 
                            ? 'Tell us about your fitness center'
                            : 'Personalize your management account'}
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="px-8 pb-10">
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-5"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="gymName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary" /> Gym Name
                                </Label>
                                <Input
                                    id="gymName"
                                    name="gymName"
                                    value={form.gymName}
                                    onChange={handleChange}
                                    placeholder="e.g. Iron Paradise Gym"
                                    required
                                    className="h-12 bg-white/50 border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-sm font-semibold text-slate-700">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        placeholder="Jaipur"
                                        required
                                        className="h-12 bg-white/50 border-slate-200 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="approxMembers" className="text-sm font-semibold text-slate-700">Members</Label>
                                    <Input
                                        id="approxMembers"
                                        name="approxMembers"
                                        type="number"
                                        value={form.approxMembers}
                                        onChange={handleChange}
                                        placeholder="100+"
                                        className="h-12 bg-white/50 border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>

                            <Button 
                                type="button" 
                                onClick={nextStep}
                                className="w-full h-14 text-lg font-bold rounded-xl mt-4 shadow-lg shadow-primary/20 bg-primary hover:bg-primary-600 group"
                            >
                                Continue <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="ownerName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <UserCircle2 className="w-4 h-4 text-primary" /> Your Full Name
                                </Label>
                                <Input
                                    id="ownerName"
                                    name="ownerName"
                                    value={form.ownerName}
                                    onChange={handleChange}
                                    placeholder="Nishchay Gupta"
                                    required
                                    className="h-12 bg-white/50 border-slate-200 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Business Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="owner@gymname.com"
                                    required
                                    className="h-12 bg-white/50 border-slate-200 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">WhatsApp Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="9876543210"
                                    required
                                    pattern="^\d{10}$"
                                    className="h-12 bg-white/50 border-slate-200 rounded-xl"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={prevStep}
                                    className="h-14 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-1" /> Back
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="flex-1 h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 premium-gradient"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Activate Free Trial →'
                                    )}
                                </Button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}
