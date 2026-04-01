import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { guardRateLimit } from "@/lib/rate-limit"
import { formatInTimeZone } from "date-fns-tz"

const checkInSchema = z.object({
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
        .min(10, "Phone number must be at least 10 digits")
        .max(15)
        .regex(/^\d+$/, "Phone number must contain only digits"),
})

/**
 * GET /api/public/[slug]/checkin
 * Returns public gym info (name only) — no auth required.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const ip = _req.headers.get('x-forwarded-for') || '127.0.0.1';

    const rateLimited = await guardRateLimit(60, `public-checkin-info:${slug}:${ip}`)
    if (rateLimited) return rateLimited

    const gym = await prisma.gymProfile.findUnique({
        where: { slug },
        select: { name: true, isVerified: true },
    })

    if (!gym) {
        return NextResponse.json({ error: "Gym not found" }, { status: 404 })
    }

    return NextResponse.json({ gymName: gym.name })
}

/**
 * POST /api/public/[slug]/checkin
 * Looks up member by phone in this gym, records attendance.
 * No Supabase auth — public endpoint protected by rate limiting.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate limit: 20 check-ins per minute per slug per IP (one device shouldn't spam)
    const rateLimited = await guardRateLimit(20, `public-checkin-post:${slug}:${ip}`)
    if (rateLimited) return rateLimited

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const parsed = checkInSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message || "Invalid phone number" },
            { status: 400 }
        )
    }

    const { phone } = parsed.data

    // Resolve gym
    const gym = await prisma.gymProfile.findUnique({
        where: { slug },
        select: { id: true, timezone: true, name: true },
    })
    if (!gym) {
        return NextResponse.json({ error: "Gym not found" }, { status: 404 })
    }

    // Find member by phone in this gym
    const member = await prisma.member.findFirst({
        where: {
            phone,
            gymId: gym.id,
            deletedAt: null,
        },
        select: { 
            id: true, 
            name: true, 
            status: true,
            memberState: true,
            subscriptions: {
                where: { status: 'ACTIVE' },
                orderBy: { endDate: 'desc' },
                take: 1
            }
        },
    })

    if (!member) {
        return NextResponse.json(
            { error: "No member found with this phone number. Please speak to the reception." },
            { status: 404 }
        )
    }

    if (member.status !== "ACTIVE" && member.status !== "EXPIRING_SOON") {
        const statusMessages: Record<string, string> = {
            EXPIRED: "Your membership has expired. Please renew at the reception.",
            INACTIVE: "Your account is inactive. Please contact the gym.",
            PENDING: "Your membership is pending approval. Please contact the gym.",
        }
        return NextResponse.json(
            { error: statusMessages[member.status] || `Check-in denied. Status: ${member.status}.` },
            { status: 400 }
        )
    }

    if ((member as any).memberState === 'PAUSED') {
        return NextResponse.json(
            { error: "Your membership is currently paused. Please contact the gym to resume." },
            { status: 400 }
        )
    }

    // Strict expiration check: even if status is ACTIVE, verify subscription end date
    const activeSub = member.subscriptions[0];
    if (!activeSub || activeSub.endDate < new Date()) {
        return NextResponse.json(
             { error: "Your membership has expired. Please renew at the reception." },
             { status: 400 }
        )
    }

    // Compute local date string in gym's timezone
    const now = new Date()
    const timezone = gym.timezone || "Asia/Kolkata"
    let localDateString: string
    try {
        localDateString = formatInTimeZone(now, timezone, "yyyy-MM-dd")
    } catch {
        return NextResponse.json({ error: "Gym timezone misconfigured. Please contact support." }, { status: 500 })
    }

    // Check for duplicate check-in today
    const existing = await prisma.attendance.findUnique({
        where: {
            memberId_localDateString: {
                memberId: member.id,
                localDateString,
            },
        },
    })

    if (existing) {
        return NextResponse.json(
            { error: "You have already checked in today. See you tomorrow! 💪" },
            { status: 400 }
        )
    }

    // Record the attendance (with try-catch for P2002 race conditions)
    try {
        await prisma.attendance.create({
            data: {
                memberId: member.id,
                gymId: gym.id,
                date: now,
                checkInTime: now,
                localDateString,
            },
        })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "You have already checked in today. See you tomorrow! 💪" },
                { status: 400 }
            )
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const maskedName = member.name ? member.name.split(' ')[0] : 'Member'

    return NextResponse.json(
        { success: true, memberName: maskedName },
        { status: 201 }
    )
}
