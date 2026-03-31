'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { guardRateLimit } from '@/lib/rate-limit'

const PHONE_REGEX = /^\d{10}$/

export async function POST(request: NextRequest) {
    try {
        // Rate limit: 20 checks per minute per user
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(20, `${user.id}:check-phone`)
        if (rl) return rl

        const body = await request.json()
        const phone = body.phone?.trim()
        if (!phone) return NextResponse.json({ error: 'Phone is required' }, { status: 400 })

        // Validate phone format — prevents garbage input from reaching the DB
        if (!PHONE_REGEX.test(phone)) {
            return NextResponse.json({ error: 'Phone must be exactly 10 digits' }, { status: 400 })
        }

        const gym = await prisma.gymProfile.findUnique({ where: { userId: user.id } })
        if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 })

        const existing = await prisma.member.findFirst({
            where: { phone, gymId: gym.id },
        })

        return NextResponse.json({ exists: !!existing })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
