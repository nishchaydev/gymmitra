"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Bell, Mail, MessageSquare, Smartphone, Zap, Shield } from "lucide-react"
import { toast } from "sonner"

export function NotificationSettings() {
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        email_renewals: true,
        email_reports: false,
        whatsapp_alerts: true,
        whatsapp_marketing: false,
        system_updates: true,
        security_alerts: true,
    })

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const saveSettings = async () => {
        setSaving(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast.success("Notification preferences updated")
        setSaving(false)
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h3 className="text-lg font-medium">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">
                    Choose how and when you want to be notified about gym activities.
                </p>
            </div>

            <div className="grid gap-6">
                <Card className="border-slate-200/60 shadow-sm">
                    <CardHeader className="pb-3 text-rose-600">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <CardTitle className="text-base">Email Notifications</CardTitle>
                        </div>
                        <CardDescription>Configure alerts sent to your registered email address.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-0.5">
                                <Label className="text-sm font-semibold">Membership Renewals</Label>
                                <p className="text-xs text-muted-foreground">Receive daily summaries of upcoming and expired memberships.</p>
                            </div>
                            <Switch checked={settings.email_renewals} onCheckedChange={() => handleToggle('email_renewals')} />
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-0.5">
                                <Label className="text-sm font-semibold">Weekly Performance Reports</Label>
                                <p className="text-xs text-muted-foreground">Get a detailed PDF report of gym growth and revenue every Monday.</p>
                            </div>
                            <Switch checked={settings.email_reports} onCheckedChange={() => handleToggle('email_reports')} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm">
                    <CardHeader className="pb-3 text-emerald-600">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <CardTitle className="text-base">WhatsApp Alerts</CardTitle>
                        </div>
                        <CardDescription>Instant notifications via WhatsApp for critical gym events.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-0.5">
                                <Label className="text-sm font-semibold">Critical Staff Alerts</Label>
                                <p className="text-xs text-muted-foreground">Get notified when important actions are taken by staff members.</p>
                            </div>
                            <Switch checked={settings.whatsapp_alerts} onCheckedChange={() => handleToggle('whatsapp_alerts')} />
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-0.5">
                                <Label className="text-sm font-semibold">Marketing Campaign Updates</Label>
                                <p className="text-xs text-muted-foreground">Receive status updates on your automated WhatsApp campaigns.</p>
                            </div>
                            <Switch checked={settings.whatsapp_marketing} onCheckedChange={() => handleToggle('whatsapp_marketing')} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm">
                    <CardHeader className="pb-3 text-blue-600">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <CardTitle className="text-base">Security & System</CardTitle>
                        </div>
                        <CardDescription>Essential alerts regarding your account and GymMitra updates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-0.5">
                                <Label className="text-sm font-semibold">Feature Updates</Label>
                                <p className="text-xs text-muted-foreground">Stay informed about new tools and improvements to GymMitra.</p>
                            </div>
                            <Switch checked={settings.system_updates} onCheckedChange={() => handleToggle('system_updates')} />
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-0.5">
                                <Label className="text-sm font-semibold">Security Alerts</Label>
                                <p className="text-xs text-muted-foreground">Notifications for new logins or password changes.</p>
                            </div>
                            <Switch checked={settings.security_alerts} onCheckedChange={() => handleToggle('security_alerts')} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={saveSettings} disabled={saving} className="bg-primary hover:bg-primary/90 text-white px-8">
                    {saving ? "Saving..." : "Save Preferences"}
                </Button>
            </div>
        </div>
    )
}
