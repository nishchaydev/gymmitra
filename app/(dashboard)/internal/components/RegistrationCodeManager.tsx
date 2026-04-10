import { useState, useEffect } from "react"
import { KeyRound, Trash2, Plus, Copy, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

export default function RegistrationCodeManager() {
    const [codes, setCodes] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [codeStr, setCodeStr] = useState("")
    const [plan, setPlan] = useState("MAIN_PLAN")
    const [maxUses, setMaxUses] = useState(1)
    const [daysValid, setDaysValid] = useState(30) // 0 = never expire

    const fetchCodes = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/codes')
            if (res.ok) setCodes(await res.json())
        } catch (err) {
            console.error("Failed to fetch codes", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCodes()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!codeStr) return toast.error("Please enter a code limit")
        setIsSubmitting(true)
        try {
            const promise = fetch('/api/admin/codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeStr, plan, maxUses, daysValid })
            }).then(async (res) => {
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || 'Failed to create code')
                }
                return res.json()
            })

            toast.promise(promise, {
                loading: 'Generating code...',
                success: 'Code generated successfully!',
                error: (err) => err.message
            })

            await promise
            setCodeStr("")
            fetchCodes()
        } catch (err) {
            // Error handled by toast
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string, codeName: string) => {
        if (!confirm(`Are you sure you want to delete code ${codeName}?`)) return
        try {
            const promise = fetch(`/api/admin/codes?id=${id}`, { method: 'DELETE' }).then(res => {
                if (!res.ok) throw new Error('Deletion failed')
            })

            toast.promise(promise, {
                loading: 'Deleting...',
                success: 'Code deleted',
                error: 'Failed to delete'
            })
            
            await promise
            fetchCodes()
        } catch (err) {
            // Handled
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Code copied!")
    }

    return (
        <div className="border-2 border-slate-900 bg-white shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] rounded-none relative overflow-hidden flex flex-col h-full font-sans">
            {/* Header */}
            <div className="bg-emerald-400 border-b-2 border-slate-900 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-900 text-emerald-400 border border-slate-900">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Access Control</h2>
                        <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">License Key Generator</p>
                    </div>
                </div>
                <button 
                    onClick={fetchCodes}
                    className="p-2 border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Creator Form */}
            <div className="p-5 border-b-2 border-slate-900 bg-slate-50">
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Key String</label>
                        <input 
                            required
                            placeholder="e.g. LIFETIME-PRO" 
                            value={codeStr} 
                            onChange={(e) => setCodeStr(e.target.value.toUpperCase())}
                            className="w-full font-mono text-sm uppercase px-3 py-2 border-2 border-slate-900 outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(52,211,153,1)] transition-shadow placeholder:text-slate-300"
                        />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Plan</label>
                        <select 
                            value={plan} 
                            onChange={(e) => setPlan(e.target.value)}
                            className="w-full text-sm px-3 py-2 border-2 border-slate-900 outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(52,211,153,1)] transition-shadow appearance-none bg-white rounded-none cursor-pointer font-bold"
                        >
                            <option value="TRIAL">Trial</option>
                            <option value="MAIN_PLAN">Main Plan (PRO)</option>
                            <option value="PER_MEMBER">Usage Based (Pay/Member)</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Uses Limit</label>
                        <input 
                            type="number" 
                            min={1} 
                            value={maxUses} 
                            onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                            className="w-full text-sm px-3 py-2 border-2 border-slate-900 outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(52,211,153,1)] transition-shadow"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !codeStr} 
                            className="w-full flex items-center justify-center font-bold text-sm bg-slate-900 text-emerald-400 border-2 border-slate-900 py-2 px-4 shadow-[4px_4px_0px_0px_rgba(52,211,153,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(52,211,153,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '...' : <><Plus className="w-4 h-4 mr-1 stroke-[3]" /> ISSUE KEY</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Matrix Data Table */}
            <div className="flex-1 overflow-x-auto bg-white min-h-[300px]">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 border-b-2 border-slate-900 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 border-r-2 border-slate-900">License Code</th>
                            <th className="px-4 py-3 border-r-2 border-slate-900">Target Plan</th>
                            <th className="px-4 py-3 border-r-2 border-slate-900 text-center">Remaining Uses</th>
                            <th className="px-4 py-3 border-r-2 border-slate-900">Valid Until</th>
                            <th className="px-4 py-3 text-center">Terminate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100 font-mono text-sm">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-400 uppercase font-sans font-bold tracking-widest">
                                    [ Fetching Data Stream ]
                                </td>
                            </tr>
                        ) : codes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-400 uppercase font-sans font-bold tracking-widest">
                                    [ No Active Licenses ]
                                </td>
                            </tr>
                        ) : (
                            codes.map(code => (
                                <tr key={code.id} className="hover:bg-emerald-50/50 transition-colors group">
                                    <td className="px-4 py-3 border-r-2 border-slate-100 group-hover:border-slate-900 transition-colors">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-slate-900">
                                                {code.code}
                                            </span>
                                            <button 
                                                className="p-1 border-2 border-transparent text-slate-400 hover:text-slate-900 hover:border-slate-900 hover:bg-white hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                                onClick={() => copyToClipboard(code.code)}
                                                title="Copy Code"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 border-r-2 border-slate-100 group-hover:border-slate-900 transition-colors">
                                        <span className={`px-2 py-1 text-[10px] font-sans font-bold uppercase border-2 ${code.plan === 'MAIN_PLAN' ? 'border-emerald-500 bg-emerald-100 text-emerald-900' : 'border-slate-900 bg-slate-100 text-slate-900'}`}>
                                            {code.plan.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 border-r-2 border-slate-100 group-hover:border-slate-900 transition-colors text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="font-bold text-slate-900">
                                                {code.maxUses - code.usedCount} <span className="text-slate-400 font-normal">/ {code.maxUses}</span>
                                            </span>
                                            {code._count?.gyms > 0 && (
                                                <span className="text-[9px] font-sans text-slate-500 uppercase tracking-wider mt-1 block">
                                                    ({code._count.gyms} attached)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 border-r-2 border-slate-100 group-hover:border-slate-900 transition-colors text-slate-600">
                                        {code.expiresAt ? format(new Date(code.expiresAt), 'dd MMM yyyy') : '∞'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button 
                                            className="p-2 border-2 border-transparent text-slate-400 hover:text-white hover:border-rose-600 hover:bg-rose-600 hover:shadow-[2px_2px_0px_0px_rgba(225,29,72,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                            onClick={() => handleDelete(code.id, code.code)}
                                            title="Terminate License"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
