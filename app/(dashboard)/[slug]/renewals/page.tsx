import { Metadata } from "next"
import { getAuthGym } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RenewalCommandCenter } from "@/components/renewals/RenewalCommandCenter"
import { ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const metadata: Metadata = {
    title: "Renewals",
    description: "Manage upcoming and missed memberships.",
}

export default async function RenewalsPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const cookieStore = await cookies()
    const envDemoEnabled = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true'
    const isDemo = envDemoEnabled && cookieStore.get('mitra_demo_mode')?.value === 'true'

    const auth = await getAuthGym()

    if (!auth && !isDemo) {
        redirect("/login")
    }

    const gymName = auth?.gym?.businessName || auth?.gym?.name || "GymMitra Showcase"

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <ShieldAlert className="h-8 w-8 text-indigo-600" />
                        Renewals
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium flex items-center gap-2 text-sm md:text-base">
                        Never miss a renewal. Chase expiring and missed memberships.
                    </p>
                </div>
            </div>

            <RenewalCommandCenter gymName={gymName} isDemo={isDemo} />
        </div>
    )
}
