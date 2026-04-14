import { z } from 'zod'
import { ExpenseCategory } from '@prisma/client'

export const ExpenseSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be at least 0.01"),
    category: z.nativeEnum(ExpenseCategory),
    description: z.string().min(1, "Description is required"),
    date: z.coerce.date(),
})

export type CreateExpenseInput = z.infer<typeof ExpenseSchema>
