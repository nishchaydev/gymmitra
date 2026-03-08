'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const router = useRouter()

    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error)
    }, [error])

    return (
        <div className="flex h-[80vh] items-center justify-center p-4">
            <Card className="w-full max-w-md border-rose-200 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                        <AlertCircle className="h-6 w-6 text-rose-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Dashboard Exception</CardTitle>
                    <CardDescription className="text-slate-500">
                        Something went wrong while loading the dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    <div className="rounded-lg bg-slate-50 p-4 font-mono text-xs text-slate-600 border border-slate-200">
                        <p className="font-semibold mb-1 uppercase tracking-wider text-[10px] text-slate-400">Error Digest</p>
                        <p className="break-all">{error.digest || 'no-digest-available'}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                            onClick={() => {
                                // Try to recover by resetting the error boundary
                                reset()
                                // Also refresh the page data
                                router.refresh()
                            }}
                            className="w-full font-bold bg-primary hover:bg-primary/90"
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" /> Retry
                        </Button>
                        <Link href="/" className="w-full">
                            <Button variant="outline" className="w-full font-bold">
                                <Home className="mr-2 h-4 w-4" /> Go Home
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
