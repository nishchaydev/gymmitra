"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SuccessCheckmark } from "@/components/ui/success-animation"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, FileText, CheckCircle2, User, Phone, Mail, MapPin, Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Schema imported from centralized validator — single source of truth
import { memberFormSchema, type MemberFormInput } from "@/src/modules/members/validator"

type MemberFormValues = MemberFormInput

// Define MemberFormProps type
interface MemberFormProps {
    member?: (Partial<Omit<MemberFormValues, 'dateOfBirth'>> & { dateOfBirth?: Date | string; id?: string }) | null;
    gymSlug: string;
    onSubmitAction: (data: any) => Promise<{ success?: boolean, error?: string, id?: string, invoiceId?: string, whatsappUrl?: string }>;
    activePlans?: { id: string, name: string, price: any, duration: number }[];
    dobMandatory?: boolean;
}

export default function MemberForm({ member, gymSlug, onSubmitAction, activePlans = [], dobMandatory = true }: MemberFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
    const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [step, setStep] = useState(1)
    const [checkingPhone, setCheckingPhone] = useState(false)

    useEffect(() => {
        return () => {
            if (submitTimeoutRef.current) {
                clearTimeout(submitTimeoutRef.current)
            }
        }
    }, [])

    // Memoized initial values from search params or member prop
    const initialValues = useMemo(() => {
        if (member) return {
            name: member.name || "",
            phone: member.phone || "",
            email: member.email || "",
            dateOfBirth: member.dateOfBirth instanceof Date
                ? `${member.dateOfBirth.getFullYear()}-${String(member.dateOfBirth.getMonth() + 1).padStart(2, '0')}-${String(member.dateOfBirth.getDate()).padStart(2, '0')}`
                : (member.dateOfBirth || ""),
            emergencyName: member.emergencyName || "",
            emergencyPhone: member.emergencyPhone || "",
            emergencyRelation: member.emergencyRelation || "",
            pincode: member.pincode || "",
            state: member.state || "",
            city: member.city || "",
            planId: "none",
            paymentMethod: "CASH" as const,
            discount: 0,
            customPrice: "",
            amountPaid: "",
            customEndDate: "",
        }

        // Prefill from query params for 'Convert Lead'
        return {
            name: searchParams.get('name') || "",
            phone: searchParams.get('phone') || "",
            email: searchParams.get('email') || "",
            dateOfBirth: "",
            emergencyName: "",
            emergencyPhone: "",
            emergencyRelation: "",
            pincode: "",
            state: "",
            city: "",
            planId: "none",
            paymentMethod: "CASH" as const,
            discount: 0,
            customPrice: "",
            amountPaid: "",
            customEndDate: "",
        }
    }, [member, searchParams])

    // Set up mutation for optimistic updates
    const queryClient = useQueryClient()
    const mutation = useMutation({
      mutationFn: onSubmitAction,
      onMutate: async (newMemberData: any) => {
        await queryClient.cancelQueries({ 
          queryKey: ['members'] 
        })
        const previousMembers = queryClient.getQueryData(
          ['members']
        ) as { members: any[]; total: number } | undefined
        
        // Optimistically update the cache
        queryClient.setQueryData(['members'], (old: any) => {
          if (!old) return old
          return {
            ...old,
            members: [{ id: 'optimistic', ...newMemberData }, ...old.members],
            total: old.total + 1
          }
        })
        
        return { previousMembers }
      },
      onError: (err: any, variables: any, context: any) => {
        queryClient.setQueryData(
          ['members'], 
          context?.previousMembers
        )
      },
      onSettled: () => {
        queryClient.invalidateQueries({ 
          queryKey: ['members'] 
        })
      }
    })

    const form = useForm<MemberFormValues>({
        resolver: zodResolver(memberFormSchema) as any,
        defaultValues: initialValues as any,
    })

    // Update form when initialValues change (e.g. if arriving from Leads page)
    useEffect(() => {
        if (!member && (searchParams.get('name') || searchParams.get('phone') || searchParams.get('email'))) {
            form.reset(initialValues as any)
        }
    }, [initialValues, member, form, searchParams])

    // Auto-calculate amountPaid default when plan or discount changes
    const selectedPlanId = form.watch('planId')
    const discountAmount = form.watch('discount') || 0
    const customPriceValue = form.watch('customPrice')
    const [userEditedAmount, setUserEditedAmount] = useState(false)

    useEffect(() => {
        setUserEditedAmount(false)
    }, [selectedPlanId])

    useEffect(() => {
        if (selectedPlanId && selectedPlanId !== 'none' && !userEditedAmount) {
            const plan = activePlans.find(p => p.id === selectedPlanId)
            if (plan) {
                const basePrice = (customPriceValue !== undefined && customPriceValue !== null && customPriceValue > 0) ? customPriceValue : Number(plan.price)
                const total = Math.max(0, basePrice - discountAmount)
                form.setValue('amountPaid', total)
            }
        }
    }, [selectedPlanId, discountAmount, customPriceValue, activePlans, form, userEditedAmount])

    const pincodeValue = form.watch('pincode')
    useEffect(() => {
        const controller = new AbortController()

        const fetchPincodeDetails = async () => {
            if (pincodeValue && pincodeValue.length === 6) {
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${pincodeValue}`, { signal: controller.signal })
                    const data = await res.json()
                    if (data && data[0] && data[0].Status === 'Success') {
                        const postOffice = data[0].PostOffice[0]

                        // We use getValues to check what state is currently there, to avoid overriding if user manually changed it
                        form.setValue('state', postOffice.State, { shouldValidate: true })
                        form.setValue('city', postOffice.District, { shouldValidate: true })
                    }
                } catch (error: any) {
                    if (error.name === 'AbortError') return
                    console.warn("Failed to fetch pincode details (API may be down or blocked):", error)
                }
            }
        }

        const timeoutId = setTimeout(() => {
            fetchPincodeDetails()
        }, 500)

        return () => {
            clearTimeout(timeoutId)
            controller.abort()
        }
    }, [pincodeValue, form])

    const onNextStep = async () => {
        const isValid = await form.trigger(["name", "phone", "email", "dateOfBirth"])
        if (!isValid) return

        if (dobMandatory && !form.getValues("dateOfBirth")) {
            form.setError("dateOfBirth", { type: "manual", message: "Date of Birth is required" })
            return
        }

        const phone = form.getValues("phone")

        if (member && member.phone === phone) {
            setStep(2)
            return
        }

        setCheckingPhone(true)
        try {
            const res = await fetch(`/api/${gymSlug}/members/check-phone?phone=${phone}`)
            if (!res.ok) throw new Error("API failed")
            const data = await res.json()

            if (data.exists && data.memberId !== member?.id) {
                form.setError("phone", {
                    type: "manual",
                    message: `A member named ${data.memberName} already exists with this phone number.`
                })
                toast.error("Duplicate Phone Number", {
                    description: `${data.memberName} is already registered with ${phone}.`
                })
                return
            }

            setStep(2)
        } catch (error) {
            console.error("Phone check failed:", error)
            setStep(2)
        } finally {
            setCheckingPhone(false)
        }
    }

    async function onSubmit(data: MemberFormValues) {
        setIsSubmitting(true)
        try {
            const result = await mutation.mutateAsync(data as any)

            if (result?.error) {
                toast.error(result.error)
                setIsSubmitting(false)
                return
            }

            if (result?.success) {
                setSuccess(true)
                if (result.whatsappUrl) {
                    setWhatsappUrl(result.whatsappUrl)
                }
                const nextUrl = result.invoiceId ? `/${gymSlug}/invoices/${result.invoiceId}` : `/${gymSlug}/members`
                setRedirectUrl(nextUrl)

                toast.success("Member created successfully", {
                    description: `${data.name} has been added.`,
                })
            }
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong", {
                description: "Please try again."
            })
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
            >
                <div className="mb-6 p-4 bg-emerald-50 rounded-full">
                    <SuccessCheckmark />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Member Added!</h2>
                <p className="text-slate-500 mb-8 max-w-sm">The member profile has been generated successfully and all systems are updated.</p>

                <div className="flex flex-col gap-4 w-full max-w-xs">
                    {whatsappUrl && (
                        <Button
                            className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg hover:shadow-emerald-500/20 transition-all font-bold"
                            onClick={() => window.open(whatsappUrl, "_blank")}
                        >
                            <Phone className="w-4 h-4 mr-2" />
                            Send Welcome WhatsApp
                        </Button>
                    )}
                    <Button
                        variant={whatsappUrl ? "outline" : "default"}
                        className={cn(
                            "w-full h-12 rounded-xl font-bold transition-all",
                            !whatsappUrl ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" : "border-slate-200"
                        )}
                        onClick={() => router.push(redirectUrl || `/${gymSlug}/members`)}
                    >
                        {redirectUrl?.includes('invoices') ? 'View Invoice' : 'Back to Members'}
                    </Button>
                </div>
            </motion.div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="bg-white/40 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl space-y-6">
                                <div className="flex items-center gap-2 mb-2 pb-4 border-b border-slate-100">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Personal Information</h3>
                                        <p className="text-xs text-slate-500">Basic details of the new member</p>
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">Full Name</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Input
                                                        placeholder="Nikhil Pal"
                                                        {...field}
                                                        className="pl-4 h-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const formatted = val
                                                                .split(' ')
                                                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                                .join(' ');
                                                            field.onChange(formatted);
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">Mobile Number</FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Input placeholder="9876543210" {...field} className="pl-4 h-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">Email Address <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Input placeholder="nikhil@example.com" type="email" {...field} className="pl-4 h-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">Date of Birth {dobMandatory && <span className="text-red-500">*</span>}</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="h-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="bg-white/40 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl space-y-4">
                                <div className="flex items-center gap-2 mb-2 pb-2">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900">Address Details</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="pincode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Pincode</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="110001" maxLength={6} {...field} value={field.value || ""} className="h-11 bg-white/50 border-slate-200 rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 bg-white/50 border-slate-200 rounded-xl">
                                                            <SelectValue placeholder="Select state" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl overflow-hidden backdrop-blur-xl">
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
                                                        {field.value && !["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"].includes(field.value) && (
                                                            <SelectItem value={field.value}>{field.value}</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Delhi" {...field} value={field.value || ""} className="h-11 bg-white/50 border-slate-200 rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="bg-white/40 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl space-y-4">
                                <div className="flex items-center gap-2 mb-2 pb-2">
                                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900">Emergency Contact</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="emergencyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Contact Name" {...field} value={field.value || ""} className="h-11 bg-white/50 border-slate-200 rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="emergencyPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="9876543210" {...field} value={field.value || ""} className="h-11 bg-white/50 border-slate-200 rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="emergencyRelation"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Relation</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Spouse, Parent..." {...field} value={field.value || ""} className="h-11 bg-white/50 border-slate-200 rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="bg-white/40 backdrop-blur-md border border-emerald-500/20 bg-emerald-50/10 p-6 rounded-2xl shadow-xl space-y-4">
                                <div className="flex items-center gap-2 mb-2 pb-2">
                                    <h3 className="font-semibold text-slate-900">Legal & Consents</h3>
                                </div>
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="whatsappConsentGiven"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-white">
                                                <FormControl>
                                                    <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 text-emerald-600 rounded border-gray-300 mt-1" />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>WhatsApp Communications</FormLabel>
                                                    <p className="text-xs text-slate-500">I consent to receiving transactional updates on WhatsApp.</p>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="marketingConsentGiven"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-white">
                                                <FormControl>
                                                    <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 text-emerald-600 rounded border-gray-300 mt-1" />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Marketing & Offers</FormLabel>
                                                    <p className="text-xs text-slate-500">I consent to receiving promotional offers and newsletters via Email/WhatsApp. <a href="/privacy" target="_blank" className="text-blue-500 hover:underline">Privacy Policy</a></p>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {!member && activePlans.length > 0 ? (
                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="button"
                                        onClick={onNextStep}
                                        disabled={checkingPhone}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px] h-12 rounded-xl shadow-lg border-none"
                                    >
                                        {checkingPhone ? "Checking phone..." : "Next: Select Plan"}
                                        {!checkingPhone && <ArrowRight className="ml-2 w-4 h-4" />}
                                    </Button>
                                </div>
                            ) : (
                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px] h-12 rounded-xl shadow-lg border-none"
                                    >
                                        {isSubmitting ? "Saving..." : "Save Member"}
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 2 && !member && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="bg-white/40 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-900">Membership & Billing</h3>
                                        <p className="text-sm text-slate-500">Configure the initial subscription and payment.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="planId"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">Choose Membership Plan</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-14 bg-white/50 border-slate-200 rounded-xl hover:bg-white transition-colors">
                                                            <SelectValue placeholder="No Plan (Skip Billing)" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="max-h-[300px] rounded-xl overflow-hidden backdrop-blur-xl">
                                                        <SelectItem value="none" className="font-medium text-slate-500 py-3">Skip Billing For Now</SelectItem>
                                                        {activePlans.map(plan => (
                                                            <SelectItem key={plan.id} value={plan.id} className="py-3">
                                                                <div className="flex items-center justify-between w-full">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-slate-900">{plan.name}</span>
                                                                        <span className="text-xs text-slate-500">{plan.duration} Month{plan.duration !== 1 ? 's' : ''}</span>
                                                                    </div>
                                                                    <div className="bg-blue-50 px-2 py-1 rounded-md ml-4">
                                                                        <span className="text-blue-700 font-bold tabular-nums">
                                                                            ₹{Number(plan.price).toLocaleString('en-IN')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {field.value && field.value !== 'none' && (() => {
                                                    const selectedPlan = activePlans.find(p => p.id === field.value)
                                                    if (!selectedPlan) return null
                                                    const expiry = new Date()
                                                    expiry.setMonth(expiry.getMonth() + selectedPlan.duration)
                                                    return (
                                                        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                            <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                            <span className="text-sm text-emerald-700 font-medium">
                                                                Expires on: {expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    )
                                                })()}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <AnimatePresence>
                                        {form.watch('planId') && form.watch('planId') !== 'none' && (
                                            <>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="md:col-span-1"
                                                >
                                                    <FormField
                                                        control={form.control}
                                                        name="customPrice"
                                                        render={({ field }) => {
                                                            const selectedPlan = activePlans.find(p => p.id === form.watch('planId'))
                                                            return (
                                                                <FormItem>
                                                                    <FormLabel className="text-sm font-semibold text-slate-700">Membership Price (₹)</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            placeholder={selectedPlan ? `Suggested: ₹${Number(selectedPlan.price).toLocaleString('en-IN')}` : 'Enter price'}
                                                                            className="h-12 bg-white/50 border-slate-200 rounded-xl focus:bg-white transition-all"
                                                                            {...field}
                                                                            value={field.value ?? ''}
                                                                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )
                                                        }}
                                                    />
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ delay: 0.1 }}
                                                    className="md:col-span-1"
                                                >
                                                    <FormField
                                                        control={form.control}
                                                        name="paymentMethod"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-sm font-semibold text-slate-700">Payment Secured Via</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-12 bg-white/50 border-slate-200 rounded-xl hover:bg-white transition-colors">
                                                                            <SelectValue placeholder="Select payment method" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="rounded-xl overflow-hidden backdrop-blur-xl">
                                                                        <SelectItem value="CASH">CASH - Physical tender</SelectItem>
                                                                        <SelectItem value="UPI">UPI - Digital wallet / QR Code</SelectItem>
                                                                        <SelectItem value="CARD">CARD - Credit/Debit swipe</SelectItem>
                                                                        <SelectItem value="OTHER">OTHER - Alternative method</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="md:col-span-1"
                                                >
                                                    <FormField
                                                        control={form.control}
                                                        name="discount"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-sm font-semibold text-slate-700">Discount Given (₹)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        placeholder="0"
                                                                        className="h-12 bg-white/50 border-slate-200 rounded-xl focus:bg-white transition-all"
                                                                        {...field}
                                                                        onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ delay: 0.25 }}
                                                    className="md:col-span-2"
                                                >
                                                    <FormField
                                                        control={form.control}
                                                        name="customEndDate"
                                                        render={({ field }) => {
                                                            const selectedPlan = activePlans.find(p => p.id === form.watch('planId'))
                                                            const autoEndDate = selectedPlan
                                                                ? new Date(new Date().setMonth(new Date().getMonth() + selectedPlan.duration)).toISOString().split('T')[0]
                                                                : ''
                                                            return (
                                                                <FormItem>
                                                                    <FormLabel className="text-sm font-semibold text-slate-700">
                                                                        Custom Expiry Date
                                                                        <span className="text-xs font-normal text-slate-400 ml-1">(Optional — overrides plan duration)</span>
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="date"
                                                                            placeholder={autoEndDate}
                                                                            className="h-12 bg-white/50 border-slate-200 rounded-xl focus:bg-white transition-all"
                                                                            {...field}
                                                                            value={field.value ?? ''}
                                                                        />
                                                                    </FormControl>
                                                                    {!field.value && autoEndDate && (
                                                                        <p className="text-xs text-slate-400 mt-1">Auto: expires {autoEndDate}</p>
                                                                    )}
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )
                                                        }}
                                                    />
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="md:col-span-1"
                                                >
                                                    <FormField
                                                        control={form.control}
                                                        name="amountPaid"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-sm font-semibold text-slate-700">Amount Paid Now (₹)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        placeholder="Full Amount"
                                                                        className="h-12 bg-white/50 border-blue-200 focus:border-blue-400 focus:ring-blue-100 rounded-xl focus:bg-white transition-all"
                                                                        {...field}
                                                                        onChange={e => {
                                                                            setUserEditedAmount(true)
                                                                            field.onChange(e.target.valueAsNumber || 0)
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.4 }}
                                                    className="md:col-span-2 pt-2"
                                                >
                                                    <Card className="border-emerald-100 bg-emerald-50/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm">
                                                        <CardContent className="p-5 flex items-start gap-4">
                                                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-emerald-900">One-Step Activation</p>
                                                                <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
                                                                    Creating this member will automatically generate their <strong>profile</strong>, activate the <strong>subscription</strong>, and issue a formal <strong>tax invoice</strong>.
                                                                </p>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-6">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep(1)}
                                    disabled={isSubmitting}
                                    className="rounded-xl px-6"
                                >
                                    Back to details
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    size="lg"
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white min-w-[220px] h-14 rounded-xl shadow-lg border-none hover:shadow-emerald-500/25 transition-all"
                                >
                                    {isSubmitting ? "Processing..." : "Finish & Create Invoice"}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </Form>
    )
}
