import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'

// Fix 13 request: rate limit 20
const SETTINGS_RATE_LIMIT = 20

const settingsSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Phone number is required"),
    address: z.string().optional(),
    gst: z.string().optional(),
    invoicePrefix: z.string().min(1).max(5).optional(),
    termsAndConditions: z.string().max(1000).optional(),
})

export async function GET() {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        let rl;
        try {
            rl = await guardRateLimit(SETTINGS_RATE_LIMIT, `${auth.userId}:settings:get`)
        } catch (err) {
            console.error('[Settings GET] Rate limit infra failure:', err)
        }
        if (rl) return rl

        return NextResponse.json(auth.gym)
    } catch (error) {
        console.error('Failed to fetch settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        let rl;
        try {
            rl = await guardRateLimit(SETTINGS_RATE_LIMIT, `${auth.userId}:settings:put`)
        } catch (err) {
            console.error('[Settings PUT] Rate limit infra failure:', err)
        }
        if (rl) return rl

        let body;
        try {
            body = await request.json()
        } catch (e) {
            console.error('Failed to parse settings JSON:', e)
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const data = settingsSchema.parse(body)

        const gymProfile = await prisma.gymProfile.upsert({
            where: { userId: auth.userId },
            update: data,
            create: {
                ...data,
                userId: auth.userId,
            },
        })

        return NextResponse.json(gymProfile)
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Settings validation failed:', error.flatten())
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        console.error('Failed to update settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
