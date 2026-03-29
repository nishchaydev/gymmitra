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
    Plus, Trash2, Upload, Download, FileSpreadsheet,
    Loader2, Sparkles, ChevronLeft, CheckCircle
} from 'lucide-react'
import { GymMitraLogo } from '@/components/brand/GymMitraLogo'
import Link from 'next/link'
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
    { title: 'Business Info', icon: Building2, emoji: '🏢', subtitle: 'Tell us about your gym' },
    { title: 'Location', icon: MapPin, emoji: '📍', subtitle: 'Where is your gym located?' },
    { title: 'Contact', icon: Contact, emoji: '📞', subtitle: 'How can members reach you?' },
    { title: 'Users', icon: Users, emoji: '👥', subtitle: 'Add your team & members' },
    { title: 'Inventory', icon: Package, emoji: '📦', subtitle: 'Products you sell' },
    { title: 'Membership Plans', icon: CheckCircle2, emoji: '💎', subtitle: 'Plans you offer' },
    { title: 'Invoice Setup', icon: CreditCard, emoji: '🧾', subtitle: 'Final touches' },
]

const stepMarketing = [
    {
        headline: <>Build Your Gym&apos;s <span className="text-primary italic">Digital Identity</span></>,
        description: 'Your brand starts here. A strong profile builds trust with every member who walks in.',
        highlights: ['Professional gym profile', 'Custom logo & branding', 'Business classification'],
    },
    {
        headline: <>Put Your Gym <span className="text-primary italic">on the Map</span></>,
        description: 'Members find gyms near them. A complete address makes you discoverable and trustworthy.',
        highlights: ['Google Maps integration ready', 'Multi-location support', 'State-wise tax compliance'],
    },
    {
        headline: <>Stay <span className="text-primary italic">Connected</span> with Members</>,
        description: 'Great gyms are reachable. Set up your contact channels for inquiries, renewals, and support.',
        highlights: ['WhatsApp notifications', 'Email reminders', 'Social media linking'],
    },
    {
        headline: <>Build Your <span className="text-primary italic">Dream Team</span></>,
        description: 'From trainers to front-desk staff — add your team so everyone can collaborate.',
        highlights: ['Role-based access control', 'Trainer assignments', 'Staff performance tracking'],
    },
    {
        headline: <>Track Every <span className="text-primary italic">Product & Sale</span></>,
        description: 'Supplements, merchandise, accessories — manage your inventory and boost revenue.',
        highlights: ['Real-time stock tracking', 'POS-ready inventory', 'Low-stock alerts'],
    },
    {
        headline: <>Craft <span className="text-primary italic">Irresistible</span> Plans</>,
        description: 'Flexible membership plans are the heart of your business. Design plans that convert.',
        highlights: ['Monthly, quarterly & annual', 'Custom pricing tiers', 'Auto-renewal reminders'],
    },
    {
        headline: <>Professional <span className="text-primary italic">Invoicing</span> Made Easy</>,
        description: 'Last step! Set up GST-compliant invoicing so every payment looks professional.',
        highlights: ['GST-compliant invoices', 'Auto-generated receipts', 'Payment history tracking'],
    },
]

