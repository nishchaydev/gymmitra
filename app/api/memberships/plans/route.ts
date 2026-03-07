import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import { guardRateLimit } from '@/lib/rate-limit'

const planSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    duration: z.number().min(1), // days
    price: z.number().min(0),
    features: z.array(z.string()).optional(),
})

async function getAuth() {
    const auth = await getAuthGym()
    return auth
}

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuth()
        if (!auth || !auth.gym || typeof auth.userId !== 'string') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(100, `${auth.userId}:plans:get`)
        if (rl) return rl

        const plans = await prisma.membershipPlan.findMany({
            where: {
                isActive: true,
                gymId: auth.gym.id
            },
            orderBy: { price: 'asc' }
        })
        return NextResponse.json(plans)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch plans' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuth()
        if (!auth || !auth.gym || typeof auth.userId !== 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        const rl = await guardRateLimit(50, `${auth.userId}:plans:post`)
        if (rl) return rl

        let body;
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const validatedData = planSchema.parse(body)

        const createData: Prisma.MembershipPlanCreateInput = {
            ...validatedData,
            gym: {
                connect: { id: auth.gym.id }
            }
        }

        const plan = await prisma.membershipPlan.create({
            data: createData
        })

        return NextResponse.json(plan, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create plan' },
            { status: 500 }
        )
    }
}
