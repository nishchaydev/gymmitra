import Link from "next/link"
import { ShieldAlert, Mail, Phone, ExternalLink } from "lucide-react"

export default async function TrialExpiredPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
            <div className="max-w-2xl w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl shadow-red-500/10">
                <div className="flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-2xl mb-8 mx-auto">
                    <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse" />
                </div>
                
                <h1 className="text-4xl font-bold text-center mb-4 tracking-tight">
                    Trial Access Expired
                </h1>
                
                <p className="text-slate-400 text-center text-lg mb-8 leading-relaxed">
                    Your 1-month trial of <span className="text-white font-semibold">Gym Mitra ERP</span> has ended. 
                    To continue managing your gym and access your data, please activate your license.
                </p>

                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
                    <h2 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        Data Deletion Warning
                    </h2>
                    <p className="text-slate-300 text-sm">
                        As per our data policy, expired trial data is scheduled for deletion 
                        <span className="text-white font-bold"> 15 days </span> after trial expiry. 
                        Please activate your license today to prevent any data loss.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                            <Mail className="w-5 h-5 text-blue-400" />
                            <span className="font-semibold text-slate-200">Email Support</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">Questions about your plan?</p>
                        <a href="mailto:support@emitra.club" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors">
                            support@emitra.club <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                    
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                            <Phone className="w-5 h-5 text-green-400" />
                            <span className="font-semibold text-slate-200">Call Us</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">Available 10 AM - 6 PM IST</p>
                        <a href="tel:+918118818812" className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors">
                            +91 811 881 8812
                        </a>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Link 
                        href={`/${slug}/settings/billing`}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-center transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                    >
                        Activate Main Plan License
                    </Link>
                    
                    <Link 
                        href="/login"
                        className="w-full py-3 text-slate-500 hover:text-slate-300 text-center text-sm font-medium transition-colors"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
            
            <p className="mt-8 text-slate-600 text-xs text-center uppercase tracking-[0.2em]">
                Powered by E-MITRA TECHNOLOGIES
            </p>
        </div>
    )
}
