"use client"

import { StaffManagement } from "@/components/settings/StaffManagement"
import { useParams } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Users } from "lucide-react"

export default function StaffPage() {
    const { slug } = useParams() as { slug: string }

    return (
        <div className="space-y-6 p-10 pb-16 block">
            <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">Staff Management</h2>
                </div>
                <p className="text-muted-foreground">
                    Add and manage trainers and administrators for your gym.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border shadow-sm">
                <StaffManagement />
            </div>
        </div>
    )
}
