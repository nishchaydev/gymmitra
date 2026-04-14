import { ExpenseRepository } from './repository'
import { ExpenseCategory } from '@prisma/client'
import { recordAuditLog } from '@/lib/audit-logger'
import { ExpenseSchema, CreateExpenseInput } from './validator'

export class ExpenseService {
    private repository: ExpenseRepository

    constructor(repository?: ExpenseRepository) {
        this.repository = repository || new ExpenseRepository()
    }

    async createExpense(gymId: string, userId: string, data: CreateExpenseInput) {
        try {
            const validated = ExpenseSchema.parse(data)

            const expense = await this.repository.create({
                amount: validated.amount,
                category: validated.category,
                description: validated.description,
                date: validated.date,
                gymId: gymId
            })

            await recordAuditLog({
                gymId,
                actorId: userId,
                action: 'CREATE_EXPENSE' as any,
                entityType: 'EXPENSE',
                entityId: expense.id,
                ipAddress: '127.0.0.1'
            }).catch(err => console.error('Audit log failed:', err))

            return { success: true, id: expense.id }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    async deleteExpense(gymId: string, userId: string, id: string) {
        try {
            await this.repository.delete(id, gymId)

            await recordAuditLog({
                gymId,
                actorId: userId,
                action: 'DELETE_EXPENSE' as any,
                entityType: 'EXPENSE',
                entityId: id,
                ipAddress: '127.0.0.1'
            }).catch(err => console.error('Audit log failed:', err))

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }
}
