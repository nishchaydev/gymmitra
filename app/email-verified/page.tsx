"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Home, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function EmailVerifiedPage() {
    const [gym, setGym] = useState<{ slug: string, isVerified: boolean } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchGym = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
                const { data: profile } = await supabase
                    .from('GymProfile')
                    .select('slug, isVerified')
                    .eq('userId', user.id)
                    .single()
                
                if (profile) setGym(profile)
            }
            setLoading(false)
        }
        fetchGym()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-drift-50 circuit-bg">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-drift-50 circuit-bg relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-ocean/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative w-full max-w-lg glass-card rounded-3xl p-1 sm:p-px shadow-2xl overflow-hidden"
            >
                <div className="bg-white/40 rounded-[calc(1.5rem-1px)] p-8 sm:p-12 text-center relative z-10">
                    {/* Floating Success Icon */}
                    <div className="relative mb-10 inline-block">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                            className="relative z-10 w-20 h-20 bg-gradient-to-tr from-primary to-ocean rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20"
                        >
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </motion.div>
                        
                        {/* Sparkles Decoration */}
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-4 -right-4 text-ocean"
                        >
                            <Sparkles className="w-8 h-8 opacity-40" />
                        </motion.div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-midnight-900 mb-4 tracking-tight">
                        Email Confirmed<span className="text-primary italic">.</span>
                    </h1>
                    
                    <p className="text-lg text-midnight-600 mb-10 leading-relaxed max-w-sm mx-auto">
                        {gym?.isVerified 
                            ? "Splendid! Your account is verified and ready for action."
                            : "Your email is verified! Now, let's complete your gym's professional setup in just a few clicks."}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        {gym?.isVerified ? (
                            <Button asChild size="lg" className="h-14 px-8 rounded-xl bg-midnight-900 hover:bg-midnight-800 text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-midnight-900/10 group">
                                <Link href={`/${gym.slug}/dashboard`}>
                                    Go to Dashboard
                                    <Home className="ml-2 w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild size="lg" className="h-14 px-8 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 group">
                                <Link href="/onboarding">
                                    Complete Setup
                                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        )}
                    </div>

                    <div className="mt-12 pt-8 border-t border-midnight-900/5 w-full flex items-center justify-center gap-2">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-midnight-900/30 uppercase">
                            GymMitra Secure Verification
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Decorative background circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-midnight-900/5 rounded-full pointer-events-none" />
        </div>
    )
}
