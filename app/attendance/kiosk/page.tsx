"use client"

import { useState } from "react"
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
        setLoading(true)
        try {
            const response = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId: id }),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to check in")

            toast.success("Welcome! Check-in successful.")
            setLastCheckIn({
                name: "Member",
                time: new Date().toLocaleTimeString()
            })
            setMemberId("")
            setShowScanner(false)
            setTimeout(() => setLastCheckIn(null), 5000)
        } catch (error: any) {
            // Handle Offline fallback
            if (typeof window !== 'undefined' && !navigator.onLine) {
                try {
                    await saveOfflineAttendance({
                        memberId: id,
                        date: new Date(),
                        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                    })
                    toast.info("Offline: Check-in saved locally. Will sync when online.", {
                        icon: <WifiOff className="h-4 w-4" />,
                        duration: 6000
                    })
                    setLastCheckIn({
                        name: "Member (Offline)",
                        time: new Date().toLocaleTimeString()
                    })
                    setMemberId("")
                    setShowScanner(false)
                } catch (saveError) {
                    toast.error("Failed to save even offline. System error.")
                }
                return;
            }
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-white tracking-tight">Gym Mitra</h1>
                    <p className="text-slate-400">Self Check-In Kiosk</p>
                </div>

                <Card className="border-0 shadow-2xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl">Check In</CardTitle>
                        <CardDescription className="text-center">
                            {showScanner ? "Scan your digital QR pass" : "Enter your Member ID or scan QR"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {lastCheckIn ? (
                            <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in duration-500">
                                <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-green-700">Welcome In!</h3>
                                    <p className="text-sm text-gray-500">Checked in at {lastCheckIn.time}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => setLastCheckIn(null)}
                                >
                                    Next Member
                                </Button>
                            </div>
                        ) : showScanner ? (
                            <div className="space-y-4">
                                <div className="aspect-square bg-black rounded-lg overflow-hidden border-2 border-slate-800">
                                    <Scanner
                                        onScan={(result) => result[0]?.rawValue && handleCheckIn(result[0].rawValue)}
                                        onError={(error: unknown) => console.error(error instanceof Error ? error.message : "Scanner error")}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full text-slate-500"
                                    onClick={() => setShowScanner(false)}
                                >
                                    Back to Manual Input
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(memberId) }} className="space-y-4">
                                    <div className="relative">
                                        <UserCheck className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            placeholder="Member ID..."
                                            className="pl-10 h-12 text-lg"
                                            value={memberId}
                                            onChange={(e) => setMemberId(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Manual Check In"}
                                    </Button>
                                </form>
                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">OR</span></div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 text-lg gap-2 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                    onClick={() => setShowScanner(true)}
                                >
                                    Scan QR Member Pass
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-slate-500">
                    Need help? Ask a staff member.
                </p>
            </div>
        </div>
    )
}
