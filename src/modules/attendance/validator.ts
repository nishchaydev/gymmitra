import { z } from 'zod'

export const checkInSchema = z.object({
    memberId: z.string().min(1, "Member ID is required"),
})

export type CheckInInput = z.infer<typeof checkInSchema>
