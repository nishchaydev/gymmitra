import { productRepository } from './repository'
import { CreateProductInput, UpdateProductInput, productSchema } from './validator'
import { recordAuditLog } from '@/lib/audit-logger'

export class ProductService {
    async createProduct(gymId: string, data: CreateProductInput, userId: string, ip: string) {
        const validated = productSchema.parse(data)
        
        const product = await productRepository.create(gymId, validated)

        await recordAuditLog({
            gymId,
            actorId: userId,
            action: 'CREATE_PRODUCT',
            entityType: 'PRODUCT',
            entityId: product.id,
            ipAddress: ip,
        }).catch(err => console.error('recordAuditLog CREATE_PRODUCT error:', err))

        return product
    }

    async updateProduct(id: string, gymId: string, data: UpdateProductInput, userId: string, ip: string) {
        // Find existing to ensure mapping/permissions
        const existing = await productRepository.findById(id, gymId)
        if (!existing) {
            throw new Error('Product not found or unauthorized')
        }

        const updateResult = await productRepository.update(id, gymId, data)
        if (updateResult.count === 0) {
            throw new Error('Product not found or unauthorized')
        }

        await recordAuditLog({
            gymId,
            actorId: userId,
            action: 'UPDATE_PRODUCT',
            entityType: 'PRODUCT',
            entityId: id,
            ipAddress: ip,
            payload: { changedFields: Object.keys(data) }
        }).catch(err => console.error('recordAuditLog UPDATE_PRODUCT error:', err))

        return productRepository.findById(id, gymId)
    }

    async deleteProduct(id: string, gymId: string, userId: string, ip: string) {
        const result = await productRepository.softDelete(id, gymId)
        if (result.count === 0) {
            throw new Error('Product not found or unauthorized')
        }

        await recordAuditLog({
            gymId,
            actorId: userId,
            action: 'DELETE_PRODUCT',
            entityType: 'PRODUCT',
            entityId: id,
            ipAddress: ip
        }).catch(err => console.error('recordAuditLog DELETE_PRODUCT error:', err))

        return true
    }

    async importProducts(gymId: string, rawData: any[], userId: string, ip: string) {
        let imported = 0
        let skippedDuplicate = 0
        let skippedInvalidData = 0

        // 1. Get existing product names
        const existingProducts = await productRepository.findNamesByGymId(gymId)
        const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase().trim()))

        await productRepository.executeBatch(async (tx) => {
            for (const row of rawData) {
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

                const parsed = productSchema.safeParse({
                    name,
                    category: decodedCategory,
                    description: row.description || undefined,
                    price: isNaN(price) ? 0 : price,
                    purchasePrice: purchasePrice !== null && !isNaN(purchasePrice) ? purchasePrice : null,
                    stock: isNaN(stock) ? 0 : stock,
                    lowStockAlert: isNaN(lowStockAlert) ? 10 : lowStockAlert
                })

                if (!parsed.success) {
                    skippedInvalidData++
                    continue
                }

                await productRepository.create(gymId, parsed.data, tx)

                imported++
                existingNames.add(name.toLowerCase())
            }
        })

        await recordAuditLog({
            gymId,
            actorId: userId,
            action: 'IMPORT_PRODUCTS' as any,
            entityType: 'PRODUCT',
            entityId: 'batch',
            ipAddress: ip,
            payload: { imported, skippedDuplicate, totalRows: rawData.length }
        }).catch(err => console.error('recordAuditLog IMPORT_PRODUCTS error:', err))

        return { imported, skippedDuplicate, skippedInvalidData }
    }
}

export const productService = new ProductService()
