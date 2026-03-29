import { NextRequest, NextResponse } from 'next/server'
import { getAuthGym } from '@/lib/auth'
import { z } from 'zod'
import { guardRateLimit } from '@/lib/rate-limit'
import { attendanceService } from '@/src/modules/attendance/service'

const syncSchema = z.object({
    records: z.array(z.object({
        id: z.string(), // The temp ID
        memberId: z.string(),
        date: z.coerce.date(),
        checkInTime: z.string(),
        timestamp: z.number()
    })).max(1000)
})

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const roleCheck = await import('@/lib/auth').then(m => m.checkRole(auth, ['OWNER', 'STAFF', 'TRAINER']))
        if (roleCheck) return roleCheck

        let rl;
        try {
            rl = await guardRateLimit(20, `${auth.userId}:sync-offline:post`, false)
        } catch (err) {
            console.error('[Sync-Offline] Rate limiter infra failure. Failing closed:', err)
            return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 })
        }
        if (rl) return rl

        const body = await request.json()
        const result = syncSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 })
        }

        const { records } = result.data

        const syncedIds = await attendanceService.syncOffline(auth.gym.id, auth.gym.timezone || 'Asia/Kolkata', records)

        return NextResponse.json({
            success: true,
            syncedCount: syncedIds.length,
            syncedIds
        })
    } catch (error) {
        console.error('Failed to sync offline attendance:', error)
        return NextResponse.json(
            { error: 'Failed to process sync batch' },
            { status: 500 }
        )
    }
}
