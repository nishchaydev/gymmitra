import { getAuthGym } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";

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
                <ReactQueryProvider>
                    <div className="flex-1 overflow-y-auto pt-4">
                        {children}
                    </div>
                </ReactQueryProvider>
            </>
        );
    }

    // 1. Verify Gym Slug exists
    const gym = await prisma.gymProfile.findUnique({
        where: { slug },
    });

    if (!gym) {
        notFound();
    }

    // 2. Check Auth Context
    const auth = await getAuthGym();

    // If not logged in, redirect to login
    if (!auth) {
        redirect("/login");
    }

    // If logged in but slug mismatch, redirect to THEIR gym's slug
    // This ensures members/staff can't wander into other gyms (multi-tenancy check)
    if (auth.gym.slug !== slug) {
        redirect(`/${auth.gym.slug}/dashboard`);
    }

    return (
        <>
            <Navbar />
            <ReactQueryProvider>
                <div className="flex-1 overflow-y-auto pt-4">
                    {children}
                </div>
            </ReactQueryProvider>
        </>
    );
}

