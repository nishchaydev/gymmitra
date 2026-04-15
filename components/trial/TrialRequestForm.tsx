'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, ArrowRight, CheckCircle2, Building2, UserCircle2, Sparkles, MapPin, Users, Mail, Phone, Dumbbell } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
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
        acceptTerms: false,
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
        if (!form.acceptTerms) {
            toast.error('You must accept the Terms and Privacy Policy')
            return
        }
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

    // Success state — show confirmation
    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <Card className="w-full max-w-lg mx-auto border-none shadow-[0_32px_80px_-16px_rgba(0,0,0,0.08)] bg-white rounded-[40px] overflow-hidden">
                    <CardContent className="pt-12 pb-10 px-8 text-center space-y-8 relative z-10">
                        <div className="mx-auto w-24 h-24 bg-primary/5 rounded-[28px] flex items-center justify-center relative">
                            <motion.div 
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
                                className="w-16 h-16 bg-primary rounded-[20px] flex items-center justify-center shadow-2xl shadow-primary/30"
                            >
                                <CheckCircle2 className="w-10 h-10 text-white stroke-[2.5px]" />
                            </motion.div>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Welcome to <br/> the Family! 🎉</h2>
                            <p className="text-lg text-slate-500 font-medium">
                                Your <span className="text-primary font-bold">GymMitra Premium</span> access is ready.
                            </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-[28px] p-6 text-left space-y-3">
                            <div className="flex items-center gap-3 text-slate-900">
                                <Mail className="w-5 h-5 text-primary" />
                                <span className="text-base font-bold">Verify Your Email</span>
                            </div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                We&apos;ve sent a magic link to <strong className="text-slate-900">{form.email}</strong>. 
                                Click it to verify your account.
                            </p>
                            <button
                                className="text-primary font-bold hover:text-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2 group text-sm"
                                disabled={isResending}
                                onClick={async () => {
                                    setIsResending(true)
                                    try {
                                        const result = await resendVerificationEmail(form.email)
                                        if (result.success) toast.success('Verification email resent!')
                                        else toast.error(result.error || 'Failed to resend')
                                    } catch {
                                        toast.error('Something went wrong.')
                                    } finally {
                                        setIsResending(false)
                                    }
                                }}
                            >
                                {isResending ? 'Sending...' : "Didn't receive it? Resend"}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <Button asChild className="w-full h-14 text-lg font-bold bg-slate-950 rounded-2xl">
                            <Link href="/">Enter Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        )
    }

    return (
        <Card className="w-full max-w-lg mx-auto border-none shadow-[0_32px_80px_-16px_rgba(0,0,0,0.06)] bg-white rounded-[40px] overflow-hidden">
            <CardHeader className="text-center space-y-4 pt-8 pb-4">
                <div className="mx-auto flex justify-center">
                    <div className="h-14 w-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm">
                        <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                </div>
                <div className="space-y-1 px-6">
                    <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {step === 1 ? 'Tell us about your Gym' : "Let's create your ID"}
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="px-8 pb-10">
                <div className="flex justify-between mb-6 relative">
                    <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 -z-10" />
                    <div 
                        className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500 -z-10" 
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    />
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i}
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-300 ${
                                step >= i ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-white text-slate-400 border-2 border-slate-100'
                            }`}
                        >
                            {i}
                        </div>
                    ))}
                </div>
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="space-y-4"
                        >
                            <div>
                                <Label className="text-[10px] font-bold text-slate-700 ml-1 uppercase tracking-wider mb-1.5 block">Gym Details</Label>
                                <div className="space-y-3">
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                        <Input 
                                            name="gymName"
                                            value={form.gymName}
                                            onChange={handleChange}
                                            placeholder="e.g. Iron Temple Gym"
                                            required
                                            className="h-12 pl-12 bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all font-bold text-slate-900"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                name="city"
                                                value={form.city}
                                                onChange={handleChange}
                                                placeholder="Indore"
                                                required
                                                className="h-12 pl-12 bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all font-bold text-slate-900"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                name="approxMembers"
                                                type="number"
                                                value={form.approxMembers}
                                                onChange={handleChange}
                                                placeholder="Members"
                                                className="h-12 pl-12 bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all font-bold text-slate-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={nextStep}
                                disabled={!form.gymName || !form.city}
                                className="w-full h-12 rounded-2xl font-bold text-lg bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-950/20"
                            >
                                Next Step
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="step2"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <Label className="text-[10px] font-bold text-slate-700 ml-1 uppercase tracking-wider mb-1.5 block">Owner Contact</Label>
                                <div className="space-y-3">
                                    <div className="relative group">
                                        <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                        <Input 
                                            name="ownerName"
                                            value={form.ownerName}
                                            onChange={handleChange}
                                            placeholder="Nishchay Gupta"
                                            required
                                            className="h-12 pl-12 bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all font-bold text-slate-900"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                        <Input 
                                            name="email"
                                            type="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="gym@emitra.dev"
                                            required
                                            className="h-12 pl-12 bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all font-bold text-slate-900"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                        <Input 
                                            name="phone"
                                            type="tel"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="9876543210 (WhatsApp)"
                                            required
                                            pattern="^\d{10}$"
                                            className="h-12 pl-12 bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all font-bold text-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2 pt-2 px-1">
                                <Checkbox 
                                    id="acceptTerms" 
                                    checked={form.acceptTerms}
                                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, acceptTerms: checked as boolean }))}
                                    className="mt-0.5"
                                />
                                <Label htmlFor="acceptTerms" className="text-xs text-slate-500 font-medium leading-snug cursor-pointer">
                                    I confirm I am an authorized gym representative and I agree to the <Link href="/terms" target="_blank" className="text-primary hover:underline font-bold">Terms</Link> & <Link href="/privacy" target="_blank" className="text-primary hover:underline font-bold">Privacy Policy</Link>.
                                </Label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button 
                                    variant="outline"
                                    type="button"
                                    onClick={prevStep}
                                    disabled={isSubmitting}
                                    className="h-12 px-6 rounded-2xl border-slate-200 font-bold transition-all text-sm"
                                >
                                    Back
                                </Button>
                                <Button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 h-12 rounded-2xl font-bold text-lg bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-950/20"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Verify & Start"}
                                </Button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}
