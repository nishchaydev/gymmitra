"use client"
import { AlertCircle } from "lucide-react"

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center p-8">
            <AlertCircle className="h-10 w-10 text-rose-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-md">
                We encountered an unexpected error while loading this page. Our team has been notified.
            </p>
            {error.digest && (
                <div className="bg-slate-100 p-2 rounded text-xs text-slate-600 mb-2 font-mono">
                    Digest: {error.digest}
                </div>
            )}
            {error.message && (
                <div className="bg-rose-50 text-rose-600 p-2 rounded text-xs mb-6 max-w-md overflow-auto font-mono">
                    {error.message}
                </div>
            )}
            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    )
}
