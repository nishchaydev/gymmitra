import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export class MemberRepository {
    /**
     * Re-exports the ability to run a transaction without exposing the Prisma client directly.
     */
    static async executeTransaction<T>(
        callback: (tx: Prisma.TransactionClient) => Promise<T>
    ): Promise<T> {
        return prisma.$transaction(callback)
    }

    /**
     * Find a member by phone number within a gym
     */
    static async findByPhone(phone: string, gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.member.findFirst({
            where: { phone, gymId }
        })
    }

    /**
     * Find a member by email within a gym
     */
    static async findByEmail(email: string, gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.member.findFirst({
            where: { email, gymId }
        })
    }

    /**
     * Find a member by ID within a gym
     */
    static async findById(id: string, gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.member.findFirst({
            where: { id, gymId }
        })
    }

    /**
     * Check how many members exist matching the exact ID and gymId
     */
    static async countById(id: string, gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.member.count({
            where: { id, gymId }
        })
    }

    /**
     * Find the latest active subscription for a member
     */
    static async findLatestActiveSubscription(memberId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.memberSubscription.findFirst({
            where: { memberId, status: 'ACTIVE', endDate: { gte: new Date() } },
            orderBy: { endDate: 'desc' },
            include: { plan: true }
        })
    }

    /**
     * Create a new member
     */
    static async createMember(data: any, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.member.create({
            data
        })
    }

    /**
     * Create a new member subscription
     */
    static async createSubscription(data: any, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.memberSubscription.create({
            data
        })
    }

    /**
     * Update an existing member (scoped to gymId for tenant isolation)
     */
    static async updateMember(id: string, gymId: string, data: any, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.member.updateMany({
            where: { id, gymId },
            data
        })
    }

    /**
     * Delete an existing member
     */
    static async deleteMember(id: string, gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.member.deleteMany({
            where: { id, gymId }
        })
    }

    /**
     * Fetch all phones for a gym (used for deduplication in imports)
     */
    static async fetchAllPhones(gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        const members = await client.member.findMany({
            where: { gymId },
            select: { phone: true }
        })
        return members.map(m => m.phone)
    }

    /**
     * Find a plan by ID
     */
    static async findPlanById(planId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.membershipPlan.findUnique({
            where: { id: planId }
        })
    }

    /**
     * Find active plans by Gym ID
     */
    static async findActivePlans(gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.membershipPlan.findMany({
            where: { gymId, isActive: true }
        })
    }

    /**
     * Bulk create members (skipDuplicates automatically applies)
     */
    static async bulkCreateMembers(data: any[], tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.member.createMany({
            data,
            skipDuplicates: true
        })
    }

    /**
     * Bulk create subscriptions
     */
    static async bulkCreateSubscriptions(data: any[], tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.memberSubscription.createMany({
            data,
            skipDuplicates: true
        })
    }

    /**
     * Create a new membership plan
     */
    static async createPlan(data: any, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.membershipPlan.create({
            data
        })
    }

    /**
     * Get member subscriptions joined with plan
     */
    static async getMemberWithSubscriptions(id: string, gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.member.findFirst({
            where: { id, gymId },
            include: {
                subscriptions: {
                    include: { plan: true },
                    orderBy: { endDate: 'desc' }
                },
                invoices: {
                    orderBy: { issueDate: 'desc' },
                    take: 5
                }
            }
        })
    }
}
