"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Save, Building2, Users, Upload, QrCode } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StaffManagement } from "@/components/settings/StaffManagement"
import { PlanManagement } from "@/components/settings/PlanManagement"
import Link from "next/link"
import { useParams } from "next/navigation"
import { QRPosterSection } from "@/components/settings/QRPosterSection"
import { ClipboardList } from "lucide-react"

import { WhatsAppTemplates } from "@/components/settings/WhatsAppTemplates"

const settingsSchema = z.object({
    name: z.string().min(2, "Name is required"),
    ownerName: z.string().min(2, "Owner name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    address: z.string().optional(),
    gst: z.string().optional(),
    termsAndConditions: z.string().max(1000).optional(),
    waWelcomeMsg: z.string().max(2000).optional().nullable(),
    waInvoiceMsg: z.string().max(2000).optional().nullable(),
    waRenewalMsg: z.string().max(2000).optional().nullable(),
    waOverdueMsg: z.string().max(2000).optional().nullable(),
    saasPlan: z.enum(['BASIC', 'GROWTH', 'ENTERPRISE']).optional(),
    planTier: z.enum(['STARTER', 'GROWTH', 'PRO', 'ELITE']).optional(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
    const { slug } = useParams() as { slug: string }
    const [activeTab, setActiveTab] = useState('profile')
    const [loading, setLoading] = useState(true)
    const [gymName, setGymName] = useState('')
    const [saving, setSaving] = useState(false)

     const form = useForm<SettingsFormValues>({
         resolver: zodResolver(settingsSchema),
         defaultValues: {
             name: "",
             ownerName: "",
             email: "",
             phone: "",
             address: "",
             gst: "",
             termsAndConditions: "",
             waWelcomeMsg: "",
             waInvoiceMsg: "",
             waRenewalMsg: "",
             waOverdueMsg: "",
         },
     })

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings")
                if (response.ok) {
                    const data = await response.json()
                     form.reset({
                          name: data.name || "",
                          ownerName: data.ownerName || "",
                          email: data.email || "",
                          phone: data.phone || "",
                          address: data.address || "",
                          gst: data.gst || "",
                          termsAndConditions: data.termsAndConditions || "",
                          waWelcomeMsg: data.waWelcomeMsg || "",
                          waInvoiceMsg: data.waInvoiceMsg || "",
                          waRenewalMsg: data.waRenewalMsg || "",
                          waOverdueMsg: data.waOverdueMsg || "",
                      })
                    setGymName(data.name || '')
                }
            } catch {
                toast.error("Failed to load settings")
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [form])

    const onSubmit = async (data: SettingsFormValues) => {
        setSaving(true)
        try {
            const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to update settings")
            }

            toast.success("Settings updated successfully")
            setGymName(data.name)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 p-10 pb-16 block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your gym profile and preferences.
                </p>
            </div>
            <Separator className="my-6" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        <Button
                            variant={activeTab === 'profile' ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setActiveTab('profile')}
                        >
                            <Building2 className="mr-2 h-4 w-4" />
                            Gym Profile
                        </Button>
                        <Button
                            variant={activeTab === 'qr-poster' ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setActiveTab('qr-poster')}
                        >
                            <QrCode className="mr-2 h-4 w-4" />
                            QR Poster
                        </Button>
                        <Button
                            variant={activeTab === 'whatsapp' ? "secondary" : "ghost"}
                            className="justify-start"
                            onClick={() => setActiveTab('whatsapp')}
                        >
                            <ClipboardList className="mr-2 h-4 w-4" />
                            WhatsApp Templates
                        </Button>
                        <Link href={`/${slug}/settings/import`}>
                            <Button
                                variant="ghost"
                                className="justify-start w-full"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Import Members
                            </Button>
                        </Link>
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-2xl">
                    {activeTab === 'profile' ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Gym Profile</CardTitle>
                                <CardDescription>
                                    This information will be displayed on invoices and communications.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Gym Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Gym Mitra" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                            This is your public display name.
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="ownerName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Owner Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Nikhil Pal" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Owner/Manager name.
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="admin@example.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="+91 98765 43210" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Address</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="123 Main St, City, State" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                         <FormField
                                             control={form.control}
                                             name="gst"
                                             render={({ field }) => (
                                                 <FormItem>
                                                     <FormLabel>GST Number (Optional)</FormLabel>
                                                     <FormControl>
                                                         <Input placeholder="22AAAAA0000A1Z5" {...field} />
                                                     </FormControl>
                                                     <FormMessage />
                                                 </FormItem>
                                             )}
                                         />

                                         <FormField
                                             control={form.control}
                                             name="termsAndConditions"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Custom Terms &amp; Conditions</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="1. Membership fees are non-refundable.&#10;2. Members must carry their ID card.&#10;3. Timings: 5AM–10PM daily."
                                                            rows={5}
                                                            maxLength={1000}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="flex justify-between">
                                                        <span>These will appear on all your invoices. Max 1000 characters.</span>
                                                        <span>{field.value?.length || 0}/1000</span>
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" disabled={saving}>
                                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Save className="mr-2 h-4 w-4" /> Save Changes
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    ) : activeTab === 'qr-poster' ? (
                        <QRPosterSection slug={slug} gymName={gymName} />
                    ) : activeTab === 'whatsapp' ? (
                        <WhatsAppTemplates form={form} onSubmit={onSubmit} saving={saving} />
                    ) : null}
                </div>
            </div>
        </div>
    )
}
