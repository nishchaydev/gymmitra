import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AdminService } from "@/src/modules/admin/service"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await request.json()
        const { subject, htmlMessage } = body

        if (!subject || !htmlMessage) {
            return NextResponse.json({ error: "Missing subject or message" }, { status: 400 })
        }

        const result = await AdminService.broadcastEmail(user.email, subject, htmlMessage)
        return NextResponse.json(result)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 403 : 500 })
    }
}
