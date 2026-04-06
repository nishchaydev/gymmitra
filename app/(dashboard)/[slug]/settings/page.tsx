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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Save, Building2, Users, Upload, QrCode, CreditCard, ClipboardList, Bell, Receipt, CheckCircle2, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StaffManagement } from "@/components/settings/StaffManagement"
import { PlanManagement } from "@/components/settings/PlanManagement"
import { BillingSettings } from "@/components/settings/BillingSettings"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { QRPosterSection } from "@/components/settings/QRPosterSection"
import { WhatsAppTemplates } from "@/components/settings/WhatsAppTemplates"
import { NotificationSettings } from "@/components/settings/NotificationSettings"

import { SettingsSidebar } from "@/components/settings/SettingsSidebar"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

const RESERVED_SLUGS = ['api', 'admin', 'settings', 'auth', 'login', 'register', 'dashboard', 'profile', 'root', 'static', 'public', 'gymmitra', 'official'];

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
    dobMandatory: z.boolean().optional(),
    taxEnabled: z.boolean().optional(),
    taxPercentage: z.number().min(0).max(100).optional(),
    slug: z.string()
        .min(2, "Slug must be at least 2 characters")
        .max(100, "Slug must be less than 100 characters")
        .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
        .refine(val => !RESERVED_SLUGS.includes(val.toLowerCase()), {
            message: "This slug is reserved and cannot be used"
        })
        .optional(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
    const { slug } = useParams() as { slug: string }
    const searchParams = useSearchParams()
    const router = useRouter()
    
    // Default to the tab specified in the URL, or 'profile' if not provided
    const defaultTab = searchParams.get('tab') || 'profile'
    const [activeTab, setActiveTab] = useState(defaultTab)
    const [loading, setLoading] = useState(true)
    const [gymName, setGymName] = useState('')
    const [saving, setSaving] = useState(false)
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

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
            dobMandatory: false,
            taxEnabled: true,
            taxPercentage: 18,
            slug: "",
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
                        dobMandatory: data.dobMandatory || false,
                        taxEnabled: data.taxEnabled ?? true,
                        taxPercentage: Number(data.taxPercentage ?? 18),
                        slug: data.slug || "",
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

    const onSubmit = async (values: SettingsFormValues) => {
        setSaving(true)
        try {
            const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to update settings")
            }

            toast.success("Settings updated successfully")
            setGymName(values.name)
            router.refresh()

            if (values.slug && values.slug !== slug) {
                toast.loading("Slug changed. Redirecting to new dashboard...")
                setTimeout(() => {
                    window.location.href = `/${values.slug}/settings`
                }, 1500)
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("An unknown error occurred")
            }
        } finally {
            setSaving(false)
        }
    }

    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
        setIsMobileNavOpen(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-4 md:p-10 pb-20 max-w-7xl mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 capitalize">Settings</h1>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-primary border-primary/20 bg-primary/5">Configuration</Badge>
                    </div>
                    <p className="text-slate-500 font-medium text-sm">
                        Manage your gym profile, staff, billing and integrations.
                    </p>
                </div>

                <div className="md:hidden">
                    <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="w-full flex justify-between items-center group">
                                <div className="flex items-center gap-2 uppercase text-[10px] font-black tracking-widest text-slate-500 group-hover:text-primary transition-colors">
                                    <Menu className="h-4 w-4" />
                                    Menu
                                </div>
                                <span className="text-xs font-bold text-slate-900 capitalize px-2 py-0.5 rounded-md bg-slate-100 uppercase tracking-tighter">
                                    {activeTab.replace('-', ' ')}
                                </span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85vw] p-0">
                            <SheetHeader className="p-6 border-b border-slate-50">
                                <SheetTitle className="text-xl font-black tracking-tighter uppercase italic">GymMitra Settings</SheetTitle>
                            </SheetHeader>
                            <div className="p-4">
                                <SettingsSidebar activeTab={activeTab} setActiveTab={handleTabChange} slug={slug} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <aside className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-24">
                        <SettingsSidebar activeTab={activeTab} setActiveTab={handleTabChange} slug={slug} />
                        
                        <div className="mt-8 p-6 rounded-2xl bg-slate-950 text-white relative overflow-hidden group">
                           <div className="relative z-10">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-1">Need Help?</h4>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Our support team is available 24/7 to assist you. Contact us for any technical issues.</p>
                                <Button size="sm" className="mt-4 w-full h-8 text-[10px] font-black uppercase tracking-widest bg-white text-slate-950 hover:bg-slate-100 rounded-lg border-none shadow-lg">
                                    Contact Support
                                </Button>
                           </div>
                           <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
                        </div>
                    </div>
                </aside>

                <main className="lg:col-span-9 min-h-[600px]">
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {activeTab === 'profile' ? (
                            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden ring-1 ring-slate-100">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                                    <CardTitle className="text-xl font-bold text-slate-900">Gym Profile</CardTitle>
                                    <CardDescription className="text-slate-500 font-medium italic">
                                        This information will be displayed on invoices and communications.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold text-slate-700">Gym Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="GymMitra" className="rounded-xl h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all" {...field} />
                                                            </FormControl>
                                                            <FormDescription className="text-[10px] font-medium text-slate-400">
                                                                This is your public display name.
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="slug"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold text-slate-700">Gym Subdomain / Slug</FormLabel>
                                                            <FormControl>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-slate-400 text-sm font-medium">gymmitra.site/</span>
                                                                    <Input 
                                                                        placeholder="gym-name" 
                                                                        {...field} 
                                                                        value={field.value || ""}
                                                                        className="font-mono text-sm rounded-xl h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-primary font-bold" 
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormDescription className="text-[10px] font-medium text-slate-400">
                                                                Unique URL identifier. Supports lowercase letters, numbers, and hyphens.
                                                                <span className="block text-red-400/80 mt-1 uppercase font-black tracking-tighter">Changing this will update your dashboard's link.</span>
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="ownerName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold text-slate-700">Owner Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Nikhil Pal" className="rounded-xl h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all" {...field} />
                                                            </FormControl>
                                                            <FormDescription className="text-[10px] font-medium text-slate-400">
                                                                Owner or Manager name.
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold text-slate-700">Email</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="admin@example.com" className="rounded-xl h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all" {...field} />
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
                                                            <FormLabel className="font-bold text-slate-700">Phone</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="9876543210" className="rounded-xl h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all" {...field} />
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
                                                        <FormLabel className="font-bold text-slate-700">Address</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="123 Main St, City, State" className="rounded-xl h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all" {...field} />
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
                                                        <FormLabel className="font-bold text-slate-700">GST Number <span className="text-[10px] text-slate-400 font-medium">(Optional)</span></FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="22AAAAA0000A1Z5" className="rounded-xl h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Tax Configuration Section */}
                                            <div className="space-y-4 pt-2">
                                                <Separator />
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Receipt className="w-4 h-4 text-emerald-600" />
                                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Tax Configuration</h3>
                                                </div>

                                                <FormField
                                                    control={form.control}
                                                    name="taxEnabled"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-base font-bold text-slate-700">Collect GST on Invoices?</FormLabel>
                                                                <FormDescription className="text-xs text-slate-500">
                                                                    {field.value
                                                                        ? `GST will be auto-applied at ${form.watch('taxPercentage') || 18}% on all new invoices.`
                                                                        : 'No tax will be added to invoices. Enable this if your gym collects GST.'}
                                                                </FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                {form.watch('taxEnabled') && (
                                                    <FormField
                                                        control={form.control}
                                                        name="taxPercentage"
                                                        render={({ field }) => (
                                                            <FormItem className="max-w-xs">
                                                                <FormLabel className="font-bold text-slate-700">Default Tax Rate</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min={0}
                                                                            max={100}
                                                                            step={0.5}
                                                                            value={field.value}
                                                                            onChange={(e) => field.onChange(Math.min(100, Math.max(0, Number(e.target.value))))}
                                                                            className="pr-8 rounded-xl h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                                                                    </div>
                                                                </FormControl>
                                                                <FormDescription className="text-[10px] font-medium text-slate-400">
                                                                    Standard GST for fitness services in India is 18%. Override per-invoice is allowed.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}

                                                {/* Status indicator */}
                                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${
                                                    form.watch('taxEnabled')
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                }`}>
                                                    {form.watch('taxEnabled') ? (
                                                        <>
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Tax: Enabled at {form.watch('taxPercentage') || 18}% GST
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                            Tax: Disabled — Invoices without GST
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="dobMandatory"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base font-bold text-slate-700">Make Date of Birth Mandatory</FormLabel>
                                                            <FormDescription className="text-xs text-slate-500">
                                                                If enabled, members will be required to provide their DOB during registration.
                                                            </FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="termsAndConditions"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-slate-700">Custom Terms & Conditions</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="1. Membership fees are non-refundable.&#10;2. Members must carry their ID card.&#10;3. Timings: 5AM–10PM daily."
                                                                className="rounded-2xl min-h-[120px] bg-slate-50/50 border-slate-200 focus:bg-white transition-all resize-none"
                                                                maxLength={1000}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <div className="flex justify-between items-center mt-2 px-1">
                                                            <span className="text-[10px] font-medium text-slate-400 italic">These will appear on all your invoices. Max 1000 characters.</span>
                                                            <Badge variant="outline" className="text-[10px] font-black tracking-tighter tabular-nums bg-slate-50 border-slate-200">
                                                                {field.value?.length || 0}/1000
                                                            </Badge>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            
                                            <div className="flex justify-end pt-4">
                                                <Button type="submit" disabled={saving} className="h-12 rounded-xl px-8 font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
                                                    {saving ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="mr-2 h-4 w-4" />
                                                    )}
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        ) : activeTab === 'qr-poster' ? (
                            <QRPosterSection slug={slug} gymName={gymName} />
                        ) : activeTab === 'staff' ? (
                            <StaffManagement />
                        ) : activeTab === 'billing' ? (
                            <BillingSettings />
                        ) : activeTab === 'notifications' ? (
                            <NotificationSettings />
                        ) : activeTab === 'import-members' ? (
                            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                                <Upload className="h-12 w-12 text-primary/40" />
                                <h3 className="text-lg font-bold text-slate-700">Import Members</h3>
                                <p className="text-sm text-slate-500 text-center max-w-md">Bulk import your members from a CSV file. Download the template, fill in your data, and upload.</p>
                                <Link href={`/${slug}/settings/import`}>
                                    <Button className="mt-2 h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
                                        <Upload className="mr-2 h-4 w-4" /> Go to Import Page
                                    </Button>
                                </Link>
                            </div>
                        ) : activeTab === 'whatsapp' ? (
                            <WhatsAppTemplates form={form} onSubmit={onSubmit} saving={saving} />
                        ) : activeTab === 'plans' ? (
                            <PlanManagement />
                        ) : null}
                    </div>
                </main>
            </div>
        </div>
    )
}
