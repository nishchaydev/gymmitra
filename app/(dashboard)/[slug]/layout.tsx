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

    // Demo bypass handled internally or via the root dashboard page
    if (slug === 'demo') {
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

