import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { apiLimiter } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit-logger'
import { formatInTimeZone } from 'date-fns-tz'

const checkInSchema = z.object({
    memberId: z.string().min(1, "Member ID is required"),
})

/**
 * Shared rate limit helper for attendance routes
 * Returns a NextResponse if limited, otherwise null
 */
async function checkAttendanceRateLimit(userId: string, limit: number = 100) {
    try {
        await apiLimiter.check(limit, `${userId}:attendance`)
        return null
    } catch (error: unknown) {
        // Distinguish between RateLimitError (if we had one) or generic error with retryAfter
        if (error && typeof error === 'object' && 'retryAfter' in error && typeof error.retryAfter === 'number') {
            return NextResponse.json(
                { error: 'Too many requests', retryAfter: error.retryAfter },
                {
                    status: 429,
                    headers: { 'Retry-After': String(error.retryAfter) }
                }
            )
        }
        console.error('Rate limit check failed:', error)
        // Fail open if rate limit check fails systemically, or return 500?
        // Usually safer to fail open for attendance unless strict, but here we return 500 to be safe.
        return NextResponse.json({ error: 'System busy, please try again' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const now = new Date() // Unified timestamp for consistency
        const auth = await getAuthGym()

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rateLimitResponse = await checkAttendanceRateLimit(auth.userId)
        if (rateLimitResponse) return rateLimitResponse

        const gym = auth.gym

        // STAFF and above can check in members
        const roleCheck = checkRole(auth, ['OWNER', 'STAFF', 'TRAINER'])
        if (roleCheck) return roleCheck

        const body = await request.json()
        const { memberId } = checkInSchema.parse(body)

        // Check if member exists AND belongs to gym
        let member = await prisma.member.findFirst({
            where: {
                id: memberId,
                gymId: gym.id // Enforce ownership
            }
        })

        let staffMember = null;
        if (!member) {
            // Try fallback to Staff Member
            staffMember = await prisma.staffMember.findFirst({
                where: {
                    id: memberId,
                    gymId: gym.id
                }
            })
        }

        if (!member && !staffMember) {
            return NextResponse.json({ error: 'Member or Staff not found in this gym. Please check the ID.' }, { status: 404 })
        }

        if (member && member.status !== 'ACTIVE') {
            return NextResponse.json({ error: `Check-in denied. Member status is ${member.status}.` }, { status: 400 })
        }

        if (staffMember && !staffMember.isActive) {
            return NextResponse.json({ error: `Check-in denied. Staff member is inactive.` }, { status: 400 })
        }

        // UTC naive logic removed. Shift to Gym's physical timezone.
        let localDateString: string
        const timezone = gym.timezone || 'Asia/Kolkata'
        try {
            localDateString = formatInTimeZone(now, timezone, 'yyyy-MM-dd')
        } catch (tzError) {
            console.warn(`Invalid timezone [${timezone}] for gym ${gym.id}:`, tzError)
            return NextResponse.json({ error: `Invalid timezone configuration: ${timezone}` }, { status: 400 })
        }

        let existingAttendance;
        if (member) {
            existingAttendance = await prisma.attendance.findUnique({
                where: {
                    memberId_localDateString: {
                        memberId: member.id,
                        localDateString
                    }
                }
            })
        } else if (staffMember) {
            existingAttendance = await prisma.attendance.findFirst({
                where: {
                    staffId: staffMember.id,
                    localDateString: localDateString
                }
            })
        }

        if (existingAttendance) {
            return NextResponse.json({ error: `${member ? 'Member' : 'Staff'} already checked in today` }, { status: 400 })
        }

        const createData: any = {
            gym: { connect: { id: gym.id } },
            date: now,
            checkInTime: now,
            localDateString: localDateString
        }

        if (member) {
            createData.member = { connect: { id: member.id } }
        }
        if (staffMember) {
            createData.staff = { connect: { id: staffMember.id } }
        }

        const attendance = await (prisma as any).attendance.create({
            data: createData,
            select: {
                id: true,
                memberId: true,
                staffId: true,
                gymId: true,
                date: true,
                checkInTime: true,
                localDateString: true,
                member: {
                    select: {
                        name: true,
                        phone: true
                    }
                },
                staff: {
                    select: {
                        name: true,
                        phone: true,
                        role: true
                    }
                }
            }
        })

        const userName = member ? member.name : staffMember ? staffMember.name : "Unknown"

        // Audit Log (Manual Check-in)
        const ipHeader = request.headers.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'
        await recordAuditLog({
            gymId: gym.id,
            actorId: auth.userId,
            action: 'CHECKIN_MEMBER' as any, // Type updated elsewhere
            entityType: 'ATTENDANCE',
            entityId: attendance.id,
            ipAddress: ip,
            payload: { scannedId: memberId, name: userName, isStaff: !!staffMember, localDateString }
        }).catch(err => console.error('Audit Log failed for CHECKIN_MEMBER', err))

        // Return uniform structure to client
        const payload = {
            ...attendance,
            member: member ? attendance.member : { name: `${attendance.staff?.name} (${attendance.staff?.role})`, phone: attendance.staff?.phone || "" }
        }

        return NextResponse.json(payload, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        console.error('Error recording attendance:', error)
        return NextResponse.json({ error: 'Failed to record attendance. Please try again.' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rateLimitResponse = await checkAttendanceRateLimit(auth.userId)
        if (rateLimitResponse) return rateLimitResponse

        const gym = auth.gym

        const { searchParams } = new URL(request.url)
        const memberId = searchParams.get('memberId')

        if (!memberId) {
            return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
        }

        const page = parseInt(searchParams.get('page') || '1', 10)
        const limitParam = parseInt(searchParams.get('limit') || '10', 10)
        const limit = Math.min(Math.max(limitParam, 1), 50)
        const skip = (page - 1) * limit

        // Verify member belongs to this gym
        const member = await prisma.member.findFirst({
            where: { id: memberId, gymId: gym.id }
        })

        if (!member) {
            return NextResponse.json({ error: 'Member not found or access denied' }, { status: 404 })
        }

        const attendance = await prisma.attendance.findMany({
            where: { memberId },
            orderBy: { date: 'desc' },
            skip,
            take: limit
        })

        return NextResponse.json(attendance)
    } catch (error) {
        console.error('Error fetching attendance:', error)
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }
}
