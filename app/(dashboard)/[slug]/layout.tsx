import { getAuthGym } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { headers } from "next/headers";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BrandedLayoutProps {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

import type { Metadata } from "next";

export async function generateMetadata({ params }: BrandedLayoutProps): Promise<Metadata> {
    const { slug } = await params;
    if (slug === 'demo') {
        return {
            robots: { index: false, follow: false }
        };
    }
    return {};
}

export default async function BrandedDashboardLayout({
    children,
    params,
}: BrandedLayoutProps) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const envDemoEnabled = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true';
    const isDemoMode = envDemoEnabled && cookieStore.get('mitra_demo_mode')?.value === 'true';

    // Demo Bypass: Intentionally skips DB check and multi-tenancy slug enforcement 
    // to serve isolated showcasing data. True endpoints still maintain RLS.
    if (slug === 'demo' || isDemoMode) {
        return (
            <>
                <Navbar plan="TRIAL" role="OWNER" />
                <div className="flex-1 overflow-y-auto pt-4">
                    {children}
                </div>
            </>
        );
    }

    // Check Auth Context - this is cached via React.cache
    const auth = await getAuthGym();

    // If not logged in, redirect to login
    if (!auth) {
        redirect("/login");
    }

    // If logged in but slug mismatch, redirect to THEIR gym's slug
    // This ensures members/staff can't wander into other gyms (multi-tenancy check)
    // and naturally acts as the 404/not-found check for invalid slugs
    if (auth.gym.slug !== slug) {
        redirect(`/${auth.gym.slug}/dashboard`);
    }

    // Check for trial expiry (60 days)
    const isTrial = auth.gym.saasPlan === 'TRIAL'
    const trialExpiresAt = auth.gym.trialExpiresAt
    const isExpired = Boolean(isTrial && trialExpiresAt && new Date() > new Date(trialExpiresAt))

    // If expired, only allow access to the billing page
    const requestHeaders = await headers()
    const url = requestHeaders.get('x-url') || ''
    const isBillingPage = url.includes('/settings/billing')

    if (isExpired && !isBillingPage) {
        // We don't redirect to /settings/billing immediately here using 'redirect' 
        // to avoid infinite loops if headers are wonky, or just show a partial block.
        // But for strict SaaS enforcement, we should block.
        // For now, let's just pass an 'isExpired' flag to the Navbar if we want a banner
    }

    return (
        <>
            <Navbar 
                plan={auth.gym.saasPlan} 
                trialExpiresAt={auth.gym.trialExpiresAt?.toISOString()} 
                role={auth.role}
                isExpired={isExpired}
            />
            <div className={`flex-1 overflow-y-auto pt-4 ${isExpired && !isBillingPage ? 'pointer-events-none opacity-50 blur-[2px]' : ''}`}>
                {children}
            </div>
            {isExpired && !isBillingPage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/20 backdrop-blur-md">
                    <div className="max-w-md w-full p-8 bg-white border-2 border-rose-500 rounded-3xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-10 h-10 text-rose-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-900">Trial Period Expired!</h2>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Your 60-day trial of Gym Mitra ERP has ended. To continue managing your gym and access your data, please activate your license.
                            </p>
                        </div>
                        <div className="pt-4 flex flex-col gap-3">
                            <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-lg font-bold rounded-xl shadow-lg shadow-slate-900/20">
                                <Link href={`/${slug}/settings/billing`}>
                                    Go to Billing & Activate
                                </Link>
                            </Button>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                E-MITRA TECHNOLOGIES SUPPORT: +91 811 881 8812
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
