"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { Suspense } from "react"

// Allowlist of safe error messages to prevent XSS via ?message= param
const SAFE_MESSAGES: Record<string, string> = {
    'auth_failed': 'Authentication failed. Please try again.',
    'session_expired': 'Your session has expired. Please log in again.',
    'access_denied': 'Access denied. You do not have permission.',
    'email_not_verified': 'Please verify your email before continuing.',
    'account_disabled': 'Your account has been disabled. Contact support.',
    'invalid_credentials': 'Invalid email or password.',
    'rate_limited': 'Too many attempts. Please wait before trying again.',
}

const DEFAULT_MESSAGE = "Something went wrong during the authentication process."

function sanitizeMessage(raw: string | null): string {
    if (!raw) return DEFAULT_MESSAGE

    // Check allowlist first
    if (SAFE_MESSAGES[raw]) return SAFE_MESSAGES[raw]

    // Strip HTML tags and limit length for safety
    const cleaned = raw
        .replace(/<[^>]*>/g, '')     // Strip HTML
        .replace(/[^\w\s.,!?-]/g, '') // Only safe chars
        .trim()
        .slice(0, 200)

    return cleaned || DEFAULT_MESSAGE
}

function ErrorContent() {
    const searchParams = useSearchParams()
    const message = sanitizeMessage(searchParams.get('message'))

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md border-red-200">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <CardTitle className="text-xl font-bold text-red-700">Authentication Error</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p className="font-medium text-slate-900 mb-2">{message}</p>
                    <p className="text-sm">Please check your credentials or verify your email and try again.</p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/login">
                        <Button variant="secondary">Back to Login</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function ErrorPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div></div>}>
            <ErrorContent />
        </Suspense>
    )
}
