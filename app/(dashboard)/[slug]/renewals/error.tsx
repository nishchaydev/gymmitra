'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function RenewalsError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex justify-center items-center min-h-[50vh]">
                <Card className="max-w-md w-full border-rose-100">
                    <CardHeader className="text-center space-y-2">
                        <div className="flex justify-center mb-2">
                            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-rose-600" />
                            </div>
                        </div>
                        <CardTitle className="text-xl">Renewals Initialization Failed</CardTitle>
                        <CardDescription>
                            We encountered an unexpected error loading your membership expiries.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <p className="text-sm text-slate-500 mb-6 text-center">
                            Please try refreshing the page. If the problem persists, contact support.
                        </p>
                        <Button
                            onClick={() => reset()}
                            className="bg-indigo-600 hover:bg-indigo-700 w-full"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> Try again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
