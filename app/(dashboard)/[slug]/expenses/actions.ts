'use server'

import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/with-auth'
import { revalidatePath } from 'next/cache'
import { ExpenseCategory } from '@prisma/client'
import { z } from 'zod'
import { recordAuditLog } from '@/lib/audit-logger'

const ExpenseSchema = z.object({
    amount: z.coerce.number().min(0.01),
    category: z.nativeEnum(ExpenseCategory),
    description: z.string().min(1, "Description is required"),
    date: z.coerce.date(),
})

export const createExpense = withAuth(async (context: any, slug: string, data: any) => {
    try {
        const validated = ExpenseSchema.parse(data)

        const expense = await prisma.expense.create({
            data: {
                ...validated,
                gymId: context.gym.id
            }
        })

        await recordAuditLog({
            gymId: context.gym.id,
            actorId: context.userId,
            action: 'CREATE_EXPENSE' as any,
            entityType: 'EXPENSE',
            entityId: expense.id,
            ipAddress: '127.0.0.1' // Server action fallback
        }).catch(err => console.error('Audit log failed:', err))

        revalidatePath(`/${slug}/expenses`)
        revalidatePath(`/${slug}/dashboard`)
        return { success: true }
    } catch (error: any) {
        console.error("Failed to create expense:", error)
        return { success: false, error: error.message }
    }
}, ['OWNER'])

export const deleteExpense = withAuth(async (context: any, slug: string, id: string) => {
    try {
        await prisma.expense.delete({
            where: { id, gymId: context.gym.id }
        })

        await recordAuditLog({
            gymId: context.gym.id,
            actorId: context.userId,
            action: 'DELETE_EXPENSE' as any,
            entityType: 'EXPENSE',
            entityId: id,
            ipAddress: '127.0.0.1' // Server action fallback
        }).catch(err => console.error('Audit log failed:', err))

        revalidatePath(`/${slug}/expenses`)
        revalidatePath(`/${slug}/dashboard`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}, ['OWNER'])
