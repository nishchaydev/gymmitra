import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { apiLimiter } from '@/lib/rate-limit'

const productSchema = z.object({
    name: z.string().min(2),
    category: z.enum(['PROTEIN', 'SUPPLEMENT', 'MERCHANDISE', 'OTHER']),
    description: z.string().optional(),
    price: z.number().min(0),
    stock: z.number().int().min(0),
    lowStockAlert: z.number().int().min(0).default(10),
    image: z.string().optional(),
    gymId: z.string().min(1).optional(), // Optional since we get it from auth
})

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
        const q = searchParams.get('q')
        const category = searchParams.get('category')
        const lowStock = searchParams.get('lowStock') === 'true'

        const whereClause: any = {
            isActive: true,
            gymId: gym.id
        }

        if (q) {
            whereClause.name = { contains: q, mode: 'insensitive' }
        }

        if (category && category !== 'ALL') {
            whereClause.category = category
        }

        const products = await prisma.product.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        })

        // In-memory filter for low stock since Prisma doesn't support field comparison in where clause easily
        if (lowStock) {
            const lowStockProducts = products.filter(p => p.stock <= p.lowStockAlert)
            return NextResponse.json(lowStockProducts)
        }

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
        const validatedData = productSchema.parse(body)

        const product = await prisma.product.create({
            data: {
                ...validatedData,
                gymId: gym.id // Securely use the gymId from auth
            } as any
        })

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
