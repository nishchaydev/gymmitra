'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const email = body.email?.toLowerCase().trim()
        if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

        const gym = await prisma.gymProfile.findUnique({ where: { userId: user.id } })
        if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 })

        const existing = await prisma.staffMember.findFirst({
            where: { email, gymId: gym.id },
        })

        return NextResponse.json({ exists: !!existing })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
