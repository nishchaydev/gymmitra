import dynamic from "next/dynamic"
import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { MobileStickyCTA } from "@/components/landing/MobileStickyCTA"
import { Reveal } from "@/components/landing/ui/Reveal"

const SocialProof = dynamic(() => import("@/components/landing/SocialProof").then(m => m.SocialProof), { loading: () => <div className="min-h-[200px] animate-pulse bg-slate-50 w-full" /> })
const LiveDemo = dynamic(() => import("@/components/landing/LiveDemo").then(m => m.LiveDemo), { loading: () => <div className="min-h-[600px] animate-pulse bg-slate-50 w-full" /> })
const BeforeAfter = dynamic(() => import("@/components/landing/BeforeAfter").then(m => m.BeforeAfter), { loading: () => <div className="min-h-[500px] animate-pulse bg-slate-50 w-full" /> })
const ScrollyFeatureSection = dynamic(() => import("@/components/landing/ScrollyFeatureSection").then(m => m.ScrollyFeatureSection), { loading: () => <div className="min-h-[800px] animate-pulse bg-slate-50 w-full" /> })
const ROICalculator = dynamic(() => import("@/components/landing/ROICalculator").then(m => m.ROICalculator), { loading: () => <div className="min-h-[600px] animate-pulse bg-slate-50 w-full" /> })
const Testimonials = dynamic(() => import("@/components/landing/Testimonials").then(m => m.Testimonials), { loading: () => <div className="min-h-[500px] animate-pulse bg-slate-50 w-full" /> })
const MobilePreview = dynamic(() => import("@/components/landing/MobilePreview").then(m => m.MobilePreview), { loading: () => <div className="min-h-[600px] animate-pulse bg-slate-50 w-full" /> })
const Pricing = dynamic(() => import("@/components/landing/Pricing").then(m => m.Pricing), { loading: () => <div className="min-h-[600px] animate-pulse bg-slate-50 w-full" /> })
const FAQ = dynamic(() => import("@/components/landing/FAQ").then(m => m.FAQ), { loading: () => <div className="min-h-[500px] animate-pulse bg-slate-50 w-full" /> })
const FinalCTA = dynamic(() => import("@/components/landing/FinalCTA").then(m => m.FinalCTA), { loading: () => <div className="min-h-[400px] animate-pulse bg-primary/5 w-full" /> })
const Contact = dynamic(() => import("@/components/landing/Contact").then(m => m.Contact), { loading: () => <div className="min-h-[500px] animate-pulse bg-slate-50 w-full" /> })
const AboutEMitra = dynamic(() => import("@/components/landing/AboutEMitra").then(m => m.AboutEMitra), { loading: () => <div className="min-h-[400px] animate-pulse bg-slate-900 w-full" /> })

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'GymMitra',
        url: 'https://gym.emitra.dev',
        description: 'GymMitra – India\'s #1 gym management software with WhatsApp automation, billing, and member management.',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'GymMitra',
        applicationCategory: 'BusinessApplication',
        offers: {
           '@type': 'Offer',
           price: '0',
           priceCurrency: 'INR',
           description: '1-month free trial',
        },
      }
    ],
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />
      
      <main className="relative">
        <Hero />

        <div className="relative z-10 bg-white">
            <Reveal><SocialProof /></Reveal>
            <Reveal><LiveDemo /></Reveal>
            <Reveal><BeforeAfter /></Reveal>
            <ScrollyFeatureSection />
            <Reveal><ROICalculator /></Reveal>
            <Reveal><Testimonials /></Reveal>
            <Reveal><MobilePreview /></Reveal>
            <Reveal><Pricing /></Reveal>
            <Reveal><FAQ /></Reveal>
            <Reveal><AboutEMitra /></Reveal>
            <Reveal><Contact /></Reveal>
            <Reveal><FinalCTA /></Reveal>
        </div>
      </main>

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
                <a href="#features" className="hover:text-primary transition-colors">Features</a>
                <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
                <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
            </div>
            <div className="pt-12 border-t border-white/5 w-full flex justify-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                    &copy; {new Date().getFullYear()} eMitra Technologies • INDORE
                </span>
            </div>
          </div>
        </div>
      </footer>
      
      <MobileStickyCTA />
    </div>
  )
}
