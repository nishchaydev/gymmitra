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

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")

        const gyms = await AdminService.getGymList(user.email, page)
        return NextResponse.json(gyms)
    } catch (error: any) {
        console.error("[Admin Gyms List API] Error:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" }, 
            { status: error.message === 'Unauthorized' ? 403 : 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { id, saasPlan, planTier, trialExpiresAt, isVerified } = body

        if (!id) {
            return NextResponse.json({ error: "Gym ID is required" }, { status: 400 })
        }

        let result
        if (isVerified !== undefined && Object.keys(body).length === 2) {
             result = await AdminService.verifyGym(user.email, id)
        } else {
             result = await AdminService.updatePlan(user.email, id, saasPlan, planTier, trialExpiresAt ? new Date(trialExpiresAt) : undefined)
        }

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[Admin Gyms PATCH API] Error:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" }, 
            { status: error.message === 'Unauthorized' ? 403 : 500 }
        )
    }
}
