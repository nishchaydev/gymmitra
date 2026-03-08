"use client"

import { useState, useEffect } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle2, Loader2, UserCheck, WifiOff } from "lucide-react"
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
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Gym Mitra</h1>
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-slate-500 font-medium">Station Check-In Kiosk</p>
                        {!isOnline && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                                <WifiOff className="h-3 w-3" /> Offline Mode
                            </span>
                        )}
                    </div>
                </div>

                <Card className="border-0 shadow-xl overflow-hidden bg-white rounded-2xl">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                        <CardTitle className="text-center text-2xl font-bold text-slate-800">Welcome</CardTitle>
                        <CardDescription className="text-center text-base">
                            Enter your Member Card Number
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        {lastCheckIn ? (
                            <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in duration-500">
                                <div className="mx-auto h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold text-emerald-700">Welcome In!</h3>
                                    <p className="text-sm font-medium text-slate-500">Access Granted at {lastCheckIn.time}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="mt-6 font-semibold shadow-sm w-full h-12"
                                    onClick={() => setLastCheckIn(null)}
                                >
                                    Dismiss Screen
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(memberId) }} className="space-y-6">
                                    <div className="relative">
                                        <UserCheck className="absolute left-4 top-3.5 h-6 w-6 text-slate-400" />
                                        <Input
                                            placeholder="Ex: 98765432"
                                            className="pl-14 h-14 text-xl font-medium tracking-wider bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                                            value={memberId}
                                            onChange={(e) => setMemberId(e.target.value)}
                                            autoFocus
                                            autoComplete="off"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md rounded-xl" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin flex-none" /> : "Verify Identity"}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center font-medium text-sm text-slate-400">
                    Need help? Ask a staff member.
                </p>
            </div>
        </div>
    )
}