export default function OnboardingForm() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
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
        staffList: [] as { name: string; phone: string; email: string; role: 'OWNER' | 'MANAGER' | 'TRAINER' | 'FRONT_DESK' }[],
        csvMembers: [] as { name: string; phone: string; planName: string; joinDate: string }[],
        manualMembers: [] as { name: string; phone: string; planName: string; joinDate: string }[],
        products: [] as { name: string; price: number; stock: number }[],
    })
    const [usersTab, setUsersTab] = useState<'staff' | 'members'>('staff')
    const [csvPreview, setCsvPreview] = useState<{ name: string; phone: string; planName: string; joinDate: string }[]>([])
    const [csvFileName, setCsvFileName] = useState<string | null>(null)

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

    // --- Staff helpers ---
    const addStaff = () => {
        setFormData(prev => ({
            ...prev,
            staffList: [...prev.staffList, { name: '', phone: '', email: '', role: 'TRAINER' as const }],
        }))
    }

    const removeStaff = (index: number) => {
        setFormData(prev => ({
            ...prev,
            staffList: prev.staffList.filter((_, i) => i !== index),
        }))
    }

    const updateStaff = (index: number, field: 'name' | 'phone' | 'email' | 'role', value: string) => {
        setFormData(prev => {
            const newStaff = [...prev.staffList]
            newStaff[index] = { ...newStaff[index], [field]: value } as any
            return { ...prev, staffList: newStaff }
        })
    }

    // --- Manual member helpers ---
    const addManualMember = () => {
        setFormData(prev => ({
            ...prev,
            manualMembers: [...prev.manualMembers, { name: '', phone: '', planName: '', joinDate: new Date().toISOString().split('T')[0] }],
        }))
    }

    const removeManualMember = (index: number) => {
        setFormData(prev => ({
            ...prev,
            manualMembers: prev.manualMembers.filter((_, i) => i !== index),
        }))
    }

    const updateManualMember = (index: number, field: 'name' | 'phone' | 'planName' | 'joinDate', value: string) => {
        setFormData(prev => {
            const arr = [...prev.manualMembers]
            arr[index] = { ...arr[index], [field]: value }
            return { ...prev, manualMembers: arr }
        })
    }

    // --- CSV helpers ---
    const downloadCsvTemplate = () => {
        const header = 'Name,Phone,Plan,JoinDate'
        const sample = 'Rahul Sharma,9876543210,Monthly,2024-01-15'
        const blob = new Blob([header + '\n' + sample], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'members_template.csv'; a.click()
        URL.revokeObjectURL(url)
    }

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setCsvFileName(file.name)
        const reader = new FileReader()
        reader.onload = (ev) => {
            const text = ev.target?.result as string
            const lines = text.split('\n').filter(l => l.trim())
            const rows = lines.slice(1).map(line => {
                const [name, phone, planName, joinDate] = line.split(',').map(s => s.trim())
                return { name: name || '', phone: phone || '', planName: planName || '', joinDate: joinDate || new Date().toISOString().split('T')[0] }
            }).filter(r => r.name && r.phone)
            setCsvPreview(rows)
        }
        reader.readAsText(file)
    }

    const confirmCsvImport = () => {
        setFormData(prev => ({ ...prev, csvMembers: csvPreview }))
        toast.success(`${csvPreview.length} members imported from CSV`)
    }

    const clearCsvImport = () => {
        setCsvPreview([])
        setCsvFileName(null)
        setFormData(prev => ({ ...prev, csvMembers: [] }))
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
            // Merge manual and CSV members into a single members array for the server
            const allMembers = [...formData.manualMembers, ...formData.csvMembers]
            Object.entries(formData).forEach(([key, value]) => {
                if (['plans', 'products', 'staffList'].includes(key)) {
                    submissionData.append(key, JSON.stringify(value))
                } else if (key === 'manualMembers' || key === 'csvMembers') {
                    // Skip individual — we send merged 'members' below
                } else if (key === 'logo' && value instanceof File) {
                    submissionData.append(key, value)
                } else if (key !== 'logo') {
                    submissionData.append(key, value as string)
                }
            })
            submissionData.append('members', JSON.stringify(allMembers))
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
            setIsComplete(true)
            toast.success('Onboarding complete!')
            // Delay redirect to show celebratory state
            setTimeout(() => {
                router.push(result.redirectTo!)
            }, 3000)
        } catch (navError) {
            console.error("Navigation failed:", navError)
            toast.error("Your profile was saved but navigation failed. Please refresh or go to your dashboard.")
            setIsSubmitting(false)
        }
    }

    const stepMarketing: { headline: React.ReactNode; description: string; highlights: string[] }[] = [
        {
            headline: <>Build Your Gym&apos;s <span className="text-primary italic">Digital Identity</span></>,
            description: "Your gym profile is the foundation of everything — invoices, member portals, and your public presence.",
            highlights: ["Professional branding on invoices", "Custom gym logo & identity", "Auto-generated business profile"],
        },
        {
            headline: <>Put Your Gym <span className="text-primary italic">on the Map</span></>,
            description: "A verified address builds trust with members and enables location-based features.",
            highlights: ["Google Maps integration ready", "Multi-branch support", "Location-based member check-in"],
        },
        {
            headline: <>Stay <span className="text-primary italic">Connected</span> with Members</>,
            description: "Reliable contact info means automated reminders, receipts, and support reach your members every time.",
            highlights: ["WhatsApp payment reminders", "Email receipts & notifications", "Quick member support channel"],
        },
        {
            headline: <>Build Your <span className="text-primary italic">Dream Team</span></>,
            description: "Add staff with role-based access so trainers, managers, and receptionists see only what they need.",
            highlights: ["Role-based access control", "Trainer-member assignments", "Staff performance tracking"],
        },
        {
            headline: <>Track Every <span className="text-primary italic">Product &amp; Sale</span></>,
            description: "From supplements to merchandise — manage inventory and POS sales right from your dashboard.",
            highlights: ["Real-time stock tracking", "Low-stock alerts", "Integrated POS billing"],
        },
        {
            headline: <>Craft <span className="text-primary italic">Irresistible</span> Plans</>,
            description: "Flexible membership plans with custom durations, pricing, and features that convert visitors to members.",
            highlights: ["Unlimited plan variations", "Auto-renewal reminders", "Plan comparison for members"],
        },
        {
            headline: <>Professional <span className="text-primary italic">Invoicing</span> Made Easy</>,
            description: "Branded invoices with your logo, GST details, and payment tracking — all automated.",
            highlights: ["GST-compliant invoices", "Auto-generated receipts", "Payment status tracking"],
        },
    ]

    const marketingPanel = (
        <div className="hidden lg:flex flex-1 flex-col justify-center px-8 xl:px-16 bg-midnight/5 border-r border-border/50 overflow-y-auto py-6">
            <div className="max-w-md">
                <Link href="/" className="mb-5 block">
                    <GymMitraLogo iconClassName="w-9 h-9" />
                </Link>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ocean/10 border border-ocean/20 text-ocean text-xs font-semibold mb-3">
                            <Sparkles className="w-3.5 h-3.5" />
                            Step {currentStep + 1} of {steps.length}
                        </div>
                        <h1 className="text-2xl xl:text-3xl font-bold text-midnight leading-snug mb-3">
                            {stepMarketing[currentStep].headline}
                        </h1>
                        <p className="text-sm text-muted-foreground mb-6">
                            {stepMarketing[currentStep].description}
                        </p>
                        <div className="space-y-3">
                            {stepMarketing[currentStep].highlights.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 group">
                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-border group-hover:border-primary transition-colors shrink-0">
                                        <CheckCircle className="w-4 h-4 text-ocean" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{item}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )

    // Completion state
    if (isComplete) {
        return (
            <div className="flex h-screen">
                {marketingPanel}
                <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 circuit-bg overflow-y-auto">
                    <div className="lg:hidden mb-8">
                        <Link href="/"><GymMitraLogo /></Link>
                    </div>
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
                                        Your gym is now <span className="text-primary font-semibold">verified</span> and ready to go.
                                    </p>
                                </div>
                                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-sm text-left space-y-3 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                    <p className="font-bold text-slate-900 flex items-center gap-2">
                                        <span className="text-lg">🚀</span> Redirecting to your dashboard...
                                    </p>
                                    <p className="text-slate-600 leading-relaxed">
                                        We&apos;re taking you to your gym management dashboard in a few seconds.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen">
            {marketingPanel}
            <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 circuit-bg overflow-y-auto">
            <div className="lg:hidden mb-8">
                <Link href="/"><GymMitraLogo /></Link>
            </div>
            <div className="w-full max-w-2xl">
            <Card className="w-full overflow-hidden shadow-2xl border-border/50 glass-card rounded-3xl">
                {/* Animated progress bar */}
                <div className="h-1.5 w-full bg-slate-100 flex">
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        className="h-full bg-primary"
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                </div>

                <div className="bg-white/50 backdrop-blur p-6 border-b border-white/30">
                    <div className="flex justify-between items-center mb-6 px-2">
                        {steps.map((step, idx) => {
                            const Icon = step.icon
                            const isActive = idx === currentStep
                            const isCompleted = idx < currentStep
                            return (
                                <div key={step.title} className="flex flex-col items-center gap-2 relative flex-1">
                                    <motion.div
                                        animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors duration-300 z-10 ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                                            isCompleted ? 'bg-ocean text-white shadow-md shadow-ocean/20' : 'bg-slate-200 text-slate-500'
                                        }`}
                                    >
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <Icon className="w-4 h-4 md:w-5 md:h-5" />}
                                    </motion.div>
                                    <span className={`text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-center hidden sm:block ${isActive ? 'text-primary' : isCompleted ? 'text-ocean' : 'text-slate-400'
                                        }`}>
                                        {step.title}
                                    </span>
                                    {idx < steps.length - 1 && (
                                        <div className={`absolute top-4 md:top-5 left-[50%] w-full h-[2px] -z-0 ${isCompleted ? 'bg-ocean' : 'bg-slate-200'
                                            }`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {/* Step title + subtitle */}
                    <div className="text-center mt-2">
                        <h2 className="text-2xl font-bold text-midnight tracking-tight">
                            {steps[currentStep].emoji} {steps[currentStep].title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {steps[currentStep].subtitle}
                        </p>
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
                                                    <div className={`w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${logoPreview ? 'border-primary-500 bg-white' : 'border-drift-200 bg-drift-50 hover:bg-drift-100 hover:border-primary-300'}`}>
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
                                        {/* Tabs */}
                                        <div className="flex rounded-lg bg-slate-100 p-1">
                                            <button type="button" onClick={() => setUsersTab('staff')} className={`flex-1 py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${usersTab === 'staff' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>👥 Staff</button>
                                            <button type="button" onClick={() => setUsersTab('members')} className={`flex-1 py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${usersTab === 'members' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🏋️ Members</button>
                                        </div>

                                        {/* STAFF TAB */}
                                        {usersTab === 'staff' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <Label className="text-lg font-bold">Staff</Label>
                                                        <p className="text-xs text-muted-foreground">Add trainers, managers, or front desk staff. They'll be notified via WhatsApp & email.</p>
                                                    </div>
                                                    <Button type="button" variant="outline" size="sm" onClick={addStaff}>
                                                        <Plus className="w-4 h-4 mr-2" /> Add Staff
                                                    </Button>
                                                </div>

                                                {formData.staffList.length === 0 && (
                                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                                                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                                        <p className="text-sm text-muted-foreground">No staff added yet</p>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    {formData.staffList.map((staff, index) => (
                                                        <div key={index} className="p-4 border rounded-xl bg-white shadow-sm space-y-3 transition-all hover:border-primary/30">
                                                            <div className="grid grid-cols-12 gap-3">
                                                                <div className="col-span-6 space-y-1">
                                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Full Name *</Label>
                                                                    <Input placeholder="Rahul Sharma" value={staff.name} onChange={(e) => updateStaff(index, 'name', e.target.value)} required />
                                                                </div>
                                                                <div className="col-span-5 space-y-1">
                                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Phone *</Label>
                                                                    <Input placeholder="9876543210" value={staff.phone} onChange={(e) => updateStaff(index, 'phone', e.target.value)} required pattern="^[0-9]{10}$" inputMode="tel" />
                                                                </div>
                                                                <div className="col-span-1 flex items-end justify-center pb-1">
                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeStaff(index)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-12 gap-3">
                                                                <div className="col-span-7 space-y-1">
                                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Email * (for login)</Label>
                                                                    <Input type="email" placeholder="staff@email.com" value={staff.email} onChange={(e) => updateStaff(index, 'email', e.target.value)} required />
                                                                </div>
                                                                <div className="col-span-5 space-y-1">
                                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Role</Label>
                                                                    <Select value={staff.role} onValueChange={(val) => updateStaff(index, 'role', val)}>
                                                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="OWNER">Owner</SelectItem>
                                                                            <SelectItem value="MANAGER">Manager</SelectItem>
                                                                            <SelectItem value="TRAINER">Trainer</SelectItem>
                                                                            <SelectItem value="FRONT_DESK">Front Desk</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* MEMBERS TAB */}
                                        {usersTab === 'members' && (
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <Label className="text-lg font-bold">Members <span className="text-xs font-normal text-slate-400">(Optional — skip if no members yet)</span></Label>
                                                    <p className="text-xs text-muted-foreground">Add existing gym members manually or import from CSV.</p>
                                                </div>

                                                {/* Two option buttons */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Button type="button" variant="outline" className="h-auto py-4 flex-col gap-2" onClick={addManualMember}>
                                                        <Plus className="w-5 h-5" />
                                                        <span className="text-xs font-bold">Add Manually</span>
                                                    </Button>
                                                    <div className="relative">
                                                        <Button type="button" variant="outline" className="h-auto py-4 flex-col gap-2 w-full" onClick={downloadCsvTemplate}>
                                                            <Download className="w-5 h-5" />
                                                            <span className="text-xs font-bold">Download CSV Template</span>
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* CSV Upload */}
                                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                                                    <label className="cursor-pointer flex flex-col items-center gap-2">
                                                        <FileSpreadsheet className="w-6 h-6 text-slate-400" />
                                                        <span className="text-xs text-slate-500 font-medium">{csvFileName || 'Upload CSV file'}</span>
                                                        <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                                                    </label>
                                                </div>

                                                {/* CSV Preview */}
                                                {csvPreview.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-sm font-bold">Preview ({csvPreview.length} members)</Label>
                                                            <div className="flex gap-2">
                                                                <Button type="button" variant="outline" size="sm" onClick={clearCsvImport}>Clear</Button>
                                                                <Button type="button" size="sm" onClick={confirmCsvImport} className="bg-emerald-600 hover:bg-emerald-700">Confirm Import</Button>
                                                            </div>
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto border rounded-lg">
                                                            <table className="w-full text-xs">
                                                                <thead className="bg-slate-50 sticky top-0"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Phone</th><th className="p-2 text-left">Plan</th><th className="p-2 text-left">Join Date</th></tr></thead>
                                                                <tbody>{csvPreview.map((r, i) => (<tr key={i} className="border-t"><td className="p-2">{r.name}</td><td className="p-2">{r.phone}</td><td className="p-2">{r.planName}</td><td className="p-2">{r.joinDate}</td></tr>))}</tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Confirmed CSV import badge */}
                                                {formData.csvMembers.length > 0 && csvPreview.length === 0 && (
                                                    <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        <span className="text-xs font-bold text-emerald-700">{formData.csvMembers.length} members imported from CSV</span>
                                                        <Button type="button" variant="ghost" size="sm" onClick={clearCsvImport} className="ml-auto text-xs">Clear</Button>
                                                    </div>
                                                )}

                                                {/* Manual Members List */}
                                                {formData.manualMembers.length > 0 && (
                                                    <div className="space-y-3">
                                                        <Label className="text-sm font-bold">Manually Added ({formData.manualMembers.length})</Label>
                                                        {formData.manualMembers.map((member, index) => (
                                                            <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-xl bg-white shadow-sm">
                                                                <div className="col-span-3 space-y-1">
                                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Name</Label>
                                                                    <Input placeholder="Name" value={member.name} onChange={(e) => updateManualMember(index, 'name', e.target.value)} required />
                                                                </div>
                                                                <div className="col-span-3 space-y-1">
                                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Phone</Label>
                                                                    <Input placeholder="Phone" value={member.phone} onChange={(e) => updateManualMember(index, 'phone', e.target.value)} required pattern="^[0-9]{10}$" inputMode="tel" />
                                                                </div>
                                                                <div className="col-span-3 space-y-1">
                                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Plan</Label>
                                                                    <Select value={member.planName} onValueChange={(val) => updateManualMember(index, 'planName', val)}>
                                                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Plan" /></SelectTrigger>
                                                                        <SelectContent>
                                                                            {formData.plans.filter(p => p.name.trim()).map(p => (<SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="col-span-2 space-y-1">
                                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Joined</Label>
                                                                    <Input type="date" value={member.joinDate} onChange={(e) => updateManualMember(index, 'joinDate', e.target.value)} />
                                                                </div>
                                                                <div className="col-span-1 flex items-end justify-center pb-1">
                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeManualMember(index)} className="text-rose-500 hover:text-rose-600">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {formData.manualMembers.length === 0 && formData.csvMembers.length === 0 && csvPreview.length === 0 && (
                                                    <p className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded-md font-medium">💡 You can skip this step and add members later from your dashboard.</p>
                                                )}
                                            </div>
                                        )}
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

                    <div className="p-6 bg-white/50 backdrop-blur border-t border-white/30 flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 0 || isSubmitting}
                            className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={`h-12 px-8 rounded-xl font-bold text-base group transition-all ${
                                currentStep === steps.length - 1
                                    ? 'premium-gradient text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30'
                                    : 'premium-gradient text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30'
                            }`}
                        >
                            {currentStep === steps.length - 1 ? (
                                isSubmitting ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</>
                                ) : (
                                    <><Sparkles className="mr-2 h-5 w-5" /> Complete & Verify</>
                                )
                            ) : (
                                <>Next Step <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </Button>
                    </div>
                </form>
                <div className="p-4 bg-white/30 backdrop-blur border-t border-white/20 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Building2 className="h-3 w-3" />
                    <span>Powered by eMitra Technologies</span>
                </div>
            </Card>
            </div>
            </div>
        </div>
    )
}
