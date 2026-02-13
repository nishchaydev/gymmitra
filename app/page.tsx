import Link from "next/link"
import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { SocialProof } from "@/components/landing/SocialProof"
import { LiveDemo } from "@/components/landing/LiveDemo"
import { BeforeAfter } from "@/components/landing/BeforeAfter"
import { Features } from "@/components/landing/Features"
import { ROICalculator } from "@/components/landing/ROICalculator"
import { Testimonials } from "@/components/landing/Testimonials"
import { MobilePreview } from "@/components/landing/MobilePreview"
import { Pricing } from "@/components/landing/Pricing"
import { FAQ } from "@/components/landing/FAQ"
import { FinalCTA } from "@/components/landing/FinalCTA"

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <Navbar />
      <main>
        {/* 1. The Hook - Problem & Promise */}
        <Hero />

        {/* 2. Trust - Social Proof */}
        <SocialProof />

        {/* 3. The Experience - Live Demo (Interactive) */}
        <LiveDemo />

        {/* 4. The Contrast - Before vs After */}
        <BeforeAfter />

        {/* 5. The Solution - Key Features */}
        <Features />

        {/* 6. The Logic - ROI Calculator */}
        <ROICalculator />

        {/* 7. The Proof - Testimonials */}
        <Testimonials />

        {/* 8. The Future - Mobile App Teaser */}
        <MobilePreview />

        {/* 9. The Offer - Pricing */}
        <Pricing />

        {/* 10. Risk Reversal - FAQ */}
        <FAQ />

        {/* 11. Final Push - CTA */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <footer className="py-20 bg-drift-900 text-slate-400 border-t border-slate-800">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-left">
            <div className="col-span-1 md:col-span-1">
              <div className="font-bold text-2xl text-white mb-6">
                Gym<span className="text-primary">Mitra</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                The most advanced ERP solution for modern gyms in India.
                Built by eMitra Technologies.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Product</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/login?view=register" className="hover:text-primary transition-colors">Request Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Resources</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="#" className="hover:text-primary transition-colors">Support Center</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">API Docs</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Company</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm font-medium opacity-60">
              &copy; {new Date().getFullYear()} eMitra Technologies. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              {/* Social links placeholder */}
              <div className="h-8 w-8 rounded-full bg-slate-800/50 hover:bg-primary/20 transition-colors" />
              <div className="h-8 w-8 rounded-full bg-slate-800/50 hover:bg-primary/20 transition-colors" />
              <div className="h-8 w-8 rounded-full bg-slate-800/50 hover:bg-primary/20 transition-colors" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
