import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import { headers } from 'next/headers';
import "./globals.css";

const fontDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-display-custom",
  weight: ["400", "500", "600", "700", "800"],
  display: 'swap',
});

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-custom",
  weight: ["400", "500", "600", "700"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gym Mitra - #1 Gym Management Software in India | WhatsApp Automation',
  description: 'Gym Mitra (GymMitra) by eMitra Technologies – India\'s #1 gym management software. Automate your gym with WhatsApp reminders, instant invoicing, and member app. Trusted by 50+ gyms across India. Free 14-day trial. Also known as Gym eMitra.',
  keywords: [
    'gym mitra',
    'gymmitra',
    'gym emitra',
    'gym mitra software',
    'gym mitra app',
    'gym mitra erp',
    'gym management software India',
    'gym management system',
    'WhatsApp automation',
    'fitness ERP',
    'gym billing software',
    'member management',
    'gym attendance tracking',
    'gym erp india',
    'gym software for small gym',
    'emitra gym software',
    'gym mitra india',
    'best gym software india'
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gymmitra.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Gym Mitra (GymMitra) - Automate Your Gym\'s Growth',
    description: 'Gym Mitra by eMitra – Save 20 hours/month with automated billing, WhatsApp reminders & instant invoicing. India\'s best gym management software.',
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
    title: 'Gym Mitra (GymMitra) - #1 Gym Management Software in India',
    description: 'Gym Mitra by eMitra – Save 20 hours/month with India\'s most advanced gym management platform. Also known as Gym eMitra.',
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
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gym Mitra',
  },
  formatDetection: {
    telephone: false,
  },
};

import { Toaster } from "@/components/ui/sonner"
import { Navbar } from "@/components/Navbar"
import { PwaSyncProvider } from "@/components/PwaSyncProvider"

import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? undefined;
  return (
    <html lang="en" className="scroll-smooth scroll-pt-24">
      <body
        className={`${fontDisplay.variable} ${fontSans.variable} font-sans antialiased min-h-screen flex flex-col bg-white selection:bg-primary-500/10 selection:text-primary-900`}
      >
        <ReactQueryProvider>
          <main className="flex-1 bg-gray-50/50">
            {children}
          </main>
          <PwaSyncProvider />
          <Toaster />
          {gaId && <GoogleAnalytics gaId={gaId} nonce={nonce} />}
          <Analytics />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
