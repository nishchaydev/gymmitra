'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, ShieldCheck, CreditCard, AlertTriangle, CheckCircle2, Copy, ExternalLink, Mail, Phone, Eye, EyeOff } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { activateLicense } from "@/app/actions/saas-actions"
import { formatDistanceToNow, isAfter } from "date-fns"

interface BillingSettingsProps {}

export function BillingSettings({}: BillingSettingsProps) {
    const [loading, setLoading] = useState(true)
    const [gymData, setGymData] = useState<any>(null)
    const [licenseKey, setLicenseKey] = useState('')
    const [activating, setActivating] = useState(false)
    const [showKey, setShowKey] = useState(false)

    const fetchBillingData = async () => {
        try {
            const res = await fetch('/api/settings') // Reuse existing settings API
            if (res.ok) {
                const data = await res.json()
                setGymData(data)
            } else {
                toast.error("Failed to load billing data: Server error")
            }
        } catch (err) {
            toast.error("Failed to load billing data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBillingData()
    }, [])

    const handleActivate = async () => {
        if (!licenseKey.trim()) {
            toast.error("Please enter a license key")
            return
        }

        setActivating(true)
        try {
            const result = await activateLicense(licenseKey)
            if (result.success) {
                toast.success("License activated successfully! Your plan is now MAIN PLAN.")
                setLicenseKey('')
                fetchBillingData()
            } else {
                toast.error(result.error || "Invalid license key")
            }
        } catch (err) {
            toast.error("An error occurred during activation")
        } finally {
            setActivating(false)
        }
    }

    if (loading) return <div className="flex h-32 items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

    const isTrial = gymData?.saasPlan === 'TRIAL'
    const expiryDate = gymData?.trialExpiresAt ? new Date(gymData.trialExpiresAt) : null
    const isExpired = expiryDate ? !isAfter(expiryDate, new Date()) : false
    
    // Calculate progress (Trial starts at 30 days)
    const totalTrialDays = 30
    const remainingDays = expiryDate 
        ? Math.min(totalTrialDays, Math.max(0, Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))))
        : 0
    const progressPercent = Math.min(100, Math.max(0, (remainingDays / totalTrialDays) * 100))

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">SaaS Subscription</CardTitle>
                            <CardDescription>Manage your Gym Mitra ERP plan and license.</CardDescription>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isTrial ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                            {isTrial ? 'Trial Mode' : 'Main Plan Activated'}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {isTrial ? (
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 mb-1">Trial Version (30 Days)</h3>
                                    <p className="text-slate-500 text-sm mb-4">
                                        You are currently using the full-featured trial of Gym Mitra ERP. 
                                        {isExpired ? (
                                            <span className="text-rose-600 font-semibold block mt-1">
                                                Your trial expired {expiryDate ? formatDistanceToNow(expiryDate) : ''} ago.
                                            </span>
                                        ) : (
                                            <span className="block mt-1">
                                                Expires in <span className="text-slate-900 font-semibold">{remainingDays} days</span> ({expiryDate?.toLocaleDateString()}).
                                            </span>
                                        )}
                                    </p>
                                    
                                    {!isExpired && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-slate-400 font-medium">
                                                <span>Trial Progress</span>
                                                <span>{remainingDays} days left</span>
                                            </div>
                                            <Progress value={progressPercent} className="h-2 bg-slate-100" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isExpired && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 items-start">
                                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-rose-900 font-bold text-sm">Action Required: Data Removal Warning</h4>
                                        <p className="text-rose-700 text-xs mt-1">
                                            Your access is restricted. As per our policy, inactive trial accounts are deleted 
                                            <span className="font-bold"> 15 days </span> after expiry. Please activate your license to save your data.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Separator />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="license" className="text-slate-900 font-bold">Activate Main Plan License</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            id="license"
                                            placeholder="Enter your 16-digit license key" 
                                            value={licenseKey}
                                            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                                            className="font-mono tracking-widest uppercase"
                                            disabled={activating}
                                        />
                                        <Button 
                                            onClick={handleActivate} 
                                            disabled={activating || !licenseKey}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {activating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Activate
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        License keys are provided by E-MITRA TECHNOLOGIES after payment verification.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-6 bg-green-50 border border-green-100 rounded-2xl">
                                <div className="p-3 bg-white rounded-full shadow-sm">
                                    <ShieldCheck className="w-8 h-8 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-green-900 font-bold text-lg">Lifetime License Activated</h3>
                                    <p className="text-green-700 text-sm">
                                        Your gym is powered by <span className="font-bold">Main Plan</span>. 
                                        Thank you for being a valued partner.
                                    </p>
                                    {gymData?.licenseActivatedAt && (
                                        <p className="text-green-600/70 text-[10px] uppercase tracking-wider mt-2 font-medium">
                                            Activated on {new Date(gymData.licenseActivatedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 border rounded-xl">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">License Key</span>
                                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <code className="text-slate-900 font-mono font-bold flex-1">
                                            {showKey ? gymData?.licenseKey : `•••• •••• •••• ${gymData?.licenseKey?.slice(-4) || '••••'}`}
                                        </code>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowKey(!showKey)}>
                                                {showKey ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                if (gymData?.licenseKey) {
                                                    navigator.clipboard.writeText(gymData.licenseKey)
                                                        .then(() => toast.success("License key copied"))
                                                        .catch(() => toast.error("Failed to copy license key to clipboard"))
                                                }
                                            }}>
                                                <Copy className="w-3 h-3 text-slate-400" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 border rounded-xl">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Support ID</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-900 font-bold font-mono">{gymData?.id?.slice(0, 8).toUpperCase() || 'N/A'}</span>
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-500" />
                        Need Help or New License?
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                            <p className="text-sm text-slate-500">
                                Contact E-MITRA TECHNOLOGIES support team for license purchase, renewals or technical assistance.
                            </p>
                            <div className="flex flex-col gap-2 pt-2">
                                <a href="tel:+918118818812" className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 transition-colors">
                                    <Phone className="w-4 h-4" /> +91 811 881 8812
                                </a>
                                <a href="mailto:support@emitra.club" className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 transition-colors">
                                    <Mail className="w-4 h-4" /> support@emitra.club
                                </a>
                            </div>
                        </div>
                        <div className="md:w-px md:h-24 bg-slate-100 hidden md:block" />
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Quick Actions</h4>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <a href="https://emitra.club" target="_blank" rel="noopener noreferrer">
                                        Official Website <ExternalLink className="w-3 h-3 ml-2" />
                                    </a>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <a href="https://emitra.club/terms" target="_blank" rel="noopener noreferrer">
                                        Terms of Service
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function Separator() {
    return <div className="h-px bg-slate-100 my-4" />
}
