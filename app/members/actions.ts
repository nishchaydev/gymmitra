'use server'

import { redirect } from 'next/navigation'
import { withAuth } from '@/lib/with-auth'

export const searchMembers = withAuth(async (_context, formData: FormData) => {
    const query = formData.get('q') as string
    const params = new URLSearchParams()

    if (query && query.trim()) {
        params.set('q', query.trim())
    }

    redirect(`/members?${params.toString()}`)
})

export const filterByStatus = withAuth(async (_context, status: string) => {
    const params = new URLSearchParams()

    if (status && status !== 'ALL') {
        params.set('status', status)
    }

    redirect(`/members?${params.toString()}`)
})
