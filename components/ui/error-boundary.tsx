"use client"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    // Next.js strips error.message in production for security.
    // Use error.digest as unique identifier for support.
    const displayMessage = error.message && error.message !== 'An error occurred in the Server Components render.'
        ? error.message
        : null

    return (
        <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center p-8">
            <AlertCircle className="h-10 w-10 text-rose-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-md">
                We encountered an unexpected error while loading this page. Our team has been notified.
            </p>
            {displayMessage && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-xs mb-4 max-w-md overflow-auto font-mono border border-rose-200">
                    {displayMessage}
                </div>
            )}
            {error.digest && (
                <div className="bg-slate-100 p-2 rounded text-xs text-slate-600 mb-6 font-mono">
                    Error ID: {error.digest}
                </div>
            )}
            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                </button>
                <Link
                    href="/"
                    className="border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                    <Home className="h-4 w-4" />
                    Home
                </Link>
            </div>
        </div>
    )
}
