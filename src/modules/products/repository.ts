import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CreateProductInput, UpdateProductInput } from './validator'

export class ProductRepository {
    async findById(id: string, gymId: string) {
        return prisma.product.findUnique({
            where: { id, gymId }
        })
    }

    async findAll(gymId: string, options?: { q?: string; category?: string; lowStock?: boolean }) {
        const whereClause: Prisma.ProductWhereInput = {
            isActive: true,
            gymId
        }

        if (options?.q) {
            whereClause.name = { contains: options.q, mode: 'insensitive' }
        }

        if (options?.category && options.category !== 'ALL') {
            whereClause.category = options.category as any
        }

        const products = await prisma.product.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        })

        if (options?.lowStock) {
            return products.filter(p => p.stock <= p.lowStockAlert)
        }

        return products
    }

    async findNamesByGymId(gymId: string) {
        return prisma.product.findMany({
            where: { gymId },
            select: { name: true }
        })
    }

    async create(gymId: string, data: CreateProductInput, tx?: Prisma.TransactionClient) {
        const db = tx || prisma
        return db.product.create({
            data: {
                ...data,
                gymId
            } as any
        })
    }

    async update(id: string, gymId: string, data: UpdateProductInput) {
        return prisma.product.updateMany({
            where: { id, gymId },
            data: data as any
        })
    }

    async softDelete(id: string, gymId: string) {
        return prisma.product.updateMany({
            where: { id, gymId },
            data: { isActive: false }
        })
    }

    async executeBatch<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
        return prisma.$transaction(operation, { timeout: 15000, maxWait: 10000 })
    }
}

export const productRepository = new ProductRepository()
