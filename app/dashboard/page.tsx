import { getAuthGym } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

/**
 * Root dashboard redirector.
 * This page handles the logic for sending authenticated users to their specific gym dashboard.
 * If the user is unverified, they are sent to onboarding.
 */
export default async function DashboardRedirect() {
    const auth = await getAuthGym();
    const headerList = await headers();
    const isDemoMode = headerList.get('x-demo-mode') === 'true';

    if (isDemoMode) {
        redirect("/demo/dashboard");
    }

    if (!auth) {
        // If they reach here without auth context, we check if they are at least logged in to Supabase.
        // If yes, they probably haven't finished onboarding (or their gym profile was deleted).
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Dashboard] No auth context found for user ${user.id}, redirecting to /onboarding`)
            }
            redirect("/onboarding");
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`[Dashboard] Not authenticated, redirecting to /login`)
        }
        redirect("/login");
    }

    // Redirect to the professional branded dashboard
    if (auth?.gym) {
        const redirectUrl = auth.gym.slug ? `/${auth.gym.slug}/dashboard` : "/onboarding";
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Dashboard] User ${auth.userId} (${auth.role}) redirecting from root to: ${redirectUrl}`)
        }
        redirect(redirectUrl);
    }

    // Fallback if slug is missing or auth is incomplete
    if (process.env.NODE_ENV === 'development') {
        console.warn(`[Dashboard] Fallback redirect to /onboarding for user ${auth.userId}`)
    }
    redirect("/onboarding");
}
