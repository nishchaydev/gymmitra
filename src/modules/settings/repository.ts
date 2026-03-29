import { prisma } from '@/lib/prisma'
import { SettingsInput } from './validator'

export class SettingsRepository {
    async findBySlug(slug: string) {
        return prisma.gymProfile.findUnique({
            where: { slug }
        })
    }

    async upsert(userId: string, data: SettingsInput) {
        return prisma.gymProfile.upsert({
            where: { userId },
            update: data,
            create: {
                ...data,
                userId,
            },
        })
    }
}

export const settingsRepository = new SettingsRepository()
