"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { Suspense } from "react"

function ErrorContent() {
    const searchParams = useSearchParams()
    const message = searchParams.get('message') || "Something went wrong during the authentication process."

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
