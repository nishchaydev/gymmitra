'use server'

import { withAuth } from '@/lib/with-auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { recordAuditLog } from '@/lib/audit-logger'
import { headers } from 'next/headers'

export const importProducts = withAuth(async (context, data: any[]) => {
    const gymId = context.gym.id
    const slug = context.gym.slug
    let imported = 0
    let skippedDuplicate = 0
    let skippedInvalidData = 0

    try {
        // 1. Get existing product names to avoid exact duplicates
        const existingProducts = await prisma.product.findMany({
            where: { gymId },
            select: { name: true }
        })
        const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase().trim()))

        // 3. Process in a transaction
        await prisma.$transaction(async (tx) => {
            for (const row of data) {
                const name = String(row.name || "").trim()

                if (!name) {
                    skippedInvalidData++
                    continue
                }

                if (existingNames.has(name.toLowerCase())) {
                    skippedDuplicate++
                    continue
                }

                const categoryMap: Record<string, any> = {
                    'protein': 'PROTEIN',
                    'supplement': 'SUPPLEMENT',
                    'merchandise': 'MERCHANDISE',
                }
                const categoryInput = String(row.category || "").trim().toLowerCase()
                const decodedCategory = categoryMap[categoryInput] || 'OTHER'

                const price = row.price ? Number(row.price) : 0
                const purchasePrice = row.purchaseprice ? Number(row.purchaseprice) : null
                const stock = row.stock ? parseInt(row.stock) : 0
                const lowStockAlert = row.lowstockalert ? parseInt(row.lowstockalert) : 10

                // Create Product
                await tx.product.create({
                    data: {
                        gymId,
                        name: name,
                        category: decodedCategory,
                        description: row.description || null,
                        price: isNaN(price) ? 0 : price,
                        purchasePrice: purchasePrice !== null && !isNaN(purchasePrice) ? purchasePrice : null,
                        stock: isNaN(stock) ? 0 : stock,
                        lowStockAlert: isNaN(lowStockAlert) ? 10 : lowStockAlert,
                        isActive: true
                    }
                })

                imported++
                existingNames.add(name.toLowerCase())
            }
        })

        // Audit Log
        const headerList = await headers()
        const ipHeader = headerList.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        await recordAuditLog({
            gymId,
            actorId: context.userId,
            action: 'IMPORT_PRODUCTS' as any,
            entityType: 'PRODUCT',
            entityId: 'batch',
            ipAddress: ip,
            payload: { imported, skippedDuplicate, totalRows: data.length }
        }).catch(err => console.error('recordAuditLog IMPORT_PRODUCTS', err))

        revalidatePath(`/${slug}/products`)
        revalidatePath(`/${slug}/dashboard`)

        return { imported, skippedDuplicate, skippedInvalidData }
    } catch (error: any) {
        console.error('Import error:', error)
        return { error: 'Failed to import products. Ensure CSV format is correct.' }
    }
})
