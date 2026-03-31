"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Mail, MessageSquare, Shield, Info } from "lucide-react"

export function NotificationSettings() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h3 className="text-lg font-medium">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">
                    Choose how and when you want to be notified about gym activities.
                </p>
            </div>

            {/* Honest Coming Soon Banner */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                <div>
                    <p className="font-semibold">Personalised notification controls coming soon</p>
                    <p className="text-amber-700 mt-0.5">
                        All critical notifications (renewal reminders, birthday wishes, overdue alerts) are
                        currently sent automatically via the daily briefing cron. Custom toggles per notification
                        type will be available in the next release.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 opacity-60 pointer-events-none select-none">
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
                            <Switch checked={true} disabled />
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-0.5">
                                <Label className="text-sm font-semibold">Weekly Performance Reports</Label>
                                <p className="text-xs text-muted-foreground">Get a detailed PDF report of gym growth and revenue every Monday.</p>
                            </div>
                            <Switch checked={false} disabled />
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
                            <Switch checked={true} disabled />
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-0.5">
                                <Label className="text-sm font-semibold">Marketing Campaign Updates</Label>
                                <p className="text-xs text-muted-foreground">Receive status updates on your automated WhatsApp campaigns.</p>
                            </div>
                            <Switch checked={false} disabled />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm">
                    <CardHeader className="pb-3 text-blue-600">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <CardTitle className="text-base">Security &amp; System</CardTitle>
                        </div>
                        <CardDescription>Essential alerts regarding your account and GymMitra updates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-0.5">
                                <Label className="text-sm font-semibold">Feature Updates</Label>
                                <p className="text-xs text-muted-foreground">Stay informed about new tools and improvements to GymMitra.</p>
                            </div>
                            <Switch checked={true} disabled />
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-0.5">
                                <Label className="text-sm font-semibold">Security Alerts</Label>
                                <p className="text-xs text-muted-foreground">Notifications for new logins or password changes.</p>
                            </div>
                            <Switch checked={true} disabled />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-4">
                <Button disabled className="bg-primary/50 text-white px-8 cursor-not-allowed">
                    Coming Soon
                </Button>
            </div>
        </div>
    )
}
