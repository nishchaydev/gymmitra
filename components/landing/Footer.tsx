import React from 'react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="relative bg-slate-950 text-slate-400 py-24 overflow-hidden border-t border-white/5">
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="font-display font-black text-3xl tracking-tighter text-white">
              Gym<span className="text-primary italic">Mitra</span>
          </div>
          <p className="max-w-md text-sm font-bold leading-relaxed">
              The most advanced ERP solution for modern gyms in India. 
              Built with precision by eMitra Technologies.
          </p>
          <div className="flex gap-8 text-xs font-black uppercase tracking-widest text-slate-500">
              <Link href="/#features" className="hover:text-primary transition-colors">Features</Link>
              <Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/refund" className="hover:text-primary transition-colors">Refund</Link>
          </div>
          <div className="pt-12 border-t border-white/5 w-full flex justify-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                  &copy; {new Date().getFullYear()} eMitra Technologies • INDORE
              </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
