/**
 * POST /api/cache/refresh
 *
 * Called by the dashboard "Refresh" button.
 * Busts ALL Redis cache keys for this gym using SCAN.
 * Next request to any endpoint will re-fetch from Supabase
 * and repopulate Redis automatically (Redis-First pattern).
 */
import { NextResponse } from 'next/server'
import { getAuthGym } from '@/lib/auth'
import { invalidateGymCache } from '@/lib/redis-cache'

export async function POST() {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const deleted = await invalidateGymCache(auth.gym.id)

        return NextResponse.json({
            success: true,
            message: `Cache cleared. ${deleted} key${deleted !== 1 ? 's' : ''} removed.`,
        })
    } catch (error) {
        console.error('[Cache Refresh]', error)
        return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 })
    }
}
