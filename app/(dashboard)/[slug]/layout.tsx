import { getAuthGym } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { headers } from "next/headers";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { TrialLockout } from "@/components/trial/TrialLockout";
import { LazyMotionProvider } from "@/lib/lazy-motion";
import { MobileBottomDock } from "@/components/MobileBottomDock";

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

    // Demo Bypass
    if (slug === 'demo' || isDemoMode) {
        return (
            <LazyMotionProvider>
            <Navbar plan="TRIAL" role="OWNER" />
                <div className="flex-1 overflow-y-auto pt-4 pb-20 md:pb-0">
                    {children}
                </div>
                <MobileBottomDock plan="TRIAL" role="OWNER" />
            </LazyMotionProvider>
        );
    }

    // Check Auth Context
    const auth = await getAuthGym();

    if (!auth) {
        redirect("/login");
    }

    if (auth.gym.slug !== slug) {
        redirect(`/${auth.gym.slug}/dashboard`);
    }

    // Check for trial status
    const gym = auth.gym;
    const isTrial = gym.saasPlan === 'TRIAL';
    const isExpired = gym.trialExpiresAt && new Date(gym.trialExpiresAt) < new Date();
    const isLocked = isTrial && isExpired;

    // Calculate days remaining for banner
    const now = new Date();
    const expiresAt = gym.trialExpiresAt ? new Date(gym.trialExpiresAt) : null;
    const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const showExpiryBanner = isTrial && !isExpired && daysRemaining <= 7 && daysRemaining >= 0 && auth.role === 'OWNER';

    return (
        <LazyMotionProvider>
        <div className="flex flex-col min-h-screen">
            {showExpiryBanner && (
                <div className="bg-amber-600 text-white py-2 px-4 shadow-md sticky top-0 z-[60] flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                    <p className="text-sm font-bold">
                        {daysRemaining === 0 ? (
                            <>Your trial <span className="underline decoration-2 underline-offset-2 font-black uppercase tracking-tight">ends today!</span> Please activate your license to avoid any service interruption.</>
                        ) : (
                            <>Friendly Alert: Your trial ends in <span className="underline decoration-2 underline-offset-2">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span>. Please activate your license to avoid any service interruption.</>
                        )}
                    </p>
                    <Button asChild size="sm" variant="secondary" className="h-7 px-3 text-xs font-black uppercase text-amber-700 hover:text-amber-800 bg-white hover:bg-slate-100 border-none">
                        <Link href={`/${slug}/settings?tab=billing`}>Activate Now</Link>
                    </Button>
                </div>
            )}
            <Navbar 
                plan={auth.gym.saasPlan} 
                trialExpiresAt={auth.gym.trialExpiresAt?.toISOString()} 
                role={auth.role}
                isExpired={!!isExpired}
            />
            <main className="flex-1 relative">
                <TrialLockout slug={slug} isLocked={!!isLocked}>
                    <div className="flex-1 overflow-y-auto pt-4 pb-20 md:pb-0">
                        {children}
                    </div>
                </TrialLockout>
            </main>
            <MobileBottomDock 
                plan={auth.gym.saasPlan}
                trialExpiresAt={auth.gym.trialExpiresAt?.toISOString()}
                role={auth.role}
                isExpired={!!isExpired}
            />
        </div>
        </LazyMotionProvider>
    );
}
