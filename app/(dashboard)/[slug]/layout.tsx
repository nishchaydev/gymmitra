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

    // Check for trial status
    const isTrial = auth.gym.saasPlan === 'TRIAL'
    const trialExpiresAt = auth.gym.trialExpiresAt
    const isExpired = Boolean(isTrial && trialExpiresAt && new Date() > new Date(trialExpiresAt))
    
    // Calculate days left
    const trialDaysLeft = trialExpiresAt 
        ? Math.ceil((new Date(trialExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    
    const showWarningBanner = isTrial && !isExpired && trialDaysLeft <= 7 && auth.role === 'OWNER';

    return (
        <>
            {showWarningBanner && (
                <div className="bg-amber-600 text-white py-2 px-4 shadow-md sticky top-0 z-[60] flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                    <p className="text-sm font-bold">
                        Friendly Alert: Your trial ends in <span className="underline decoration-2 underline-offset-2">{trialDaysLeft} days</span>. 
                        Please activate your license to avoid any data loss.
                    </p>
                    <Button asChild size="sm" variant="secondary" className="h-7 px-3 text-xs font-black uppercase text-amber-700 hover:text-amber-800 bg-white hover:bg-slate-100 border-none">
                        <Link href={`/${slug}/settings/billing`}>Activate Now</Link>
                    </Button>
                </div>
            )}
            <Navbar 
                plan={auth.gym.saasPlan} 
                trialExpiresAt={auth.gym.trialExpiresAt?.toISOString()} 
                role={auth.role}
                isExpired={isExpired}
            />
            <div className="flex-1 overflow-y-auto pt-4 transition-all duration-300">
                {children}
            </div>
        </>
    );
}
