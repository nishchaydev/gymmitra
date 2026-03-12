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

import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0066FF",
};

export const metadata: Metadata = {
  title: {
    default: "GymMitra",
    template: "%s | GymMitra"
  },
  description: "Complete gym management software for Indian gym owners",
  metadataBase: new URL(process.env.NEXT_PUBLIC_METADATA_BASE || 'https://gym.emitra.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "GymMitra — Apka Gym, Apka Control",
    description: "Manage members, renewals, billing & WhatsApp automation from one dashboard",
    url: "https://gym.emitra.dev",
    siteName: 'GymMitra',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'GymMitra - India\'s Best Gym Management Software',
    }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GymMitra',
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
