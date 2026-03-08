"use client"

import { useState, useEffect } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle2, Loader2, UserCheck, WifiOff, ArrowRight } from "lucide-react"
import { saveOfflineAttendance } from "@/lib/offlineSync"

export default function KioskPage() {
    const [memberId, setMemberId] = useState("")
    const [loading, setLoading] = useState(false)
    const [lastCheckIn, setLastCheckIn] = useState<{ name: string; time: string } | null>(null)
    const [showScanner, setShowScanner] = useState(false)

    const handleCheckIn = async (id: string) => {
        if (!id) return
        const trimmedId = id.trim()
        if (!trimmedId) return
        setLoading(true)
        try {
            const response = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId: trimmedId }),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to check in")

            const memberName = data.member?.name || "Member"
            toast.success(`Welcome ${memberName}! Check-in successful.`)
            setLastCheckIn({
                name: memberName,
                time: data.checkInTime ? new Date(data.checkInTime).toLocaleTimeString() : new Date().toLocaleTimeString()
            })
            setMemberId("")
            setTimeout(() => setLastCheckIn(null), 5000)
        } catch (error: unknown) {
            // Handle Offline fallback
            const isFetchError = error instanceof Error && error.message?.includes('Failed to fetch');
            if (typeof window !== 'undefined' && (!navigator.onLine || isFetchError)) {
                try {
                    const saved = await saveOfflineAttendance({
                        memberId: id,
                        date: new Date(),
                        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                    })
                    if (saved) {
                        toast.info("Offline: Check-in saved locally.", {
                            icon: <WifiOff className="h-4 w-4" />,
                            duration: 6000
                        })
                    } else {
                        toast.warning("Check-in already saved for today.")
                    }
                    setLastCheckIn({
                        name: "Member (Offline)",
                        time: new Date().toLocaleTimeString()
                    })
                    setMemberId("")
                } catch (saveError) {
                    // saveError is handled by the toast below
                    toast.error("Failed to save even offline. System error.")
                }
                return;
            }
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    // Auto-sync indicator
    const [isOnline, setIsOnline] = useState(true)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleOnline = () => {
                setIsOnline(true);
                import('@/lib/offlineSync').then(m => m.syncOfflineAttendance());
            }
            const handleOffline = () => { setIsOnline(false); }
            window.addEventListener('online', handleOnline)
            window.addEventListener('offline', handleOffline)
            return () => {
                window.removeEventListener('online', handleOnline)
                window.removeEventListener('offline', handleOffline)
            }
        }
    }, [])

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 sm:p-12">
            {/* Minimalist Background elements - only subtle gradients, no AI glows */}
            <div className="fixed inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

            <div className="w-full max-w-lg space-y-12 relative z-10">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        <span className="text-white text-2xl font-black italic tracking-tighter">GM</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">GymMitra</h1>
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Self Check-In Station</p>
                        {!isOnline && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 shadow-sm">
                                <WifiOff className="h-3 w-3" /> Offline
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-slate-50/50 backdrop-blur-sm p-1 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-100 animate-in fade-in zoom-in duration-1000 delay-150">
                    <Card className="border-0 shadow-none overflow-hidden bg-white rounded-[2.2rem]">
                        <CardHeader className="pt-10 pb-6 text-center">
                            <CardTitle className="text-3xl font-black text-slate-800 tracking-tight">Welcome Back!</CardTitle>
                            <CardDescription className="text-slate-400 font-medium text-lg">
                                Scan or Enter Card Number
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-10 pt-0">
                            {lastCheckIn ? (
                                <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-500">
                                    <div className="mx-auto h-32 w-32 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05),0_10px_20px_rgba(37,99,235,0.1)]">
                                        <CheckCircle2 className="h-16 w-16 stroke-[2.5]" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Access Granted</h3>
                                        <p className="text-lg font-bold text-blue-600 uppercase tracking-wide">{lastCheckIn.name}</p>
                                        <p className="text-sm font-medium text-slate-400">Entry time: {lastCheckIn.time}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="mt-8 font-black uppercase tracking-widest text-xs h-14 w-full rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                                        onClick={() => setLastCheckIn(null)}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(memberId) }} className="space-y-8">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <UserCheck className="h-7 w-7 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <Input
                                            placeholder="Card Number"
                                            className="pl-16 h-20 text-3xl font-black tracking-[0.2em] bg-slate-50 border-slate-200 focus-visible:ring-blue-600 focus-visible:bg-white rounded-[1.5rem] transition-all"
                                            value={memberId}
                                            onChange={(e) => setMemberId(e.target.value)}
                                            autoFocus
                                            autoComplete="off"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-20 text-xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 hover:shadow-2xl hover:shadow-blue-200 active:scale-[0.98] transition-all rounded-[1.5rem] group"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        ) : (
                                            <>
                                                Verify Entry
                                                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="text-center pt-4">
                    <p className="font-bold text-xs uppercase tracking-[0.2em] text-slate-300">
                        Powered by GymMitra AI
                    </p>
                </div>
            </div>
        </div>
    )
}
