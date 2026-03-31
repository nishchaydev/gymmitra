import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, subDays, addDays } from 'date-fns'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { daysSince } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getAuth() {
    const auth = await getAuthGym()
    return auth
}

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuth()
        if (!auth || !auth.gym || typeof auth.userId !== 'string') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const roleCheck = checkRole(auth, ['OWNER', 'MANAGER'])
        if (roleCheck) return roleCheck

        // Fix 13 request: rate limit 10
        const rl = await guardRateLimit(10, `${auth.userId}:reminders:get`)
        if (rl) return rl

        const gym = auth.gym

        const today = new Date()
        const todayStart = startOfDay(today)
        const todayEnd = endOfDay(today)

         const [birthdays, overdueInvoices, inactiveMembers, expiringSubs] = await Promise.all([
             // 1. Birthdays Today — filtered in DB via SQL EXTRACT to avoid loading all members
             (async () => {
                 // Use IST offset (+5:30) to get correct date for Indian users
                 const nowUtc = new Date()
                 const istOffset = 330 // IST is UTC+5:30 = 330 minutes
                 const istDate = new Date(nowUtc.getTime() + istOffset * 60 * 1000)
                 const todayMonth = istDate.getUTCMonth() + 1
                 const todayDay = istDate.getUTCDate()
                 return prisma.$queryRaw<{ id: string; name: string; phone: string | null }[]>`
                     SELECT id, name, phone
                     FROM "Member"
                     WHERE "gymId" = ${gym.id}
                       AND status = 'ACTIVE'
                       AND "dateOfBirth" IS NOT NULL
                       AND EXTRACT(MONTH FROM "dateOfBirth") = ${todayMonth}
                       AND EXTRACT(DAY FROM "dateOfBirth") = ${todayDay}
                 `
             })(),

            // 2. Overdue Payments
            prisma.invoice.findMany({
                where: {
                    gymId: gym.id,
                    paymentStatus: 'OVERDUE',
                    memberId: { not: null }
                },
                select: {
                    id: true,
                    invoiceNumber: true,
                    total: true,
                    member: { select: { name: true, phone: true } }
                }
            }),

            // 3. Inactive Members (> 14 days since last checkIn)
            prisma.member.findMany({
                where: {
                    gymId: gym.id,
                    status: 'ACTIVE'
                },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    attendance: {
                        orderBy: { date: 'desc' },
                        take: 1,
                        select: { date: true }
                    }
                }
            }),

            // 4. Expiring Subscriptions (Next 7 Days)
            prisma.memberSubscription.findMany({
                where: {
                    gymId: gym.id,
                    status: 'ACTIVE',
                    endDate: { gte: todayStart, lte: addDays(todayEnd, 7) }
                },
                select: {
                    id: true,
                    endDate: true,
                    member: { select: { name: true, phone: true } }
                },
                orderBy: { endDate: 'asc' }
            })
        ])

         // Filter inactive members using our validated daysSince function
         const filteredInactive = inactiveMembers.filter(m => {
             const lastAttendance = m.attendance[0]?.date
             const daysInactive = daysSince(lastAttendance ? new Date(lastAttendance) : null)
             // Consider inactive if daysSince is null (unknown) or > 14 days
             return daysInactive === null || daysInactive > 14
         })

        // Format into action items with wa.me links
        const reminders = {
            birthdays: birthdays.map(m => ({
                type: 'BIRTHDAY',
                memberId: m.id,
                name: m.name,
                message: templates.birthdayWish(m.name, gym.name),
                link: m.phone ? getWhatsAppLink(m.phone, templates.birthdayWish(m.name, gym.name)) : null
            })),
            overdue: overdueInvoices.map(inv => {
                const msg = templates.paymentOverdue(inv.member?.name || 'Unknown', Number(inv.total), gym.name, gym.waOverdueMsg || undefined)
                return {
                    type: 'OVERDUE',
                    invoiceId: inv.id,
                    name: inv.member?.name || 'Unknown',
                    amount: Number(inv.total),
                    message: msg,
                    link: inv.member?.phone ? getWhatsAppLink(inv.member?.phone, msg) : null
                }
            }),
             inactive: filteredInactive.map(m => {
                 const lastAttendance = m.attendance[0]?.date
                 const daysInactive = daysSince(lastAttendance ? new Date(lastAttendance) : null)
                 // For display purposes, show null as "unknown" or use a reasonable fallback
                 const displayDays = daysInactive === null ? 'unknown' : daysInactive
                 return {
                     type: 'INACTIVE',
                     memberId: m.id,
                     name: m.name,
                     daysInactive: daysInactive,
                     message: templates.inactivityNudge(m.name, displayDays === 'unknown' ? 30 : displayDays, gym.name),
                     link: m.phone ? getWhatsAppLink(m.phone, templates.inactivityNudge(m.name, displayDays === 'unknown' ? 30 : displayDays, gym.name)) : null
                 }
             }),
            expiring: expiringSubs.map(sub => {
                const diffTime = new Date(sub.endDate).getTime() - today.getTime();
                const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 3600 * 24)));
                const msg = templates.renewalReminder(sub.member?.name || 'Unknown', daysLeft, gym.name, gym.waRenewalMsg || undefined)
                return {
                    type: 'EXPIRING',
                    subId: sub.id,
                    name: sub.member?.name || 'Unknown',
                    daysLeft,
                    message: msg,
                    link: sub.member?.phone ? getWhatsAppLink(sub.member?.phone, msg) : null
                }
            })
        }

        return NextResponse.json(reminders)

    } catch (error) {
        console.error('Reminders API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
    }
}
