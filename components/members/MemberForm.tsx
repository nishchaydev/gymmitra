"use client"

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
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { SuccessCheckmark } from "@/components/ui/success-animation"

// Import removed: Server Action is now passed as a prop or called from the parent page due to dynamic routing

const memberFormSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    phone: z.string().min(10, {
        message: "Phone number must be at least 10 digits.",
    }),
    email: z.string().email().optional().or(z.literal("")),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date",
    }),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
})

type MemberFormValues = z.infer<typeof memberFormSchema>

// Define MemberFormProps type
interface MemberFormProps {
    member?: (Partial<Omit<MemberFormValues, 'dateOfBirth'>> & { dateOfBirth?: Date | string; id?: string }) | null;
    gymSlug: string;
    onSubmitAction: (data: any) => Promise<{ success?: boolean, error?: string, id?: string }>;
}

export default function MemberForm({ member, gymSlug, onSubmitAction }: MemberFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        return () => {
            if (submitTimeoutRef.current) {
                clearTimeout(submitTimeoutRef.current)
            }
        }
    }, [])

    const form = useForm<MemberFormValues>({
        resolver: zodResolver(memberFormSchema) as any,
        defaultValues: member ? {
            name: member.name,
            phone: member.phone,
            email: member.email || "",
            dateOfBirth: member.dateOfBirth instanceof Date
                ? `${member.dateOfBirth.getFullYear()}-${String(member.dateOfBirth.getMonth() + 1).padStart(2, '0')}-${String(member.dateOfBirth.getDate()).padStart(2, '0')}`
                : (member.dateOfBirth || ""),
            emergencyName: member.emergencyName || "",
            emergencyPhone: member.emergencyPhone || "",
            emergencyRelation: member.emergencyRelation || "",
        } : {
            name: "",
            phone: "",
            email: "",
            dateOfBirth: "",
            emergencyName: "",
            emergencyPhone: "",
            emergencyRelation: "",
        },
    })

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
                toast.success("Member created successfully", {
                    description: `${data.name} has been added to your gym.`,
                })

                submitTimeoutRef.current = setTimeout(() => {
                    router.push(`/${gymSlug}/members`)
                }, 2000)
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
                                <FormLabel>Email (Optional)</FormLabel>
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

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? (member ? "Updating..." : "Creating...")
                        : (member ? "Update Member" : "Create Member")}
                </Button>
            </form>
        </Form>
    )
}
