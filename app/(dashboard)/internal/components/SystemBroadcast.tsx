import { useState } from "react"
import { Megaphone, Send } from "lucide-react"
import { toast } from "sonner"

export default function SystemBroadcast() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!subject || !message) return toast.error("Please fill in both subject and message")

        if (!confirm("This will send an email to ALL verified Gym Owners. Are you absolutely sure?")) return

        setIsSubmitting(true)
        try {
            const promise = fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, htmlMessage: message.replace(/\n/g, '<br/>') })
            }).then(async (res) => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Failed to send broadcast')
                return data
            })

            toast.promise(promise, {
                loading: 'Sending broadcast via Resend...',
                success: (data) => `Broadcast sent successfully to ${data.sentCount} gyms! (${data.failedCount} failures)`,
                error: (err) => err.message
            })

            await promise
            setSubject("")
            setMessage("")
        } catch (err) {
            // Handled
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="border-2 border-slate-900 bg-white shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] rounded-none relative overflow-hidden flex flex-col h-full font-sans">
            {/* Header */}
            <div className="bg-rose-500 border-b-2 border-slate-900 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-900 text-rose-500 border border-slate-900 shadow-none">
                        <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">System Broadcast</h2>
                        <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Mass Notification Engine</p>
                    </div>
                </div>
            </div>

            {/* Content Form */}
            <div className="p-6 bg-slate-50 flex-1 flex flex-col">
                <form onSubmit={handleBroadcast} className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Subject Line</label>
                        <input 
                            required
                            placeholder="e.g. Important System Update" 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full text-base px-3 py-2 border-2 border-slate-900 outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(225,29,72,1)] transition-shadow placeholder:text-slate-300 font-bold"
                        />
                    </div>
                    <div className="space-y-1 flex-1 flex flex-col">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Message Body</label>
                            <span className="text-[9px] font-mono text-slate-400 uppercase">HTML & Newlines Supported</span>
                        </div>
                        <textarea 
                            required
                            placeholder="Type your message here..." 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full text-sm px-3 py-3 border-2 border-slate-900 outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(225,29,72,1)] transition-shadow placeholder:text-slate-300 min-h-[250px] resize-y flex-1"
                        />
                    </div>
                    
                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !subject || !message} 
                            className="w-full flex items-center justify-center font-bold text-sm bg-slate-900 text-rose-500 border-2 border-slate-900 py-3 px-4 shadow-[6px_6px_0px_0px_rgba(225,29,72,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(225,29,72,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                        >
                            {isSubmitting ? 'TRANSMITTING...' : <><Send className="w-5 h-5 mr-3 stroke-[3]" /> Execute Mass Broadcast</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
