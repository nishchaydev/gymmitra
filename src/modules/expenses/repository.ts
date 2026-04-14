import { prisma } from '@/lib/prisma'
import { Expense, Prisma } from '@prisma/client'

export class ExpenseRepository {
    async create(data: Prisma.ExpenseCreateInput, tx?: Prisma.TransactionClient): Promise<Expense> {
        const client = tx || prisma
        return client.expense.create({ data })
    }

    async delete(id: string, gymId: string, tx?: Prisma.TransactionClient): Promise<void> {
        const client = tx || prisma
        await client.expense.delete({
            where: { id, gymId }
        })
    }

    async findByIdAndGym(id: string, gymId: string): Promise<Expense | null> {
        return prisma.expense.findFirst({
            where: { id, gymId }
        })
    }
}
