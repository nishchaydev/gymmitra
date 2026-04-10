import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AdminService } from "@/src/modules/admin/service"
import { SaaSPlan } from "@prisma/client"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const codes = await AdminService.listRegistrationCodes(user.email)
        return NextResponse.json(codes)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 403 : 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await request.json()
        const { code, plan, maxUses, daysValid } = body

        if (!code || !plan || maxUses === undefined || daysValid === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const newCode = await AdminService.createRegistrationCode(user.email, code, plan as SaaSPlan, Number(maxUses), Number(daysValid))
        return NextResponse.json(newCode)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 403 : 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        await AdminService.deleteRegistrationCode(user.email, id)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 403 : 500 })
    }
}
