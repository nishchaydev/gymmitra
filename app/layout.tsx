import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Gym Mitra | #1 Gym Management Software in India | WhatsApp Automation",
  description: "Automate your gym with Gym Mitra. India's top ERP for fitness businesses. Automated WhatsApp reminders, member app, biometric access, and GST invoicing. Save 20+ hours every month.",
  keywords: "gym management software, fitness erp india, whatsapp gym automation, gym membership app, gym billing software gst",
  openGraph: {
    title: "Gym Mitra - Run Your Gym on Autopilot",
    description: "Save 20 hours/month with India's most advanced gym management platform.",
    url: "https://gymmitra.vercel.app",
    siteName: "Gym Mitra",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_IN",
    type: "website",
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
    <html lang="en">
      <body
        className={`${fontSans.variable} font-sans antialiased min-h-screen flex flex-col bg-white selection:bg-primary-100 selection:text-primary-900`}
      >
        <Navbar />
        <main className="flex-1 bg-gray-50/50">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
