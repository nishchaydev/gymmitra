import { getAuthGym } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
    const auth = await getAuthGym();

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
