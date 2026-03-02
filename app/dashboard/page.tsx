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
        redirect("/login");
    }

    // Redirect to the professional branded dashboard
    if (auth.gym.slug) {
        redirect(`/${auth.gym.slug}/dashboard`);
    }

    // Fallback if slug is somehow missing (shouldn't happen with our population script)
    redirect("/");
}
