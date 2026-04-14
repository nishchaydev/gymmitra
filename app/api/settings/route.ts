import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { settingsService } from '@/src/modules/settings/service'
import { getOrFetch, invalidateCache, cacheKey, CACHE_TTL } from '@/lib/redis-cache'
import { revalidatePath } from 'next/cache'

// Fix 13 request: rate limit 20
const SETTINGS_RATE_LIMIT = 20

export async function GET() {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        let rl;
        try {
            rl = await guardRateLimit(SETTINGS_RATE_LIMIT, `${auth.userId}:settings:get`)
        } catch (err) {
            console.error('[Settings GET] Rate limit infra failure:', err)
        }
        if (rl) return rl

        // Strip sensitive fields from response
        // ── Redis-First (30-day TTL — settings almost never change) ─────────
        const { data: safeGymData, fromCache } = await getOrFetch(
            cacheKey.settings(auth.gym.id),
            CACHE_TTL.SETTINGS,
            () => Promise.resolve(settingsService.getPublicSafeSettings(auth.gym))
        )

        return NextResponse.json(safeGymData, {
            headers: {
                'Cache-Control': 'private, max-age=86400, stale-while-revalidate=604800',
                'X-Cache': fromCache ? 'HIT' : 'MISS',
            },
        })
    } catch (error) {
        console.error('Failed to fetch settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        let rl;
        try {
            rl = await guardRateLimit(SETTINGS_RATE_LIMIT, `${auth.userId}:settings:put`)
        } catch (err) {
            console.error('[Settings PUT] Rate limit infra failure:', err)
        }
        if (rl) return rl

        let body;
        try {
            body = await request.json()
        } catch (e) {
            console.error('Failed to parse settings JSON:', e)
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const gymProfile = await settingsService.updateSettings(auth.userId, auth.gym.slug || undefined, body)

        // Force revalidation of all components under the gym's dashboard slug
        if (auth.gym.slug) {
            revalidatePath(`/${auth.gym.slug}`, 'layout')
        }

        // Bust settings cache — new settings take effect on next request
        await invalidateCache(cacheKey.settings(auth.gym.id))

        return NextResponse.json(gymProfile)
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            console.error('Settings validation failed:', error.flatten())
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        if (error.message === 'This subdomain is already taken') {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        console.error('Failed to update settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
