import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { productService } from '@/src/modules/products/service'
import { productRepository } from '@/src/modules/products/repository'
import { productUpdateSchema } from '@/src/modules/products/validator'

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

        const product = await productRepository.findById(id, auth.gym.id)

        if (!product || !product.isActive) {
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

        const rl = await guardRateLimit(30, `${auth.userId}:products:put`)
        if (rl) return rl

        // Only OWNER can update products
        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        const body = await request.json()
        const validatedData = productUpdateSchema.parse(body)

        const ipHeader = request.headers.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        const product = await productService.updateProduct(id, auth.gym.id, validatedData, auth.userId, ip)

        return NextResponse.json(product)
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            )
        }
        if (error.message === 'Product not found or unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 404 })
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

        const rl = await guardRateLimit(30, `${auth.userId}:products:delete`)
        if (rl) return rl

        // Only OWNER can delete products
        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        const ipHeader = request.headers.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        await productService.deleteProduct(id, auth.gym.id, auth.userId, ip)

        return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (error: any) {
        if (error.message === 'Product not found or unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 404 })
        }
        console.error(`Failed to delete product ${id}:`, error)
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        )
    }
}
