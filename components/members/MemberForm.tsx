"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
import { ArrowRight, FileText, CheckCircle2 } from "lucide-react"

// Import removed: Server Action is now passed as a prop or called from the parent page due to dynamic routing

const memberFormSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    phone: z.string().min(10, {
        message: "Phone number must be at least 10 digits.",
    }),
    email: z.string().email("Valid email is required to send the welcome message"),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date",
    }),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
    planId: z.string().optional().or(z.literal('none')),
    paymentMethod: z.enum(["CASH", "UPI", "CARD", "OTHER"]).optional(),
    discount: z.coerce.number().nonnegative().optional().default(0),
})

type MemberFormValues = z.infer<typeof memberFormSchema>

// Define MemberFormProps type
interface MemberFormProps {
    member?: (Partial<Omit<MemberFormValues, 'dateOfBirth'>> & { dateOfBirth?: Date | string; id?: string }) | null;
    gymSlug: string;
    onSubmitAction: (data: any) => Promise<{ success?: boolean, error?: string, id?: string, invoiceId?: string }>;
    activePlans?: { id: string, name: string, price: any, duration: number }[];
}

export default function MemberForm({ member, gymSlug, onSubmitAction, activePlans = [] }: MemberFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [step, setStep] = useState(1)

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
            planId: "none",
            paymentMethod: "CASH" as const,
            discount: 0,
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
            planId: "none",
            paymentMethod: "CASH" as const,
            discount: 0,
        }
    }, [member, searchParams])

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

    const onNextStep = async () => {
        const isValid = await form.trigger(["name", "phone", "email", "dateOfBirth"])
        if (isValid) {
            setStep(2)
        }
    }

    async function onSubmit(data: MemberFormValues) {
        setIsSubmitting(true)
        try {
            const result = await onSubmitAction(data as any)

            if (result?.error) {
                toast.error(result.error)
                setIsSubmitting(false)
                return
            }

            if (result?.success) {
                setSuccess(true)
                if (result.invoiceId) {
                    toast.success("Member created! Welcome email sent.", {
                        description: `${data.name} is active. Redirecting to invoice...`,
                    })
                    submitTimeoutRef.current = setTimeout(() => {
                        router.push(`/${gymSlug}/invoices/${result.invoiceId}`)
                    }, 1500)
                } else {
                    toast.success("Member created successfully", {
                        description: `${data.name} has been added. Welcome email sent.`,
                    })
                    submitTimeoutRef.current = setTimeout(() => {
                        router.push(`/${gymSlug}/members`)
                    }, 1500)
                }
            }
        } catch {
            toast.error("Something went wrong", {
                description: "Please try again."
            })
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                <SuccessCheckmark />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Member Added!</h2>
                <p className="text-slate-500">Redirecting you to the members list...</p>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                {step === 1 && (
                    <>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
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
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="9876543210" {...field} />
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
                                        <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="john@example.com" type="email" {...field} />
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
                                    <FormLabel>Date of Birth</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4 border p-4 rounded-md">
                            <h3 className="font-medium text-sm text-gray-500">Emergency Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="emergencyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Jane Doe" {...field} />
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
                                                <Input placeholder="9876543210" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="emergencyRelation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Relation</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Spouse, Parent..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {!member && activePlans.length > 0 ? (
                            <div className="flex justify-end pt-4 border-t mt-8">
                                <Button type="button" onClick={onNextStep}>
                                    Next: Select Plan <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="pt-4 border-t mt-8">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting
                                        ? (member ? "Updating..." : "Creating...")
                                        : (member ? "Update Member" : "Create Member")}
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {step === 2 && !member && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Initial Membership Plan</h3>
                                <p className="text-sm text-muted-foreground">Select a plan to automatically assign a subscription and generate an invoice.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 px-1 rounded-xl">
                            <FormField
                                control={form.control}
                                name="planId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold text-slate-800">Choose Membership</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 bg-white">
                                                    <SelectValue placeholder="No Plan (Skip Billing)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none" className="font-medium text-slate-600">Skip Billing For Now</SelectItem>
                                                {activePlans.map(plan => (
                                                    <SelectItem key={plan.id} value={plan.id}>
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className="font-medium">{plan.name}</span>
                                                            <span className="text-muted-foreground tabular-nums ml-4">
                                                                ₹{Number(plan.price).toFixed(2)} · {plan.duration} Month{plan.duration !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.watch('planId') && form.watch('planId') !== 'none' && (
                                <FormField
                                    control={form.control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem className="animate-in fade-in duration-300">
                                            <FormLabel className="text-base font-semibold text-slate-800">Payment Secured Via</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 bg-white">
                                                        <SelectValue placeholder="Select payment method" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
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
                            )}

                            <FormField
                                control={form.control}
                                name="discount"
                                render={({ field }) => (
                                    <FormItem className="animate-in fade-in duration-300">
                                        <FormLabel className="text-base font-semibold text-slate-800">Discount Given (₹)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                className="h-12 bg-white"
                                                {...field}
                                                onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {form.watch('planId') && form.watch('planId') !== 'none' && (
                            <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm">
                                <CardContent className="p-4 flex items-start gap-4">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-900">Seamless Creation Flow</p>
                                        <p className="text-sm text-emerald-700/90 mt-1 leading-relaxed">
                                            Clicking Create will provision the user&apos;s profile, activate their subscription, and generate their formal tax invoice in one step! You will be redirected right to the generated invoice.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-between pt-6 border-t mt-8">
                            <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={isSubmitting}>
                                Back
                            </Button>
                            <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[200px]">
                                {isSubmitting ? "Processing..." : "Create & Invoice"}
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </Form>
    )
}
