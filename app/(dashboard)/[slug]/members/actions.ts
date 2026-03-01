'use server'

import { redirect } from 'next/navigation'
import { withAuth } from '@/lib/with-auth'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { recordAuditLog } from '@/lib/audit-logger'
import { headers } from 'next/headers'

const memberSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string()
        .refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .transform(str => new Date(str)),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
})

export const createMember = withAuth(async (context, data: z.input<typeof memberSchema>) => {
    const parsed = memberSchema.safeParse(data)
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'Validation failed' }
    }

    const validatedData = parsed.data
    const gymId = context.gym.id

    try {
        const member = await prisma.member.create({
            data: {
                name: validatedData.name,
                phone: validatedData.phone,
                email: validatedData.email || null,
                dateOfBirth: validatedData.dateOfBirth,
                gymId,
                status: 'ACTIVE',
                emergencyName: validatedData.emergencyName || '',
                emergencyPhone: validatedData.emergencyPhone || '',
                emergencyRelation: validatedData.emergencyRelation || '',
            }
        })

        revalidatePath('/members')
        revalidatePath('/dashboard')

        // 4. Audit Log
        const headerList = await headers()
        const ipHeader = headerList.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        await recordAuditLog({
            gymId,
            actorId: context.userId,
            action: 'CREATE_MEMBER',
            entityType: 'MEMBER',
            entityId: member.id,
            ipAddress: ip,
            payload: { name: validatedData.name } // Phone redacted
        }).catch(err => console.error('recordAuditLog CREATE_MEMBER', err))

        return { success: true, id: member.id }
    } catch (error: any) {
        console.error('Error creating member:', error)
        if (error.code === 'P2002') {
            const target = error.meta?.target
            if (Array.isArray(target)) {
                if (target.includes('email')) {
                    return { error: 'Member with this email already exists.' }
                }
                if (target.includes('phone')) {
                    return { error: 'Member with this phone number already exists.' }
                }
            }
            return { error: 'Member with the same unique field already exists.' }
        }
        return { error: 'Failed to create member.' }
    }
})

export const searchMembers = withAuth(async (_context, formData: FormData) => {
    const query = formData.get('q') as string
    const params = new URLSearchParams()

    if (query && query.trim()) {
        params.set('q', query.trim())
    }

    const slug = _context.gym.slug
    redirect(`/${slug}/members?${params.toString()}`)
})

export const filterByStatus = withAuth(async (_context, status: string) => {
    const params = new URLSearchParams()

    if (status && status !== 'ALL') {
        params.set('status', status)
    }

    const slug = _context.gym.slug
    redirect(`/${slug}/members?${params.toString()}`)
})
