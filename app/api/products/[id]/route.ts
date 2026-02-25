import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'
import { apiLimiter, RateLimitError } from '@/lib/rate-limit'

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
    const auth = await getAuthGym()
    return auth ? auth.gym : null
}

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const id = params.id
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        try { await apiLimiter.check(100, `${gym.id}:products:get`) } catch (e) {
            if (e instanceof RateLimitError) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
            throw e
        }

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
        console.error(`Failed to fetch product ${id}:`, error)
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const id = params.id
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        try { await apiLimiter.check(100, `${gym.id}:products:put`) } catch (e) {
            if (e instanceof RateLimitError) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
            throw e
        }

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
        console.error(`Failed to update product ${id}:`, error)
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const id = params.id
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        try { await apiLimiter.check(100, `${gym.id}:products:delete`) } catch (e) {
            if (e instanceof RateLimitError) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
            throw e
        }

        // Soft delete - verify ownership and ensure it's currently active
        const result = await prisma.product.updateMany({
            where: {
                id,
                gymId: gym.id,
                isActive: true
            },
            data: { isActive: false }
        })

        if (result.count === 0) {
            // Check if it exists but is already deleted (idempotency)
            const exists = await prisma.product.findFirst({
                where: { id, gymId: gym.id }
            })

            if (!exists) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 })
            }

            return NextResponse.json({ message: 'Product already deleted' }, { status: 200 })
        }

        return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (error) {
        console.error(`Failed to delete product ${id}:`, error)
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        )
    }
}
