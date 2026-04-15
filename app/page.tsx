import dynamic from "next/dynamic"
import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { MobileStickyCTA } from "@/components/landing/MobileStickyCTA"
import { Reveal } from "@/components/landing/ui/Reveal"
import { Footer } from "@/components/landing/Footer"

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

      <Footer />
      
      <MobileStickyCTA />
    </div>
  )
}
