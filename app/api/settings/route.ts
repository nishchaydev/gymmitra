import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { settingsService } from '@/src/modules/settings/service'

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
        const safeGymData = settingsService.getPublicSafeSettings(auth.gym)
        
        return NextResponse.json(safeGymData)
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
