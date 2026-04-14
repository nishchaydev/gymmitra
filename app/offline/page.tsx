'use client'

import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        {/* Animated Icon Container */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-amber-500/10 rounded-3xl blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-3xl bg-white border border-slate-200/60 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
            <WifiOff className="h-10 w-10 text-amber-500 animate-in zoom-in duration-700" />
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Connection Lost
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed px-4">
            It seems like you&apos;re currently offline. GymMitra needs an active connection to sync your dashboard and records.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={() => window.location.reload()}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            <span className="relative">Reconnect Now</span>
          </button>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 border border-slate-200/60 rounded-full text-[11px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          Offline Mode Active
        </div>

        {/* Helper Tip */}
        <div className="pt-4 border-t border-slate-200/60">
          <p className="text-xs text-slate-400 font-medium max-w-[280px] mx-auto italic">
            Note: Attendance check-ins captured while offline will sync automatically once restored.
          </p>
        </div>
      </div>
    </div>
  )
}
