'use server'

import { prisma } from '@/lib/prisma'
import { SaaSPlan } from '@prisma/client'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)

async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
        throw new Error('Unauthorized: Admin access only')
    }
    return user
}

export async function generateTrialCode(params: { plan: SaaSPlan, maxUses?: number, expiresAt?: Date | null }) {
    await requireAdmin()

    const code = 'GM-' + crypto.randomBytes(4).toString('hex').toUpperCase()
    
    const newCode = await prisma.registrationCode.create({
        data: {
            code,
            plan: params.plan,
            maxUses: params.maxUses || 1,
            expiresAt: params.expiresAt || null,
            isActive: true,
        }
    })
    
    revalidatePath('/admin/codes')
    return { success: true, code: newCode }
}

export async function revokeCode(id: string) {
    await requireAdmin()

    await prisma.registrationCode.update({
        where: { id },
        data: { isActive: false }
    })
    revalidatePath('/admin/codes')
    return { success: true }
}

export async function getCodes() {
    await requireAdmin()

    return prisma.registrationCode.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
            gyms: {
                select: { id: true, name: true, slug: true }
            }
        }
    })
}
