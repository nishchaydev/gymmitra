'use server'

import { withAuth } from '@/lib/with-auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { productService } from '@/src/modules/products/service'

const MAX_IMPORT_ROWS = 200

export const importProducts = withAuth(async (context, data: any[]) => {
    const gymId = context.gym.id
    const slug = context.gym.slug

    if (!Array.isArray(data) || data.length > MAX_IMPORT_ROWS) {
        return { error: `Import limit exceeded: maximum ${MAX_IMPORT_ROWS} rows allowed per import.` }
    }

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
}, ['OWNER', 'MANAGER'])
