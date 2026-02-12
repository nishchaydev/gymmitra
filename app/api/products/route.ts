import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const productSchema = z.object({
    name: z.string().min(2),
    category: z.enum(['PROTEIN', 'SUPPLEMENT', 'MERCHANDISE', 'OTHER']),
    description: z.string().optional(),
    price: z.number().min(0),
    stock: z.number().int().min(0),
    lowStockAlert: z.number().int().min(0).default(10),
    image: z.string().optional(),
    gymId: z.string().min(1),
})

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const lowStock = searchParams.get('lowStock') === 'true'

        const whereClause: any = { isActive: true }

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
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = productSchema.parse(body)

        const product = await prisma.product.create({
            data: validatedData
        })

        return NextResponse.json(product, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        )
    }
}
