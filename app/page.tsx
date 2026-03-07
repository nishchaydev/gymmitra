import dynamic from "next/dynamic"
import Link from "next/link"
import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { MobileStickyCTA } from "@/components/landing/MobileStickyCTA"
import { ShieldCheck, Zap, Award, Building2 } from "lucide-react"

const SocialProof = dynamic(() => import("@/components/landing/SocialProof").then(m => m.SocialProof), { loading: () => <div className="min-h-[200px] animate-pulse bg-slate-50 w-full" /> })
const LiveDemo = dynamic(() => import("@/components/landing/LiveDemo").then(m => m.LiveDemo), { loading: () => <div className="min-h-[600px] animate-pulse bg-slate-50 w-full" /> })
const BeforeAfter = dynamic(() => import("@/components/landing/BeforeAfter").then(m => m.BeforeAfter), { loading: () => <div className="min-h-[500px] animate-pulse bg-slate-50 w-full" /> })
const Features = dynamic(() => import("@/components/landing/Features").then(m => m.Features), { loading: () => <div className="min-h-[800px] animate-pulse bg-slate-50 w-full" /> })
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
        name: 'Gym Mitra',
        alternateName: ['GymMitra', 'Gym eMitra', 'Gym Mitra ERP'],
        url: 'https://gym.emitra.dev',
        description: 'Gym Mitra (GymMitra) by eMitra Technologies – India\'s #1 gym management software with WhatsApp automation, billing, and member management.',
        parentOrganization: {
          '@type': 'Organization',
          name: 'eMitra Technologies',
          url: 'https://emitra.dev',
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Gym Mitra',
        alternateName: ['GymMitra', 'Gym eMitra'],
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
          description: '14-day free trial',
        },
        description: 'Gym Mitra – India\'s #1 gym management software. Automate billing, WhatsApp reminders, attendance tracking, and member management.',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: "4.9",
          reviewCount: "50",
          bestRating: "5",
          worstRating: "1",
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Gym Mitra (GymMitra)?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Gym Mitra, also known as GymMitra or Gym eMitra, is India\'s #1 gym management software built by eMitra Technologies. It automates member management, billing, WhatsApp reminders, attendance tracking, and invoicing – helping gym owners save 20+ hours every month.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do I need to pay a setup fee?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. There are no hidden setup fees. You only pay the subscription price associated with your membership tier.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does Gym Mitra work with my biometric machine?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'GymMitra is compatible with most standard essl and Realtime biometric devices. Contact our support to verify your specific model.',
            },
          },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

        {/* 11. Ecosystem - eMitra Technologies */}
        <AboutEMitra />

        {/* 12. Contact Form */}
        <Contact />

        {/* 13. Final Push - CTA */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <footer className="relative bg-midnight text-slate-300 py-24 overflow-hidden border-t border-midnight-700">
        {/* Subtle glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 mb-20">
            {/* Branding Column */}
            <div className="md:col-span-4 space-y-8">
              <div>
                <Link href="/" className="inline-block group">
                  <div className="font-display font-extrabold text-3xl tracking-tight text-white flex items-center gap-1 group-hover:scale-[1.02] transition-transform duration-300">
                    Gym<span className="text-primary">Mitra</span>
                  </div>
                </Link>
                <p className="mt-6 text-slate-400 leading-relaxed max-w-sm font-medium">
                  Gym Mitra (Gym eMitra) – The most advanced ERP solution for modern gyms in India.
                  Streamlining operations and accelerating growth for 50+ fitness businesses.
                </p>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 inline-flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">A product of</span>
                    <span className="block text-sm font-bold text-slate-200">eMitra Technologies</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="space-y-6">
                <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] font-display">Product</h4>
                <ul className="space-y-4">
                  <li><Link href="#features" className="text-sm hover:text-ocean transition-colors duration-200">Features</Link></li>
                  <li><Link href="#pricing" className="text-sm hover:text-ocean transition-colors duration-200">Pricing</Link></li>
                  <li><Link href="/login?view=register" className="text-sm hover:text-ocean transition-colors duration-200">Request Demo</Link></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] font-display">Resources</h4>
                <ul className="space-y-4">
                  <li><Link href="#!" aria-disabled="true" className="text-sm text-slate-500 cursor-not-allowed pointer-events-none">Support Center <span className="text-[10px] uppercase ml-1 opacity-70">Soon</span></Link></li>
                  <li><Link href="#!" aria-disabled="true" className="text-sm text-slate-500 cursor-not-allowed pointer-events-none">API Documentation <span className="text-[10px] uppercase ml-1 opacity-70">Soon</span></Link></li>
                  <li><Link href="#!" aria-disabled="true" className="text-sm text-slate-500 cursor-not-allowed pointer-events-none">Community Forum <span className="text-[10px] uppercase ml-1 opacity-70">Soon</span></Link></li>
                  <li><Link href="#!" aria-disabled="true" className="text-sm text-slate-500 cursor-not-allowed pointer-events-none">Video Tutorials <span className="text-[10px] uppercase ml-1 opacity-70">Soon</span></Link></li>
                </ul>
              </div>
              <div className="space-y-6 col-span-2 sm:col-span-1">
                <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] font-display">Legal</h4>
                <ul className="space-y-4">
                  <li><Link href="/privacy" className="text-sm hover:text-ocean transition-colors duration-200">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-sm hover:text-ocean transition-colors duration-200">Terms of Service</Link></li>
                  <li><Link href="/cookies" className="text-sm hover:text-ocean transition-colors duration-200">Cookie Policy</Link></li>
                  <li><Link href="/security" className="text-sm hover:text-ocean transition-colors duration-200">Security Details</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-xs font-bold text-slate-500 tracking-wide text-center md:text-left uppercase">
              &copy; {new Date().getFullYear()} eMitra Technologies. All rights reserved.
              <span className="block sm:inline ml-0 sm:ml-2">Crafted with precision in India.</span>
            </div>
          </div>
        </div>
      </footer>
      <MobileStickyCTA />
    </div>
  )
}
