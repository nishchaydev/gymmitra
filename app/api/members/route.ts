import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'
import { apiLimiter } from '@/lib/rate-limit'

// Schema for member creation
const memberCreateSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Phone number is required"),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string()
        .refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .transform(str => new Date(str)),
    gymId: z.string().min(1, "Gym ID is required").optional(), // Optional since we get it from auth
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit: 100 requests per minute per user
        try {
            await apiLimiter.check(100, `${auth.userId}:members:get`)
        } catch (error: any) {
            if (error.retryAfter) {
                return NextResponse.json(
                    { error: 'Too many requests', retryAfter: error.retryAfter },
                    { status: 429, headers: { 'Retry-After': String(error.retryAfter) } }
                )
            }
            // Log real infrastructure errors but return 500
            console.error('Rate limiter failed:', error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        const gym = auth.gym

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const members = await prisma.member.findMany({
            where: {
                gymId: gym.id,
                ...(status ? { status: status as any } : {}),
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(members)
    } catch (error) {
        console.error('Error fetching members:', error)
        return NextResponse.json(
            { error: 'Failed to fetch members' },
            { status: 500 }
        )
    }
}

// POST method removed: Now using secure Server Actions inside app/members/actions.ts
