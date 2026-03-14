import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'
import { apiLimiter } from '@/lib/rate-limit'

// No force-dynamic

// Schema for member creation
const memberCreateSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string()
        .refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .transform(str => new Date(str)),
    gymId: z.string().min(1, "Gym ID is required").optional(), // Optional since we get it from auth
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit: 100 requests per minute per user
        try {
            await apiLimiter.check(100, `${auth.userId}:members:get`)
        } catch (error: any) {
            if (error.retryAfter) {
                return NextResponse.json(
                    { error: 'Too many requests', retryAfter: error.retryAfter },
                    { status: 429, headers: { 'Retry-After': String(error.retryAfter) } }
                )
            }
            // Log real infrastructure errors but return 500
            console.error('Rate limiter failed:', error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        const gym = auth.gym

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const q = searchParams.get('q') || ''
        const dobMonth = searchParams.get('dobMonth')
        const birthday = searchParams.get('birthday')
        const parsedPage = parseInt(searchParams.get('page') || '1', 10)
        const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
        const parsedTake = parseInt(searchParams.get('take') || '50', 10)
        const take = Math.min(100, Math.max(1, isNaN(parsedTake) ? 50 : parsedTake))
        const skip = (page - 1) * take

        const whereClause: any = {
            gymId: gym.id,
            ...(status ? { status: status as any } : {}),
            ...(q
                ? {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { phone: { contains: q } },
                        { email: { contains: q, mode: 'insensitive' } },
                    ],
                }
                : {}),
        }

        let members;
        let totalCount = 0;

        // Validate status against allowed MemberStatus enum values before using in SQL
        const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE', 'EXPIRED', 'PENDING'] as const
        type MemberStatusType = typeof ALLOWED_STATUSES[number]
        const validatedStatus = status && ALLOWED_STATUSES.includes(status as MemberStatusType) ? status : null

        if (birthday === 'today') {
            const now = new Date()
            const todayMonth = now.getMonth() + 1 // 1-indexed
            const todayDay = now.getDate()

            const statusCondition = validatedStatus ? Prisma.sql`AND "status" = ${validatedStatus}::"MemberStatus"` : Prisma.empty;
            const searchCondition = q ? Prisma.sql`AND ("name" ILIKE ${'%' + q + '%'} OR "phone" ILIKE ${'%' + q + '%'} OR "email" ILIKE ${'%' + q + '%'})` : Prisma.empty;

            const countResult: any = await prisma.$queryRaw`
                SELECT COUNT(*) as count 
                FROM "Member" 
                WHERE "gymId" = ${gym.id} 
                AND EXTRACT(MONTH FROM "dateOfBirth") = ${todayMonth}
                AND EXTRACT(DAY FROM "dateOfBirth") = ${todayDay}
                ${statusCondition}
                ${searchCondition}
            `;
            totalCount = Number(countResult[0]?.count || 0);

            members = await prisma.$queryRaw`
                SELECT id, name, phone, email, status, "dateOfBirth", "createdAt", "updatedAt", "gymId"
                FROM "Member" 
                WHERE "gymId" = ${gym.id} 
                AND EXTRACT(MONTH FROM "dateOfBirth") = ${todayMonth}
                AND EXTRACT(DAY FROM "dateOfBirth") = ${todayDay}
                ${statusCondition}
                ${searchCondition}
                ORDER BY "createdAt" DESC
                LIMIT ${take} OFFSET ${skip}
            `;
        } else if (dobMonth && dobMonth !== 'ALL') {
            const month = parseInt(dobMonth, 10);

            // Validate month is a valid 1-12 integer to prevent bad SQL
            if (isNaN(month) || month < 1 || month > 12) {
                return NextResponse.json({ error: 'Invalid dobMonth parameter. Must be between 1 and 12.' }, { status: 400 })
            }

            // Need raw query because Prisma doesn't support EXTRACT natively
            const statusCondition = validatedStatus ? Prisma.sql`AND "status" = ${validatedStatus}::"MemberStatus"` : Prisma.empty;
            const searchCondition = q ? Prisma.sql`AND ("name" ILIKE ${'%' + q + '%'} OR "phone" ILIKE ${'%' + q + '%'} OR "email" ILIKE ${'%' + q + '%'})` : Prisma.empty;

            const countResult: any = await prisma.$queryRaw`
                SELECT COUNT(*) as count 
                FROM "Member" 
                WHERE "gymId" = ${gym.id} 
                AND EXTRACT(MONTH FROM "dateOfBirth") = ${month}
                ${statusCondition}
                ${searchCondition}
            `;
            totalCount = Number(countResult[0]?.count || 0);

            members = await prisma.$queryRaw`
                SELECT id, name, phone, email, status, "dateOfBirth", "createdAt", "updatedAt", "gymId"
                FROM "Member" 
                WHERE "gymId" = ${gym.id} 
                AND EXTRACT(MONTH FROM "dateOfBirth") = ${month}
                ${statusCondition}
                ${searchCondition}
                ORDER BY "createdAt" DESC
                LIMIT ${take} OFFSET ${skip}
            `;
        } else {
            const [dbMembers, dbCount] = await Promise.all([
                prisma.member.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    take,
                    skip,
                }),
                prisma.member.count({ where: whereClause }),
            ]);
            members = dbMembers;
            totalCount = dbCount;
        }

        return NextResponse.json({ members, totalCount, page, hasMore: totalCount > page * take })
    } catch (error) {
        console.error('Error fetching members:', error)
        return NextResponse.json(
            { error: 'Failed to fetch members' },
            { status: 500 }
        )
    }
}

// POST method removed: Now using secure Server Actions inside app/members/actions.ts
