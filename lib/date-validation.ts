import { z } from 'zod'
import { safeParseDate } from '@/lib/utils'

export const nullableDateField = (fieldName: string) =>
    z.union([z.string(), z.null()]).optional().nullable().transform((val, ctx) => {
        if (val == null || val === '') return null
        const parsed = safeParseDate(val)
        if (!parsed) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid ${fieldName}` })
            return z.NEVER
        }
        return parsed
    })

export const optionalDateField = (fieldName: string) =>
    z.string().optional().transform((val, ctx) => {
        if (val === undefined) return undefined
        const parsed = safeParseDate(val)
        if (!parsed) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid ${fieldName}` })
            return z.NEVER
        }
        return parsed
    })

