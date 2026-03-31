'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle, KeyRound, ArrowRight } from 'lucide-react'
import Image from 'next/image'

interface FirstLoginPageClientProps {
    slug: string
    staffName: string
    gymName: string
}

export function FirstLoginPageClient({ slug, staffName, gymName }: FirstLoginPageClientProps) {
    const router = useRouter()
    const [step, setStep] = useState<'choice' | 'form' | 'done'>('choice')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const clearFirstLogin = async () => {
        await fetch('/api/staff/first-login', { method: 'PATCH' })
    }

    const handleSkip = async () => {
        setLoading(true)
        await clearFirstLogin()
        router.push(`/${slug}/dashboard`)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            const supabase = createClient()
            const { error: updateError } = await supabase.auth.updateUser({ password })

            if (updateError) {
                setError(updateError.message)
                setLoading(false)
                return
            }

            await clearFirstLogin()
            setStep('done')
            setTimeout(() => router.push(`/${slug}/dashboard`), 1500)
        } catch {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <Card className="w-full max-w-md shadow-2xl border-0">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                            <Image
                                src="/icon.png"
                                alt="GymMitra"
                                width={36}
                                height={36}
                                className="rounded-lg object-contain"
                            />
                        </div>
                    </div>

                    {step === 'choice' && (
                        <>
                            <CardTitle className="text-2xl font-bold">
                                Welcome, {staffName}! 👋
                            </CardTitle>
                            <CardDescription className="text-base mt-1">
                                You've joined <strong>{gymName}</strong> as a staff member.
                            </CardDescription>
                        </>
                    )}
                    {step === 'form' && (
                        <>
                            <CardTitle className="text-2xl font-bold">Set your password</CardTitle>
                            <CardDescription>Choose a secure password for your account.</CardDescription>
                        </>
                    )}
                    {step === 'done' && (
                        <>
                            <CardTitle className="text-2xl font-bold">All set!</CardTitle>
                            <CardDescription>Redirecting you to the dashboard...</CardDescription>
                        </>
                    )}
                </CardHeader>

                <CardContent className="pt-4">
                    {step === 'choice' && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Would you like to set a new password, or continue with your temporary one?
                            </p>
                            <Button
                                className="w-full gap-2"
                                onClick={() => setStep('form')}
                                disabled={loading}
                            >
                                <KeyRound className="h-4 w-4" />
                                Yes, set a new password
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={handleSkip}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                Skip for now, go to dashboard
                            </Button>
                        </div>
                    )}

                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="Minimum 8 characters"
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(null) }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setError(null) }}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setStep('choice')}
                                    disabled={loading}
                                >
                                    Back
                                </Button>
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                                    ) : 'Update Password'}
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 'done' && (
                        <div className="text-center space-y-4 py-4">
                            <div className="flex justify-center">
                                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                Password updated successfully!
                            </p>
                            <p className="text-xs text-muted-foreground">Taking you to the dashboard...</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
