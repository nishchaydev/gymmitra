import { getAuthGym } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

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
            redirect("/onboarding");
        }

        redirect("/login");
    }

    // Redirect to the professional branded dashboard
    if (auth.gym && auth.gym.slug) {
        redirect(`/${auth.gym.slug}/dashboard`);
    }

    // Fallback if slug is missing or auth is incomplete
    redirect("/onboarding");
}
