'use server'

import { withAuth } from '@/lib/with-auth'
import { revalidatePath } from 'next/cache'
import { ExpenseService } from '@/src/modules/expenses/service'

const expenseService = new ExpenseService()

export const createExpense = withAuth(async (context: any, slug: string, data: any) => {
    const result = await expenseService.createExpense(context.gym.id, context.userId, data)

    if (result.success) {
        revalidatePath(`/${slug}/expenses`)
        revalidatePath(`/${slug}/dashboard`)
    } else {
        console.error("Failed to create expense:", result.error)
    }

    return result
}, ['OWNER'])

export const deleteExpense = withAuth(async (context: any, slug: string, id: string) => {
    const result = await expenseService.deleteExpense(context.gym.id, context.userId, id)

    if (result.success) {
        revalidatePath(`/${slug}/expenses`)
        revalidatePath(`/${slug}/dashboard`)
    }

    return result
}, ['OWNER'])
