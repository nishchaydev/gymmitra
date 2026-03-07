'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function LeadsError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-drift-900">Failed to load leads</h2>
                <p className="text-drift-500 text-sm max-w-md">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
            </div>
            <Button onClick={reset} className="bg-ion-500 hover:bg-ion-600 text-white font-bold">
                Try Again
            </Button>
        </div>
    )
}
