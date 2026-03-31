'use server'

import { redirect } from 'next/navigation'
import { withAuth } from '@/lib/with-auth'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { memberSchema } from '@/src/modules/members/validator'
import { MemberRepository } from '@/src/modules/members/repository'
import { MemberService } from '@/src/modules/members/service'
import { revalidatePath } from 'next/cache'
import { recordAuditLog } from '@/lib/audit-logger'
import { headers } from 'next/headers'
import { WelcomeEmail } from '@/components/emails/WelcomeEmail'
import { render } from '@react-email/render'
import React from 'react'
import { safeParseDate, isLeapYear, validateDateRange } from '@/lib/utils'
import { format, parseISO, isValid, addMonths } from 'date-fns'
import { Prisma, PaymentStatus, SubscriptionStatus } from '@prisma/client'
import { BillingRepository } from '@/src/modules/billing/repository'
import { after } from 'next/server'

// Schema moved to src/modules/members/validator.ts

export const createMember = withAuth(async (context, data: z.input<typeof memberSchema>) => {
    const parsed = memberSchema.safeParse(data)
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'Validation failed' }
    }

    const validatedData = parsed.data
    const gymId = context.gym.id
    const slug = context.gym.slug

    try {
        const headerList = await headers()
        const ipHeader = headerList.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        const result = await MemberService.createMember(
            gymId,
            {
                name: context.gym.name,
                logo: context.gym.logo,
                logoUrl: context.gym.logoUrl,
                address: context.gym.address || '',
                phone: context.gym.phone || '',
                invoiceLinkExpiryDays: context.gym.invoiceLinkExpiryDays,
                termsAndConditions: context.gym.termsAndConditions,
                gymRules: context.gym.gymRules,
                waWelcomeMsg: context.gym.waWelcomeMsg,
                saasPlan: context.gym.saasPlan,
            },
            context.userId,
            ip,
            validatedData
        )

        if (result.error) return { error: result.error }

        revalidatePath(`/${slug}/members`)
        revalidatePath(`/${slug}/invoices`)
        revalidatePath(`/${slug}/dashboard`)

        // Fire and forget welcome email
        if (result.email) {
            MemberService.sendWelcomeEmailAsync(
                {
                    name: context.gym.name,
                    logo: context.gym.logo,
                    logoUrl: context.gym.logoUrl,
                    address: context.gym.address || '',
                    phone: context.gym.phone || '',
                    termsAndConditions: context.gym.termsAndConditions,
                    gymRules: context.gym.gymRules
                },
                result.id!,
                gymId,
                result.email,
                validatedData.name,
                result.invoiceId
            )
        }

        return { success: true, id: result.id, invoiceId: result.invoiceId, whatsappUrl: result.whatsappUrl }
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

export const importMembers = withAuth(async (context, data: any[]) => {
    const gymId = context.gym.id
    const slug = context.gym.slug

    const headerList = await headers()
    const ipHeader = headerList.get('x-forwarded-for')
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

    const result = await MemberService.importMembers(data, gymId, context.userId, ip)

    revalidatePath(`/${slug}/members`)
    revalidatePath(`/${slug}/dashboard`)

    return result
})
