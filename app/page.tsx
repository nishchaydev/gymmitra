import Link from "next/link"
import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { SocialProof } from "@/components/landing/SocialProof"
import { Advantage } from "@/components/landing/Advantage" // Now "The Pain"
import { Features } from "@/components/landing/Features"  // Now "The Solution"
import { Pricing } from "@/components/landing/Pricing"
import { FAQ } from "@/components/landing/FAQ"

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#10b981]/20 selection:text-[#065f46]">
      <Navbar />
      <main>
        {/* 1. The Hook */}
        <Hero />

        {/* 2. Trust */}
        <SocialProof />

        {/* 3. The Pain */}
        <Advantage />

        {/* 4. The Solution */}
        <Features />

        {/* 5. The Pricing */}
        <Pricing />

        {/* 6. Risk Reversal */}
        <FAQ />
      </main>

      {/* Footer */}
      <footer className="py-20 bg-[#0f172a] text-slate-400 border-t border-slate-800">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-left">
            <div className="col-span-1 md:col-span-1">
              <div className="font-bold text-2xl text-white mb-6">
                Gym<span className="text-[#10b981]">Mitra</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                The most advanced ERP solution for modern gyms in India.
                Built by eMitra Technologies.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Product</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="#features" className="hover:text-[#10b981] transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-[#10b981] transition-colors">Pricing</Link></li>
                <li><Link href="/login?view=register" className="hover:text-[#10b981] transition-colors">Request Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Resources</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="#" className="hover:text-[#10b981] transition-colors">Support Center</Link></li>
                <li><Link href="#" className="hover:text-[#10b981] transition-colors">API Docs</Link></li>
                <li><Link href="#" className="hover:text-[#10b981] transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Company</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="#" className="hover:text-[#10b981] transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-[#10b981] transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-[#10b981] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm font-medium opacity-60">
              &copy; {new Date().getFullYear()} eMitra Technologies. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              {/* Social links placeholder */}
              <div className="h-8 w-8 rounded-full bg-slate-800/50 hover:bg-[#10b981]/20 transition-colors" />
              <div className="h-8 w-8 rounded-full bg-slate-800/50 hover:bg-[#10b981]/20 transition-colors" />
              <div className="h-8 w-8 rounded-full bg-slate-800/50 hover:bg-[#10b981]/20 transition-colors" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
