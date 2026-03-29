import { settingsRepository } from './repository'
import { settingsSchema, SettingsInput } from './validator'

export class SettingsService {
    async updateSettings(userId: string, currentSlug: string | undefined, data: SettingsInput) {
        const validated = settingsSchema.parse(data)

        if (validated.slug && validated.slug !== currentSlug) {
            const existingSlug = await settingsRepository.findBySlug(validated.slug)
            if (existingSlug) {
                throw new Error('This subdomain is already taken')
            }
        }

        return settingsRepository.upsert(userId, validated)
    }

    getPublicSafeSettings(gym: any) {
        const {
            tempPassword: _tp,
            licenseKey: _lk,
            userId: _uid,
            lastBriefingSentAt: _lbs,
            lastTrialReminderMilestone: _ltr,
            registrationCodeId: _rci,
            deletedAt: _da,
            onboardingEmailsSentAt: _oes,
            ...safeGymData
        } = gym

        return safeGymData
    }
}

export const settingsService = new SettingsService()
