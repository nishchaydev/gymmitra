'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
    Building2, MapPin, Contact, CreditCard, CheckCircle2, 
    ArrowRight, ArrowLeft, ImagePlus, X, Users, Package,
    Plus, Trash2, Upload
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { completeOnboarding } from './actions'

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const steps = [
    { title: 'Business Info', icon: Building2 },
    { title: 'Location', icon: MapPin },
    { title: 'Contact', icon: Contact },
    { title: 'Users', icon: Users },
    { title: 'Inventory', icon: Package },
    { title: 'Membership Plans', icon: CheckCircle2 },
    { title: 'Invoice Setup', icon: CreditCard },
]

export default function OnboardingForm() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [states, setStates] = useState<string[]>(INDIAN_STATES)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        upiId: '',
        invoicePrefix: 'GM',
        termsAndConditions: '1. Fees once paid are non-refundable.\n2. Management is not responsible for personal belongings.',
        gymRules: '1. Always wipe down equipment after use.\n2. Re-rack weights after finishing your set.\n3. Appropriate gym attire and closed-toe shoes are mandatory.',
        plans: [
            { name: 'Monthly', durationMonths: 1, price: 1000, enabled: true },
            { name: 'Quarterly', durationMonths: 3, price: 2500, enabled: true },
            { name: 'Yearly', durationMonths: 12, price: 8000, enabled: true },
        ],
        futurePlanPreference: 'BASIC' as 'BASIC' | 'PRO' | 'ENTERPRISE',
        logo: null as File | null,
        members: [] as { name: string; phone: string; email?: string }[],
        products: [] as { name: string; price: number; stock: number }[],
    })

    // Pre-fill from existing GymProfile (trial signup already saves gymName, ownerName, email, phone, city)
    useEffect(() => {
        const prefill = async () => {
            try {
                const res = await fetch('/api/settings')
                if (!res.ok) return
                const data = await res.json()
                setFormData(prev => ({
                    ...prev,
                    businessName: data.name || data.businessName || prev.businessName,
                    ownerName: data.ownerName || prev.ownerName,
                    email: data.email || prev.email,
                    phone: data.phone || prev.phone,
                    city: data.city || prev.city,
                    address: data.address || prev.address,
                }))
                if (data.logo) setLogoPreview(data.logo)
            } catch {
                // Silently fail — user can fill manually
            }
        }
        prefill()
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const addPlan = () => {
        setFormData(prev => ({
            ...prev,
            plans: [...prev.plans, { name: '', durationMonths: 1, price: 0, enabled: true }],
        }))
    }

    const removePlan = (index: number) => {
        setFormData(prev => ({
            ...prev,
            plans: prev.plans.filter((_, i) => i !== index),
        }))
    }

    const updatePlan = (index: number, field: 'name' | 'durationMonths', value: string | number) => {
        setFormData(prev => {
            const newPlans = [...prev.plans]
            newPlans[index] = { ...newPlans[index], [field]: value }
            return { ...prev, plans: newPlans }
        })
    }

    const addMember = () => {
        setFormData(prev => ({
            ...prev,
            members: [...prev.members, { name: '', phone: '' }],
        }))
    }

    const removeMember = (index: number) => {
        setFormData(prev => ({
            ...prev,
            members: prev.members.filter((_, i) => i !== index),
        }))
    }

    const updateMember = (index: number, field: 'name' | 'phone', value: string) => {
        setFormData(prev => {
            const newMembers = [...prev.members]
            newMembers[index] = { ...newMembers[index], [field]: value }
            return { ...prev, members: newMembers }
        })
    }

    const addProduct = () => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, { name: '', price: 0, stock: 0 }],
        }))
    }

    const removeProduct = (index: number) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== index),
        }))
    }

    const updateProduct = (index: number, field: 'name' | 'price' | 'stock', value: string | number) => {
        setFormData(prev => {
            const newProducts = [...prev.products]
            newProducts[index] = { ...newProducts[index], [field]: value } as any
            return { ...prev, products: newProducts }
        })
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Logo size must be less than 2MB")
                return
            }
            setFormData(prev => ({ ...prev, logo: file }))
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const { pincode } = formData;
    useEffect(() => {
        const controller = new AbortController()

        const fetchPincodeDetails = async () => {
            if (pincode?.length === 6) {
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal: controller.signal })
                    const data = await res.json()

                    if (data && data[0] && data[0].Status === 'Success') {
                        const postOffice = data[0].PostOffice[0]
                        const fetchedState = postOffice.State
                        const fetchedCity = postOffice.District

                        // If state does not exist in our current dropdown list or it is empty, add it
                        setStates(prev => {
                            if (!prev.includes(fetchedState)) return [...prev, fetchedState].sort()
                            return prev
                        })

                        setFormData(prev => ({ ...prev, state: fetchedState, city: fetchedCity }))
                    } else {
                        toast.error("Invalid pincode or details not found.")
                    }
                } catch (error: any) {
                    if (error.name === 'AbortError') return
                    console.warn("Failed to fetch pincode details:", error)
                    // We don't want to show an intrusive toast or overlay if the third party API is down or adblocked.
                }
            }
        }

        const timeoutId = setTimeout(() => {
            fetchPincodeDetails()
        }, 500) // Debounce

        return () => {
            clearTimeout(timeoutId)
            controller.abort()
        }
    }, [pincode])

    const removeLogo = () => {
        setFormData(prev => ({ ...prev, logo: null }))
        setLogoPreview(null)
    }

    const nextStep = () => {
        const form = document.querySelector('form')
        if (currentStep === 5 && formData.plans.length === 0) { // Membership Plans step
            toast.error("Please add at least one membership plan to continue.")
            return
        }
        if (currentStep === 5 && formData.plans.some(p => !p.name.trim())) { // Membership Plans step
            toast.error("Please give each plan a name.")
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
        let result: { redirectTo?: string; warnings?: string[]; error?: string }
        try {
            const submissionData = new FormData()
            Object.entries(formData).forEach(([key, value]) => {
                if (['plans', 'members', 'products'].includes(key)) {
                    submissionData.append(key, JSON.stringify(value))
                } else if (key === 'logo' && value instanceof File) {
                    submissionData.append(key, value)
                } else if (key !== 'logo') {
                    submissionData.append(key, value as string)
                }
            })
            result = await completeOnboarding(submissionData)

            if (result.error) {
                toast.error(result.error)
                setIsSubmitting(false)
                return
            }
        } catch (error) {
            console.error("Onboarding failed:", error)
            toast.error(error instanceof Error ? error.message : "Something went wrong. Please check your inputs.")
            setIsSubmitting(false)
            return
        }

        // 2. Validate response and navigate
        if (!result.redirectTo) {
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
                    <div className="flex justify-between items-center mb-6 px-2">
                        {steps.map((step, idx) => {
                            const Icon = step.icon
                            const isActive = idx === currentStep
                            const isCompleted = idx < currentStep
                            return (
                                <div key={step.title} className="flex flex-col items-center gap-2 relative flex-1">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors duration-300 z-10 ${isActive ? 'bg-primary text-white scale-110 shadow-lg' :
                                        isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <Icon className="w-4 h-4 md:w-5 md:h-5" />}
                                    </div>
                                    <span className={`text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-center hidden sm:block ${isActive ? 'text-primary' : 'text-slate-400'
                                        }`}>
                                        {step.title}
                                    </span>
                                    {idx < steps.length - 1 && (
                                        <div className={`absolute top-4 md:top-5 left-[50%] w-full h-[2px] -z-0 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                                            }`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {/* Current step label for mobile only */}
                    <div className="sm:hidden text-center">
                        <span className="text-xs font-black uppercase text-primary tracking-widest">
                            Step {currentStep + 1}: {steps[currentStep].title}
                        </span>
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
                                    <div className="space-y-6">
                                        {/* Logo Upload Section */}
                                        <div className="space-y-3">
                                            <Label htmlFor="gymLogo" className="text-sm font-bold text-drift-700">Gym Logo (Optional)</Label>
                                            <div className="flex items-center gap-6">
                                                <div className="relative group">
                                                    <div className={`w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${logoPreview ? 'border-ion-500 bg-white' : 'border-drift-200 bg-drift-50 hover:bg-drift-100 hover:border-ion-300'}`}>
                                                        {logoPreview ? (
                                                            <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-1 text-drift-400">
                                                                <ImagePlus className="w-8 h-8" />
                                                                <span className="text-[10px] font-bold uppercase">Upload</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {logoPreview && (
                                                        <button
                                                            onClick={removeLogo}
                                                            type="button"
                                                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg hover:bg-rose-600 transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                    <input
                                                        id="gymLogo"
                                                        type="file"
                                                        accept="image/*"
                                                        value=""
                                                        onChange={handleLogoChange}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        title="Upload Gym Logo"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <h4 className="text-sm font-bold text-drift-900">Brand Identity</h4>
                                                    <p className="text-xs text-drift-500 leading-relaxed font-medium">
                                                        Add your professional logo. This will be featured on member invoices and dashboard. Max 2MB.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

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
                                                <Label htmlFor="ownerName">Owner Name</Label>
                                                <Input
                                                    id="ownerName"
                                                    name="ownerName"
                                                    value={formData.ownerName}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g. Nikhil Pal"
                                                    autoComplete="name"
                                                    required
                                                />
                                                <p className="text-xs text-muted-foreground">We&apos;ll use this name for personalized communication.</p>
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
                                                <Select
                                                    value={formData.state}
                                                    onValueChange={(val) => setFormData(prev => ({ ...prev, state: val }))}
                                                >
                                                    <SelectTrigger id="state" className="bg-white px-3 py-2 border rounded-md shadow-sm">
                                                        <SelectValue placeholder="Select State" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {states.map((s) => (
                                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
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
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-lg font-bold">Add Staff/Users</Label>
                                                <p className="text-xs text-muted-foreground">Add trainers, managers, or front desk staff.</p>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={addMember}>
                                                <Plus className="w-4 h-4 mr-2" /> Add User
                                            </Button>
                                        </div>

                                        {formData.members.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                                                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                                <p className="text-sm text-muted-foreground">No users added yet</p>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {formData.members.map((member, index) => (
                                                <div key={index} className="grid grid-cols-12 gap-3 p-4 border rounded-xl bg-white shadow-sm transition-all hover:border-primary/30">
                                                    <div className="col-span-5 space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Full Name</Label>
                                                        <Input
                                                            placeholder="John Doe"
                                                            value={member.name}
                                                            onChange={(e) => updateMember(index, 'name', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-span-5 space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Phone</Label>
                                                        <Input
                                                            placeholder="9876543210"
                                                            value={member.phone}
                                                            onChange={(e) => updateMember(index, 'phone', e.target.value)}
                                                            required
                                                            pattern="^[0-9]{10}$"
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex items-end justify-center pb-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeMember(index)}
                                                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {currentStep === 4 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-lg font-bold">Add Inventory/Products</Label>
                                                <p className="text-xs text-muted-foreground">Add supplements, equipment, or merch for sale.</p>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                                                <Plus className="w-4 h-4 mr-2" /> Add Item
                                            </Button>
                                        </div>

                                        {formData.products.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                                                <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                                <p className="text-sm text-muted-foreground">No inventory items yet</p>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {formData.products.map((product, index) => (
                                                <div key={index} className="grid grid-cols-12 gap-3 p-4 border rounded-xl bg-white shadow-sm transition-all hover:border-primary/30">
                                                    <div className="col-span-5 space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Product Name</Label>
                                                        <Input
                                                            placeholder="Whey Protein"
                                                            value={product.name}
                                                            onChange={(e) => updateProduct(index, 'name', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-span-3 space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Price (₹)</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Price"
                                                            value={product.price}
                                                            onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value))}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-span-2 space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Stock</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Qty"
                                                            value={product.stock}
                                                            onChange={(e) => updateProduct(index, 'stock', parseInt(e.target.value))}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex items-end justify-center pb-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeProduct(index)}
                                                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {currentStep === 5 && (
                                    <div className="space-y-4">
                                        <div className="space-y-2 mb-4">
                                            <Label>Create your Membership Plans</Label>
                                            <p className="text-xs text-muted-foreground">Add the plans you offer to members. You can set the price later in Settings.</p>
                                        </div>

                                        {formData.plans.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-2">No plans added yet</p>
                                                <p className="text-xs text-muted-foreground">Click the button below to create your first plan</p>
                                            </div>
                                        )}

                                        <div className="grid gap-3">
                                            {formData.plans.map((plan, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg border-slate-200 bg-white">
                                                    <div className="flex-1">
                                                        <Input
                                                            placeholder="Plan name (e.g. Monthly, Premium, Student)"
                                                            value={plan.name}
                                                            onChange={(e) => updatePlan(index, 'name', e.target.value)}
                                                            className="text-sm"
                                                        />
                                                    </div>
                                                    <div className="w-28">
                                                        <select
                                                            value={plan.durationMonths}
                                                            onChange={(e) => updatePlan(index, 'durationMonths', parseInt(e.target.value))}
                                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                        >
                                                            <option value={1}>1 Month</option>
                                                            <option value={2}>2 Months</option>
                                                            <option value={3}>3 Months</option>
                                                            <option value={6}>6 Months</option>
                                                            <option value={12}>12 Months</option>
                                                        </select>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePlan(index)}
                                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                        aria-label={`Remove ${plan.name || 'plan'}`}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full border-dashed"
                                            onClick={addPlan}
                                        >
                                            <span className="mr-2">+</span> Add Plan
                                        </Button>
                                    </div>
                                )}

                                {currentStep === 6 && (
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
                                            <p className="text-xs text-muted-foreground">Invoices will look like {formData.invoicePrefix || 'GM'}-INV-0001</p>
                                        </div>
                                        <div className="space-y-2 text-left mt-4">
                                            <Label htmlFor="termsAndConditions">Invoice Terms & Conditions (Billing Policies)</Label>
                                            <textarea
                                                id="termsAndConditions"
                                                name="termsAndConditions"
                                                className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={formData.termsAndConditions}
                                                onChange={(e) => handleInputChange(e as any)}
                                                placeholder="Enter invoice terms here (e.g. Refund policy)..."
                                            />
                                        </div>
                                        <div className="space-y-2 text-left mt-4">
                                            <Label htmlFor="gymRules">Gym Rules (Member Guidelines)</Label>
                                            <textarea
                                                id="gymRules"
                                                name="gymRules"
                                                className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={formData.gymRules}
                                                onChange={(e) => handleInputChange(e as any)}
                                                placeholder="Enter gym rules here (e.g. Dress code, equipment use)..."
                                            />
                                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md font-medium mt-2">🔔 You can edit these terms and rules later anytime from your Dashboard Settings!</p>
                                        </div>

                                        <div className="space-y-4 text-left mt-8 border-t pt-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CreditCard className="w-4 h-4 text-primary" />
                                                <Label htmlFor="futurePlanPreference-select" className="font-bold cursor-pointer">Select Preferred Plan After 1-Month Trial</Label>
                                            </div>
                                            <Select
                                                value={formData.futurePlanPreference}
                                                onValueChange={(val) => setFormData(prev => ({ ...prev, futurePlanPreference: val as "BASIC" | "PRO" | "ENTERPRISE" }))}
                                            >
                                                <SelectTrigger id="futurePlanPreference-select" className="bg-white border-2 border-primary/20 focus:border-primary">
                                                    <SelectValue placeholder="Select Plan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BASIC">Basic Plan (Single Location)</SelectItem>
                                                    <SelectItem value="PRO">Pro Plan (Multi-location & Advanced Features)</SelectItem>
                                                    <SelectItem value="ENTERPRISE">Enterprise (Custom Setup)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[10px] text-slate-500 font-medium italic bg-slate-100 p-2 rounded-lg border border-slate-200">
                                                ✨ Trial Duration: 30 Days. You won't be charged today. We'll use this preference to customize your initial experience and setup.
                                            </p>
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
