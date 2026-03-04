'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Building2, MapPin, Contact, CreditCard, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { completeOnboarding } from './actions'

const steps = [
    { title: 'Business Info', icon: Building2 },
    { title: 'Location', icon: MapPin },
    { title: 'Contact', icon: Contact },
    { title: 'Membership Plans', icon: CheckCircle2 },
    { title: 'Invoice Setup', icon: CreditCard },
]

export default function OnboardingForm() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        businessName: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        upiId: '',
        invoicePrefix: '',
        plans: [
            { name: 'Monthly', durationMonths: 1, price: 1500, enabled: true },
            { name: 'Quarterly', durationMonths: 3, price: 4000, enabled: true },
            { name: 'Half-Yearly', durationMonths: 6, price: 7500, enabled: false },
            { name: 'Yearly', durationMonths: 12, price: 14000, enabled: true },
        ]
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const togglePlan = (index: number) => {
        setFormData(prev => {
            const newPlans = [...prev.plans]
            newPlans[index] = { ...newPlans[index], enabled: !newPlans[index].enabled }
            return { ...prev, plans: newPlans }
        })
    }

    const updatePlanPrice = (index: number, price: string) => {
        setFormData(prev => {
            const newPlans = [...prev.plans]
            const parsedPrice = parseInt(price, 10) || 0
            newPlans[index] = { ...newPlans[index], price: Math.max(0, parsedPrice) }
            return { ...prev, plans: newPlans }
        })
    }

    const nextStep = () => {
        const form = document.querySelector('form')
        if (currentStep === 3 && !formData.plans.some(p => p.enabled)) {
            toast.error("Please select at least one membership plan to continue.")
            return
        }
        if (form && form.reportValidity()) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
        }
    }
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (currentStep < steps.length - 1) {
            nextStep()
            return
        }

        setIsSubmitting(true)

        // 1. Call server action
        let result: { redirectTo: string; warnings?: string[] }
        try {
            const submissionData = new FormData()
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'plans') {
                    submissionData.append(key, JSON.stringify(value))
                } else {
                    submissionData.append(key, value as string)
                }
            })
            result = await completeOnboarding(submissionData)
        } catch (error) {
            console.error("Onboarding failed:", error)
            toast.error(error instanceof Error ? error.message : "Something went wrong. Please check your inputs.")
            setIsSubmitting(false)
            return
        }

        // 2. Validate response and navigate
        if (!result?.redirectTo) {
            toast.error("Onboarding saved, but we couldn't determine where to redirect. Please go to your dashboard manually.")
            setIsSubmitting(false)
            return
        }

        // Surface any non-fatal warnings (e.g. plan creation failed)
        if (result.warnings?.length) {
            result.warnings.forEach(w => toast.warning(w))
        }

        try {
            toast.success('Onboarding complete! Redirecting...')
            router.push(result.redirectTo)
        } catch (navError) {
            console.error("Navigation failed:", navError)
            toast.error("Your profile was saved but navigation failed. Please refresh or go to your dashboard.")
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl overflow-hidden">
                <div className="bg-primary/5 p-6 border-b">
                    <div className="flex justify-between items-center mb-6">
                        {steps.map((step, idx) => {
                            const Icon = step.icon
                            const isActive = idx === currentStep
                            const isCompleted = idx < currentStep
                            return (
                                <div key={step.title} className="flex flex-col items-center gap-2 relative">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 z-10 ${isActive ? 'bg-primary text-white scale-110 shadow-lg' :
                                        isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-wider font-bold ${isActive ? 'text-primary' : 'text-slate-400'
                                        }`}>
                                        {step.title}
                                    </span>
                                    {idx < steps.length - 1 && (
                                        <div className={`absolute top-5 left-10 w-full h-[2px] -z-0 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                                            }`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <CardContent className="p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {currentStep === 0 && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="businessName">Gym/Business Name</Label>
                                            <Input
                                                id="businessName"
                                                name="businessName"
                                                value={formData.businessName}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Gym Name"
                                                autoComplete="organization"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">This name will appear on all your invoices.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Public/Business Email</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="contact@gymname.com"
                                                autoComplete="email"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Address (Street/Area)</Label>
                                            <Input
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                placeholder="Street Address, Area"
                                                autoComplete="street-address"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    placeholder="City"
                                                    autoComplete="address-level2"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="state">State</Label>
                                                <Input
                                                    id="state"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    placeholder="State"
                                                    autoComplete="address-level1"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="pincode">Pincode</Label>
                                            <Input
                                                id="pincode"
                                                name="pincode"
                                                value={formData.pincode}
                                                onChange={handleInputChange}
                                                placeholder="000000"
                                                autoComplete="postal-code"
                                                required
                                                type="text"
                                                inputMode="numeric"
                                                pattern="^[0-9]{6}$"
                                                maxLength={6}
                                                title="Please enter a valid 6-digit Indian PIN code"
                                                aria-invalid={!/^[0-9]{6}$/.test(formData.pincode) && formData.pincode.length > 0}
                                            />
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="9876543210"
                                                autoComplete="tel"
                                                required
                                                type="tel"
                                                inputMode="tel"
                                                pattern="^[0-9]{10}$"
                                                title="Please enter a valid 10-digit phone number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="upiId">UPI ID (for Payments)</Label>
                                            <Input
                                                id="upiId"
                                                name="upiId"
                                                value={formData.upiId}
                                                onChange={handleInputChange}
                                                placeholder="username@upi"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">Used to generate QR codes on invoices.</p>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-4">
                                        <div className="space-y-2 mb-4">
                                            <Label>Set your Membership Plans</Label>
                                            <p className="text-xs text-muted-foreground">Select the plans you offer and set their default prices. You can always change this later in Settings.</p>
                                        </div>
                                        <div className="grid gap-3">
                                            {formData.plans.map((plan, index) => (
                                                <div key={plan.name} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${plan.enabled ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            role="checkbox"
                                                            tabIndex={0}
                                                            aria-checked={plan.enabled}
                                                            aria-label={`Enable ${plan.name} Plan`}
                                                            className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${plan.enabled ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}
                                                            onClick={() => togglePlan(index)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    togglePlan(index);
                                                                }
                                                            }}
                                                        >
                                                            {plan.enabled && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                        </div>
                                                        <span className="font-medium text-sm">{plan.name} Plan</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-slate-500">₹</span>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={plan.price}
                                                            onChange={(e) => updatePlanPrice(index, e.target.value)}
                                                            disabled={!plan.enabled}
                                                            className="w-24 h-8 text-right bg-white disabled:bg-slate-100"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {currentStep === 4 && (
                                    <div className="space-y-4 text-center">
                                        <div className="space-y-2 text-left">
                                            <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                                            <Input
                                                id="invoicePrefix"
                                                name="invoicePrefix"
                                                value={formData.invoicePrefix}
                                                onChange={handleInputChange}
                                                placeholder="e.g. INV"
                                                maxLength={5}
                                                autoComplete="off"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">Invoices will look like TF-INV-0001</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-xl border-2 border-dashed border-primary/20 mt-8">
                                            <h3 className="font-bold text-primary mb-2">Almost there!</h3>
                                            <p className="text-sm text-slate-600">By clicking finish, you confirm that the provided information is accurate for billing purposes.</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </CardContent>

                    <div className="p-6 bg-slate-50 border-t flex justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 0 || isSubmitting}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {currentStep === steps.length - 1 ? (
                                isSubmitting ? 'Verifying...' : 'Complete & Verify'
                            ) : (
                                <>Next Step <ArrowRight className="ml-2 h-4 w-4" /></>
                            )}
                        </Button>
                    </div>
                </form>
                <div className="p-4 bg-slate-100/50 border-t flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Building2 className="h-3 w-3" />
                    <span>Powered by eMitra Technologies</span>
                </div>
            </Card>
        </div>
    )
}
