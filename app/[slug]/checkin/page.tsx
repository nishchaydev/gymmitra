"use client"

import { useState, useEffect, useRef } from "react"
import { CheckCircle2, Loader2, Phone, Zap, ArrowRight, RotateCcw, Clock, Delete } from "lucide-react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

type CheckInState = "idle" | "loading" | "success" | "error"

const STORAGE_KEY_PREFIX = "gm_checkin_phone_"

export default function CheckInPage() {
    const params = useParams()
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug || ""

    const [phone, setPhone] = useState("")
    const [savedPhone, setSavedPhone] = useState<string | null>(null)
    const [gymName, setGymName] = useState("")
    const [state, setState] = useState<CheckInState>("idle")
    const [message, setMessage] = useState("")
    const [memberName, setMemberName] = useState("")
    const [isReturningMember, setIsReturningMember] = useState(false)
    const [time, setTime] = useState<Date | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const storageKey = `${STORAGE_KEY_PREFIX}${slug}`

    // Clock effect
    useEffect(() => {
        setTime(new Date())
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        // Load gym info
        fetch(`/api/public/${slug}/checkin`)
            .then(r => r.json())
            .then(data => {
                if (data.gymName) setGymName(data.gymName)
            })
            .catch(() => { })

        try {
            const remembered = localStorage.getItem(storageKey)
            if (remembered) {
                setSavedPhone(remembered)
                setPhone(remembered)
                setIsReturningMember(true)
            }
        } catch (e) {
            console.error("localStorage access failed:", e)
        }
    }, [slug, storageKey])

    const handleCheckIn = async (phoneNum: string) => {
        if (phoneNum.length < 10) return
        setState("loading")
        setMessage("")

        try {
            const res = await fetch(`/api/public/${slug}/checkin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phoneNum.trim() }),
            })
            const data = await res.json()

            if (!res.ok) {
                setState("error")
                setMessage(data.error || "Something went wrong.")
                setTimeout(() => {
                    setState("idle")
                    setPhone("")
                }, 3000)
                return
            }

            try {
                localStorage.setItem(storageKey, phoneNum.trim())
            } catch (e) {
                console.error("localStorage access failed:", e)
            }
            setSavedPhone(phoneNum.trim())
            setIsReturningMember(true)
            setMemberName(data.memberName || "")
            setState("success")

            // Clear phone input for next time
            setPhone("")

            setTimeout(() => {
                setState("idle")
                setMessage("")
            }, 5000)
        } catch {
            setState("error")
            setMessage("Network error.")
            setTimeout(() => setState("idle"), 3000)
        }
    }

    const appendDigit = (digit: string) => {
        if (phone.length < 10) setPhone(prev => prev + digit)
    }

    const backspace = () => {
        setPhone(prev => prev.slice(0, -1))
    }

    return (
        <div className="min-h-screen bg-[#050510] text-white flex flex-col items-center justify-between p-6 md:p-12 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />

            {/* Top Bar: Time and Gym Name */}
            <header className="w-full flex items-center justify-between relative z-20">
                <div className="flex flex-col">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">{gymName || "GymMitra"}</h1>
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-xs tracking-widest uppercase mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                        Kiosk Mode Active
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl md:text-5xl font-black tracking-tighter flex items-center justify-end gap-3">
                        <Clock className="h-6 w-6 md:h-8 md:w-8 text-slate-500" />
                        {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                    <div className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
                        {time ? time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' }) : '---'}
                    </div>
                </div>
            </header>

            {/* Main Center Area */}
            <main className="flex-1 w-full max-w-7xl flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 relative z-10">

                <AnimatePresence mode="wait">
                    {state === "success" ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex flex-col items-center text-center space-y-8"
                        >
                            <div className="relative">
                                <div className="h-48 w-48 md:h-64 md:w-64 rounded-full bg-emerald-500/20 border-4 border-emerald-500/50 flex items-center justify-center shadow-[0_0_80px_rgba(16,185,129,0.3)]">
                                    <CheckCircle2 className="h-24 w-24 md:h-32 md:w-32 text-emerald-400" />
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring" }}
                                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white text-emerald-600 font-black px-6 py-2 rounded-full shadow-xl"
                                >
                                    SUCCESS
                                </motion.div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-4xl md:text-6xl font-black text-white">
                                    {memberName ? `Welcome, ${memberName.split(' ')[0]}!` : "Welcome In!"}
                                </h2>
                                <p className="text-emerald-400 md:text-2xl font-bold tracking-tight">Consistency is the key to success. 💪</p>
                            </div>

                            <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden mt-8">
                                <motion.div
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                    className="h-full bg-emerald-400"
                                />
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Resetting in 5 seconds</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="kiosk"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="w-full flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24"
                        >
                            {/* Left: Branding & Message */}
                            <div className="hidden md:flex flex-col space-y-6 max-w-md">
                                <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                    <Zap className="h-8 w-8 text-sky-400" />
                                </div>
                                <h2 className="text-6xl font-black leading-none tracking-tighter uppercase font-serif">
                                    Ready to <br />
                                    <span className="text-sky-400">Transform?</span>
                                </h2>
                                <p className="text-xl text-slate-400 font-medium">Enter your 10-digit registered phone number to check in.</p>
                                <div className="flex gap-4">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex-1">
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Status</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <p className="text-lg font-black uppercase text-emerald-400">Live</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex-1">
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Secure</p>
                                        <p className="text-lg font-black text-slate-300 uppercase">Encrypted</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Phone Input & Keypad */}
                            <div className="w-full max-w-sm space-y-8">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-sky-500/10 blur-[40px] group-focus-within:bg-sky-500/20 transition-all rounded-full" />
                                    <div className="relative">
                                        <div className="text-center md:hidden mb-6">
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Enter Member Phone</p>
                                        </div>
                                        <div className="flex items-center justify-center gap-3 bg-white/[0.03] border border-white/10 group-focus-within:border-sky-500/50 p-6 rounded-3xl backdrop-blur-xl shadow-2xl transition-all h-24">
                                            <Phone className="h-6 w-6 text-slate-500" />
                                            <div className="flex-1 text-4xl md:text-5xl font-black tracking-[0.2em] text-center font-mono">
                                                {phone.padEnd(10, "·").split("").map((char, i) => (
                                                    <span key={i} className={char === "·" ? "text-white/10" : "text-white"}>
                                                        {char}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {state === "error" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-center"
                                    >
                                        <p className="text-rose-400 font-bold uppercase text-xs tracking-widest">{message}</p>
                                    </motion.div>
                                )}

                                {/* Numeric Keypad */}
                                <div className="grid grid-cols-3 gap-4 place-items-center">
                                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(num => (
                                        <KeypadButton key={num} value={num} onClick={() => appendDigit(num)} />
                                    ))}
                                    <KeypadButton
                                        value={<RotateCcw className="h-8 w-8 text-slate-500" />}
                                        onClick={() => setPhone("")}
                                        className="bg-white/0 border-none"
                                    />
                                    <KeypadButton value="0" onClick={() => appendDigit("0")} />
                                    <KeypadButton
                                        value={<Delete className="h-8 w-8 text-slate-500" />}
                                        onClick={backspace}
                                        className="bg-white/0 border-none"
                                    />
                                </div>

                                <button
                                    onClick={() => handleCheckIn(phone)}
                                    disabled={phone.length < 10 || state === "loading"}
                                    className="w-full h-20 rounded-3xl font-black text-2xl text-white transition-all duration-300 flex items-center justify-center gap-4 disabled:opacity-20 relative overflow-hidden group shadow-[0_0_24px_rgba(14,165,233,0.2)]"
                                    style={{
                                        background: state === "loading"
                                            ? "rgba(14,165,233,0.3)"
                                            : "linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)",
                                    }}
                                >
                                    {state === "loading" ? (
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    ) : (
                                        <>
                                            CHECK IN
                                            <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>

                                {isReturningMember && savedPhone && phone !== savedPhone && (
                                    <button
                                        onClick={() => { setPhone(savedPhone); handleCheckIn(savedPhone); }}
                                        className="w-full text-center text-slate-500 hover:text-white font-bold text-sm uppercase tracking-widest pt-2 transition-colors"
                                    >
                                        Use previous: {savedPhone.slice(0, 3)}...{savedPhone.slice(-4)}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>

            {/* Bottom Footer */}
            <footer className="w-full flex items-center justify-between text-slate-700 font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] relative z-20 pt-12">
                <div className="flex items-center gap-2">
                    <span className="text-slate-800">ENIP</span>
                    <span>0xFF293</span>
                </div>
                <div className="text-center hidden md:block">
                    POWERED BY GYMMITRA CORE • SECURE ACCESS SYSTEM
                </div>
                <div className="flex items-center gap-4">
                    <span>V4.2.0</span>
                    <span className="h-1 w-8 bg-slate-800 rounded-full" />
                </div>
            </footer>
        </div>
    )
}

const KeypadButton = ({ value, onClick, className = "" }: { value: string | React.ReactNode, onClick: () => void, className?: string }) => (
    <button
        onClick={onClick}
        className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold transition-all active:scale-95 active:bg-white/20 select-none ${className}`}
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
        {value}
    </button>
)
