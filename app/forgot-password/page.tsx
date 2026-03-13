'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getBaseUrl } from '@/lib/utils'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const supabase = createClient()
            await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${getBaseUrl()}/auth/callback?next=/reset-password`,
            })
        } catch {
            // Silently handle — never reveal if email exists
        }

        // Always show success regardless of result
        setLoading(false)
        setSubmitted(true)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Dumbbell className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
                    <CardDescription>
                        Enter your email and we&apos;ll send you a reset link.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {submitted ? (
                        <div className="text-center space-y-4 py-4">
                            <div className="flex justify-center">
                                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                If this email is registered, you&apos;ll receive a reset link shortly.
                            </p>
                            <Link href="/login">
                                <Button variant="outline" className="w-full mt-4">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>
                            <div className="text-center">
                                <Link href="/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                    <ArrowLeft className="h-3 w-3 inline mr-1" />
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
