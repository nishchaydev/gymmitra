"use client";

import { usePathname } from "next/navigation";
import { Lock, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface TrialLockoutProps {
  slug: string;
  isLocked: boolean;
  children: React.ReactNode;
}

export function TrialLockout({ slug, isLocked, children }: TrialLockoutProps) {
  const pathname = usePathname();
  // Don't lockout if user is on the settings page (where billing is)
  const isSettingsPage = pathname?.includes(`/${slug}/settings`);
  
  const showLockout = isLocked && !isSettingsPage;

  if (!showLockout) return <>{children}</>;

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Blurred Background Content */}
      <div 
        aria-hidden="true"
        className="filter blur-[8px] pointer-events-none select-none overflow-hidden h-full"
      >
        {children}
      </div>

      {/* Modern, Premium Lockout Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-[4px] p-6 lg:p-8">
        <motion.div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="trial-lockout-title"
          aria-describedby="trial-lockout-desc"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-xl bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20"
        >
          <div className="p-10 lg:p-14 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary-50 text-primary-600 mb-8 shadow-inner ring-1 ring-primary-100">
              <Lock className="w-12 h-12" />
            </div>
            
            <h2 
              id="trial-lockout-title"
              className="text-3xl lg:text-4xl font-black text-gray-900 mb-4 tracking-tight leading-tight"
            >
              Trial Success, <br/>Time to Activate
            </h2>
            
            <p 
              id="trial-lockout-desc"
              className="text-lg text-gray-600 mb-10 max-w-sm mx-auto leading-relaxed font-medium"
            >
              Your 7-day trial has concluded. Activate your license now to resume managing your gym and unlock all pro features.
            </p>

            <div className="grid gap-4 max-w-xs mx-auto">
              <Link 
                href={`/${slug}/settings?tab=billing`}
                autoFocus
                className="group relative flex items-center justify-center gap-3 px-8 py-5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-primary-600/30 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CreditCard className="w-5 h-5 flex-shrink-0" />
                <span className="text-lg">Activate License</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <p className="text-sm text-gray-400 mt-2 font-medium">
                Locked out? <a href="mailto:support@emitra.dev" className="text-primary-600 hover:text-primary-700 font-bold hover:underline transition-all">Contact GymMitra Expert</a>
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50/80 border-t border-gray-100 p-8 text-center backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              <span className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-primary-500 shadow-sm shadow-primary-500/50" /> WhatsApp Automation
              </span>
              <span className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-primary-500 shadow-sm shadow-primary-500/50" /> Dashboard Analytics
              </span>
              <span className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-primary-500 shadow-sm shadow-primary-500/50" /> Billing System
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
