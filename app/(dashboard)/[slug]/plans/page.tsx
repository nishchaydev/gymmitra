"use client"

import { PlanManagement } from "@/components/settings/PlanManagement"
import { useParams } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { ClipboardList } from "lucide-react"

export default function PlansPage() {
    const { slug } = useParams() as { slug: string }

    return (
        <div className="space-y-6 p-10 pb-16 block">
            <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">Membership Plans</h2>
                </div>
                <p className="text-muted-foreground">
                    Create and manage the subscription plans offered at your gym.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border shadow-sm">
                <PlanManagement />
            </div>
        </div>
    )
}
