'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function exitDemo() {
    const cookieStore = await cookies()
    cookieStore.delete('mitra_demo_mode')
    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
