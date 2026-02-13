import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const productUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    category: z.enum(['PROTEIN', 'SUPPLEMENT', 'MERCHANDISE', 'OTHER']).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    lowStockAlert: z.number().int().min(0).optional(),
    image: z.string().optional(),
})

async function getAuthenticatedGym() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return await prisma.gymProfile.findUnique({ where: { userId: user.id } })
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const product = await prisma.product.findFirst({
            where: {
                id,
                gymId: gym.id, // Security Check
                isActive: true // Filter out soft-deleted products
            }
        })

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(product)
    } catch (error) {
        console.error(`Failed to fetch product ${params}:`, error)
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const validatedData = productUpdateSchema.parse(body)

        // Atomic update to avoid TOCTOU and respect ownership/active status
        const updateResult = await prisma.product.updateMany({
            where: {
                id,
                gymId: gym.id,
                isActive: true
            },
            data: validatedData
        })

        if (updateResult.count === 0) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 })
        }

        const product = await prisma.product.findUnique({
            where: { id }
        })

        return NextResponse.json(product)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            )
        }
        console.error(`Failed to update product ${params}:`, error)
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params

        // Soft delete - verify ownership
        const result = await prisma.product.updateMany({
            where: {
                id,
                gymId: gym.id
            },
            data: { isActive: false }
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 })
        }

        return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (error) {
        console.error(`Failed to delete product ${params}:`, error)
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        )
    }
}
