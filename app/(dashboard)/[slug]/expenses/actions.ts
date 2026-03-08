'use server'

import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { ExpenseCategory } from '@prisma/client'
import { z } from 'zod'

const ExpenseSchema = z.object({
    amount: z.number().min(0.01),
    category: z.nativeEnum(ExpenseCategory),
    description: z.string().min(1, "Description is required"),
    date: z.coerce.date(),
})

export async function createExpense(slug: string, data: any) {
    try {
        const auth = await getAuthGym()
        if (!auth) throw new Error("Unauthorized")

        const validated = ExpenseSchema.parse(data)

        await prisma.expense.create({
            data: {
                ...validated,
                gymId: auth.gym.id
            }
        })

        revalidatePath(`/${slug}/expenses`)
        revalidatePath(`/${slug}/dashboard`)
        return { success: true }
    } catch (error: any) {
        console.error("Failed to create expense:", error)
        return { success: false, error: error.message }
    }
}

export async function deleteExpense(slug: string, id: string) {
    try {
        const auth = await getAuthGym()
        if (!auth) throw new Error("Unauthorized")

        await prisma.expense.delete({
            where: { id, gymId: auth.gym.id }
        })

        revalidatePath(`/${slug}/expenses`)
        revalidatePath(`/${slug}/dashboard`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
