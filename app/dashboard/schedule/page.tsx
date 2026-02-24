import { ScheduleCalendar } from "@/components/dashboard/ScheduleCalendar"
import { getAuthGym } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
    title: "PT Schedule - Gym Mitra ERP",
    description: "Manage personal training sessions and slots.",
}

export default async function SchedulePage() {
    const auth = await getAuthGym()
    if (!auth) redirect('/login')

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Personal Training Schedule</h2>
                    <p className="text-slate-500 mt-1 font-medium">
                        Manage trainer availability and book client sessions.
                    </p>
                </div>
            </div>
            <ScheduleCalendar role={auth.role} currentUserId={auth.staffId} />
        </div>
    )
}
