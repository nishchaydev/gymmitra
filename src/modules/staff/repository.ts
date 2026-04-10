import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export class StaffRepository {
    /**
     * Find all staff members for a specific gym
     */
    static async findByGym(gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.staffMember.findMany({
            where: { gymId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                isFirstLogin: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        })
    }

    /**
     * Get a single staff member by ID within a gym
     */
    static async findById(id: string, gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.staffMember.findFirst({
            where: { id, gymId }
        })
    }

    /**
     * Check if a staff member exists with a specific email in a gym
     */
    static async findByEmail(email: string, gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.staffMember.findFirst({
            where: { email, gymId }
        })
    }

    /**
     * Create a new staff member record
     */
    static async create(data: any, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.staffMember.create({
            data
        })
    }

    /**
     * Update an existing staff member (scoped to gymId for tenant isolation)
     */
    static async update(id: string, gymId: string, data: any, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.staffMember.updateMany({
            where: { id, gymId },
            data
        })
    }

    /**
     * Delete a staff member record
     */
    static async delete(id: string, gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.staffMember.deleteMany({
            where: { id, gymId }
        })
    }
}
