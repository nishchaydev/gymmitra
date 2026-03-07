'use server'

import { redirect } from 'next/navigation'
import { withAuth } from '@/lib/with-auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export const convertToMember = withAuth(async (context, leadId: string) => {
    const gymId = context.gym.id
    const slug = context.gym.slug

    // 1. Fetch the lead
    const lead = await (prisma as any).lead.findFirst({
        where: { id: leadId, gymId }
    })

    if (!lead) {
        return { error: 'Lead not found' }
    }

    if (lead.status === 'CONVERTED') {
        return { error: 'Lead is already converted' }
    }

    // 2. Set lead to converted
    await (prisma as any).lead.update({
        where: { id: leadId },
        data: {
            status: 'CONVERTED',
            convertedAt: new Date(),
        }
    })

    revalidatePath(`/${slug}/leads`)

    // 3. Build URL parameters to pre-fill the member form
    const params = new URLSearchParams()
    if (lead.name) params.set('name', lead.name)
    if (lead.phone) params.set('phone', lead.phone)
    if (lead.email) params.set('email', lead.email)

    // 4. Redirect to the member creation form
    redirect(`/${slug}/members/new?${params.toString()}`)
})
