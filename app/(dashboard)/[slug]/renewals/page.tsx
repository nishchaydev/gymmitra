import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { RenewalCommandCenter } from "@/components/renewals/RenewalCommandCenter"
import { ShieldAlert } from "lucide-react"

export const metadata: Metadata = {
    title: "Renewals | Gym Mitra",
    description: "Manage upcoming and missed memberships.",
}

export default async function RenewalsPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const gym = await prisma.gymProfile.findUnique({
        where: { userId: user.id }
    })

    if (!gym) {
        redirect("/onboarding")
    }

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

            <RenewalCommandCenter gymName={gym.businessName || gym.name} />
        </div>
    )
}
