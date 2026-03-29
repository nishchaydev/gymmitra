import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { apiLimiter } from '@/lib/rate-limit'
import { productService } from '@/src/modules/products/service'
import { productRepository } from '@/src/modules/products/repository'
import { productSchema } from '@/src/modules/products/validator'

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit: 100 requests per minute per user
        try {
            await apiLimiter.check(100, `${auth.userId}:GET:/api/products`)
        } catch (error: any) {
            if (error.retryAfter) {
                return NextResponse.json(
                    { error: 'Too many requests', retryAfter: error.retryAfter },
                    { status: 429, headers: { 'Retry-After': String(error.retryAfter) } }
                )
            }
            console.error('Rate limiter failed:', error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        const gym = auth.gym

        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q') || undefined
        const category = searchParams.get('category') || undefined
        const lowStock = searchParams.get('lowStock') === 'true'

        const products = await productRepository.findAll(gym.id, { q, category, lowStock })

        return NextResponse.json(products)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit: 50 creations per minute per user
        try {
            await apiLimiter.check(50, `${auth.userId}:POST:/api/products`)
        } catch (error: any) {
            if (error.retryAfter) {
                return NextResponse.json(
                    { error: 'Too many requests', retryAfter: error.retryAfter },
                    { status: 429, headers: { 'Retry-After': String(error.retryAfter) } }
                )
            }
            console.error('Rate limiter failed:', error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        const gym = auth.gym

        // Only OWNER can create products
        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        let body;
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 })
        }

        const ipHeader = request.headers.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        const product = await productService.createProduct(gym.id, body, auth.userId, ip)

        return NextResponse.json(product, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            )
        }
        console.error('Error creating product:', error)
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        )
    }
}
