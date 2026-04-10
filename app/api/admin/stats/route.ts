import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AdminService } from "@/src/modules/admin/service"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const stats = await AdminService.getDashboardMetrics(user.email)
        return NextResponse.json(stats)
    } catch (error: any) {
        console.error("[Admin Stats API] Error:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" }, 
            { status: error.message === 'Unauthorized' ? 403 : 500 }
        )
    }
}
