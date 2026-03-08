import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'

const planSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    duration: z.number().min(1),
    price: z.number().min(0),
    features: z.array(z.string()).optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const auth = await getAuthGym()
        if (!auth || !auth.gym || typeof auth.userId !== 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        const body = await request.json()
        const validatedData = planSchema.parse(body)

        // Verify ownership
        const existingPlan = await prisma.membershipPlan.findUnique({
            where: { id }
        })

        if (!existingPlan || existingPlan.gymId !== auth.gym.id) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        const plan = await prisma.membershipPlan.update({
            where: { id },
            data: validatedData
        })

        return NextResponse.json(plan)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const auth = await getAuthGym()
        if (!auth || !auth.gym || typeof auth.userId !== 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        const existingPlan = await prisma.membershipPlan.findUnique({
            where: { id }
        })

        if (!existingPlan || existingPlan.gymId !== auth.gym.id) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Check if there are active memberships with this plan
        const membershipsCount = await prisma.memberSubscription.count({
            where: { planId: id, status: 'ACTIVE' }
        })

        if (membershipsCount > 0) {
            // Soft delete instead by setting isActive = false, or just return error
            // For now, let's just do soft delete
            const plan = await prisma.membershipPlan.update({
                where: { id },
                data: { isActive: false }
            })
            return NextResponse.json(plan)
        }

        await prisma.membershipPlan.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete Plan Error:", error)
        return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
    }
}
