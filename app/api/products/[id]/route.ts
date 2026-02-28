import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit-logger'

const productUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    category: z.enum(['PROTEIN', 'SUPPLEMENT', 'MERCHANDISE', 'OTHER']).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    lowStockAlert: z.number().int().min(0).optional(),
    image: z.string().optional(),
})

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const id = params.id
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(100, `${auth.userId}:products:get`)
        if (rl) return rl

        const product = await prisma.product.findFirst({
            where: {
                id,
                gymId: auth.gym.id,
                isActive: true
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
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Lower limit for mutations
        const rl = await guardRateLimit(30, `${auth.userId}:products:put`)
        if (rl) return rl

        const body = await request.json()
        const validatedData = productUpdateSchema.parse(body)

        const updateResult = await prisma.product.updateMany({
            where: {
                id,
                gymId: auth.gym.id,
                isActive: true
            },
            data: validatedData
        })

        if (updateResult.count === 0) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 })
        }

        // Audit Log
        const ipHeader = request.headers.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'
        await recordAuditLog({
            gymId: auth.gym.id,
            actorId: auth.userId,
            action: 'UPDATE_PRODUCT',
            entityType: 'PRODUCT',
            entityId: id,
            ipAddress: ip,
            payload: { changedFields: Object.keys(validatedData) }
        }).catch(err => console.error('recordAuditLog UPDATE_PRODUCT', err))

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
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Lower limit for destructive operations
        const rl = await guardRateLimit(30, `${auth.userId}:products:delete`)
        if (rl) return rl

        const result = await prisma.product.updateMany({
            where: {
                id,
                gymId: auth.gym.id,
                isActive: true
            },
            data: { isActive: false }
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 })
        }

        // Audit Log
        const ipHeader = request.headers.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'
        await recordAuditLog({
            gymId: auth.gym.id,
            actorId: auth.userId,
            action: 'DELETE_PRODUCT',
            entityType: 'PRODUCT',
            entityId: id,
            ipAddress: ip
        }).catch(err => console.error('recordAuditLog DELETE_PRODUCT', err))

        return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (error) {
        console.error(`Failed to delete product ${id}:`, error)
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        )
    }
}
