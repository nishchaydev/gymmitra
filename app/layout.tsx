import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

const fontDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-display-custom",
  weight: ["400", "500", "600", "700", "800"],
});

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-custom",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: 'Gym Mitra - #1 Gym Management Software in India | WhatsApp Automation',
  description: 'Automate your gym with WhatsApp reminders, instant invoicing, and member app. India\'s most advanced Gym ERP. Trusted by 50+ gyms across India. Free 14-day trial.',
  keywords: [
    'gym management software India',
    'gym management system',
    'WhatsApp automation',
    'fitness ERP',
    'gym billing software',
    'member management',
    'gym attendance tracking',
    'gym erp india',
    'gym software for small gym'
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gymmitra.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Gym Mitra - Automate Your Gym\'s Growth',
    description: 'Save 20 hours/month with automated billing, WhatsApp reminders & instant invoicing',
    url: 'https://gymmitra.vercel.app',
    siteName: 'Gym Mitra',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Gym Mitra - India\'s Best Gym Management Software',
    }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gym Mitra - #1 Gym Management Software in India',
    description: 'Save 20 hours/month with India\'s most advanced gym management platform.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { Toaster } from "@/components/ui/sonner"
import { Navbar } from "@/components/Navbar"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${fontDisplay.variable} ${fontSans.variable} font-sans antialiased min-h-screen flex flex-col bg-white selection:bg-primary-500/10 selection:text-primary-900`}
      >
        <Navbar />
        <main className="flex-1 bg-gray-50/50">
          {children}
        </main>
        <Toaster />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX"} />
        <Analytics />
      </body>
    </html>
  );
}
