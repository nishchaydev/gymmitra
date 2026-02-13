import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
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
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit: 100 requests per minute per user
        try {
            await apiLimiter.check(100, user.id)
        } catch (error) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })

        if (!gym) {
            return NextResponse.json({ error: 'Gym profile not found' }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const lowStock = searchParams.get('lowStock') === 'true'

        const whereClause: { isActive: boolean; category?: any; gymId: string } = {
            isActive: true,
            gymId: gym.id
        }

        if (category) {
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
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit: 50 creations per minute per user
        try {
            await apiLimiter.check(50, user.id)
        } catch (error) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })

        if (!gym) {
            return NextResponse.json({ error: 'Gym profile not found' }, { status: 404 })
        }

        const body = await request.json()
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
