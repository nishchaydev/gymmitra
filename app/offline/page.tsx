'use client'

import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-sm">
          <WifiOff className="h-10 w-10 text-amber-500" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            You&apos;re Offline
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            GymMitra needs an internet connection to sync your gym data.
            Check your Wi-Fi or mobile data and try again.
          </p>
        </div>

        {/* Retry */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all duration-200"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>

        {/* Tip */}
        <p className="text-xs text-slate-400 pt-4">
          Attendance data saved offline will sync automatically when you reconnect.
        </p>
      </div>
    </div>
  )
}
