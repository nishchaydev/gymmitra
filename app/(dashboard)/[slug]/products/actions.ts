'use server'

import { withAuth } from '@/lib/with-auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { productService } from '@/src/modules/products/service'

export const importProducts = withAuth(async (context, data: any[]) => {
    const gymId = context.gym.id
    const slug = context.gym.slug

    try {
        const headerList = await headers()
        const ipHeader = headerList.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        const result = await productService.importProducts(gymId, data, context.userId, ip)

        revalidatePath(`/${slug}/products`)
        revalidatePath(`/${slug}/dashboard`)

        return result
    } catch (error: any) {
        console.error('Import error:', error)
        return { error: 'Failed to import products. Ensure CSV format is correct.' }
    }
})
