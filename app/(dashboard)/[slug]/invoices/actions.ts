'use server'

import { revalidatePath } from "next/cache"
import { withAuth } from "@/lib/with-auth"
import { recordAuditLog } from "@/lib/audit-logger"
import { headers } from 'next/headers'
import { z } from "zod"
import { BillingService } from "@/src/modules/billing/service"
import { createInvoiceSchema, recordPaymentSchema } from "@/src/modules/billing/validator"

// Secure Server Action wrapped in withAuth
export const createInvoice = withAuth(async (context, data: z.infer<typeof createInvoiceSchema>) => {
    // 1. Runtime Validation via centralized validator
    const validatedData = createInvoiceSchema.parse(data)

    // 2. Strict Tenant Context derived server-side
    const gym = context.gym

    const headerList = await headers()
    const ipHeader = headerList.get('x-forwarded-for')
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

    // 3. Delegate to Billing Module Service
    const result = await BillingService.createInvoice(gym, validatedData, context.userId, ip)

    if (result.success && result.id) {
        const gymSlug = (gym as { slug?: string }).slug || 'gym'
        revalidatePath(`/${gymSlug}/dashboard`)
        revalidatePath(`/${gymSlug}/invoices`)

        // Fire & Forget Audit Log
        recordAuditLog({
            gymId: gym.id,
            actorId: context.userId,
            action: 'CREATE_INVOICE',
            entityType: 'INVOICE',
            entityId: result.id,
            ipAddress: ip,
            payload: { success: true }
        }).catch(err => console.error('[Action] Audit logging failed silently:', err))
    }

    return result
}, ['OWNER', 'STAFF']) // Only Owners and Staff can create invoices


export const recordInvoicePayment = withAuth(async (context, data: z.infer<typeof recordPaymentSchema>) => {
    const validatedData = recordPaymentSchema.parse(data)
    const gym = context.gym

    const result = await BillingService.recordPayment(gym.id, validatedData)

    if (result.success) {
        const gymSlug = (gym as { slug?: string }).slug || 'gym'
        revalidatePath(`/${gymSlug}/invoices/${validatedData.invoiceId}`)
        revalidatePath(`/${gymSlug}/invoices`)
        revalidatePath(`/${gymSlug}/dashboard`)
    }

    return result
}, ['OWNER', 'STAFF'])
