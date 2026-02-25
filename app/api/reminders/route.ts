import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, subDays, addDays } from 'date-fns'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
import { getAuthGym } from '@/lib/auth'
import { apiLimiter, RateLimitError } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

async function getAuthenticatedGym() {
    const auth = await getAuthGym()
    return auth ? auth.gym : null
}

export async function GET(request: NextRequest) {
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        try { await apiLimiter.check(30, `${gym.id}:reminders:get`) } catch (e) {
            if (e instanceof RateLimitError) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
            throw e
        }

        const today = new Date()
        const todayStart = startOfDay(today)
        const todayEnd = endOfDay(today)

        const [birthdays, overdueInvoices, inactiveMembers, expiringSubs] = await Promise.all([
            // 1. Birthdays Today (Only members with DOB)
            prisma.member.findMany({
                where: {
                    gymId: gym.id,
                    status: 'ACTIVE',
                    dateOfBirth: { not: null as any }
                },
                select: { id: true, name: true, phone: true, dateOfBirth: true }
            }).then(members => members.filter(m => {
                const dob = new Date(m.dateOfBirth!)
                return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth()
            })),

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

        // Filter inactive members
        const fourteenDaysAgo = subDays(todayStart, 14)
        const filteredInactive = inactiveMembers.filter(m => {
            const lastAttendance = m.attendance[0]?.date
            return !lastAttendance || new Date(lastAttendance) < fourteenDaysAgo
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
            overdue: overdueInvoices.map(inv => ({
                type: 'OVERDUE',
                invoiceId: inv.id,
                name: inv.member?.name || 'Unknown',
                amount: Number(inv.total),
                message: templates.paymentOverdue(inv.member?.name || 'Unknown', Number(inv.total), gym.name),
                link: inv.member?.phone ? getWhatsAppLink(inv.member?.phone, templates.paymentOverdue(inv.member?.name || 'Unknown', Number(inv.total), gym.name)) : null
            })),
            inactive: filteredInactive.map(m => {
                const lastAttendance = m.attendance[0]?.date
                const daysSince = lastAttendance ? Math.floor((today.getTime() - new Date(lastAttendance).getTime()) / (1000 * 3600 * 24)) : 30 // assume 30 if null
                return {
                    type: 'INACTIVE',
                    memberId: m.id,
                    name: m.name,
                    daysInactive: daysSince,
                    message: templates.inactivityNudge(m.name, daysSince, gym.name),
                    link: m.phone ? getWhatsAppLink(m.phone, templates.inactivityNudge(m.name, daysSince, gym.name)) : null
                }
            }),
            expiring: expiringSubs.map(sub => {
                const diffTime = new Date(sub.endDate).getTime() - today.getTime();
                const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 3600 * 24)));
                return {
                    type: 'EXPIRING',
                    subId: sub.id,
                    name: sub.member?.name || 'Unknown',
                    daysLeft,
                    message: templates.renewalReminder(sub.member?.name || 'Unknown', daysLeft, gym.name),
                    link: sub.member?.phone ? getWhatsAppLink(sub.member?.phone, templates.renewalReminder(sub.member?.name || 'Unknown', daysLeft, gym.name)) : null
                }
            })
        }

        return NextResponse.json(reminders)

    } catch (error) {
        console.error('Reminders API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
    }
}
