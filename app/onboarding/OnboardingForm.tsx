'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, MapPin, Contact, CreditCard, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { completeOnboarding } from './actions'

const steps = [
    { title: 'Business Info', icon: Building2 },
    { title: 'Location', icon: MapPin },
    { title: 'Contact', icon: Contact },
    { title: 'Invoice Setup', icon: CreditCard },
]

export default function OnboardingForm() {
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
        invoicePrefix: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (currentStep < steps.length - 1) {
            nextStep()
            return
        }

        setIsSubmitting(true)
        try {
            // Create a new FormData object and append all state values
            const submissionData = new FormData()
            Object.entries(formData).forEach(([key, value]) => {
                submissionData.append(key, value)
            })

            await completeOnboarding(submissionData)
        } catch (error) {
            console.error("Onboarding failed:", error)
            alert(error instanceof Error ? error.message : "Something went wrong. Please check your inputs.")
        } finally {
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
                                                placeholder="e.g. Tri-Star Fitness"
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
                                                placeholder="Tower Square, Sapna Sangeeta Rd"
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
                                                    placeholder="Indore"
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
                                                    placeholder="Madhya Pradesh"
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
                                                placeholder="452001"
                                                required
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
                                                placeholder="076930 06065"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="upiId">UPI ID (for Payments)</Label>
                                            <Input
                                                id="upiId"
                                                name="upiId"
                                                value={formData.upiId}
                                                onChange={handleInputChange}
                                                placeholder="gym@upi"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">Used to generate QR codes on invoices.</p>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-4 text-center">
                                        <div className="space-y-2 text-left">
                                            <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                                            <Input
                                                id="invoicePrefix"
                                                name="invoicePrefix"
                                                value={formData.invoicePrefix}
                                                onChange={handleInputChange}
                                                placeholder="e.g. TF"
                                                maxLength={5}
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
