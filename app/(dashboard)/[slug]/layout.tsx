import { getAuthGym } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";

interface BrandedLayoutProps {
    children: ReactNode;
    params: Promise<{ slug: string }>;
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
                <Navbar />
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

    return (
        <>
            <Navbar />
            <div className="flex-1 overflow-y-auto pt-4">
                {children}
            </div>
        </>
    );
}
