'use server'

import { redirect } from 'next/navigation'

export async function searchMembers(formData: FormData) {
    const query = formData.get('q') as string
    const params = new URLSearchParams()

    if (query && query.trim()) {
        params.set('q', query.trim())
    }

    redirect(`/members?${params.toString()}`)
}

export async function filterByStatus(status: string) {
    const params = new URLSearchParams()

    if (status && status !== 'ALL') {
        params.set('status', status)
    }

    redirect(`/members?${params.toString()}`)
}
