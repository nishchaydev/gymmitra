import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, subDays, addDays } from 'date-fns'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
import { getAuthGym } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function getAuthenticatedGym() {
    const auth = await getAuthGym()
    return auth ? auth.gym : null
}

export async function GET(request: NextRequest) {
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const today = new Date()
        const todayStart = startOfDay(today)
        const todayEnd = endOfDay(today)

        const [birthdays, overdueInvoices, inactiveMembers, expiringSubs] = await Promise.all([
            // 1. Birthdays Today
            prisma.member.findMany({
                where: {
                    gymId: gym.id,
                    status: 'ACTIVE'
                    // Prisma doesn't support raw 'extract(day from dateOfBirth)' natively in where clauses
                    // We fetch all active members and filter in memory since gym rosters are typically < 1000
                },
                select: { id: true, name: true, phone: true, dateOfBirth: true }
            }).then(members => members.filter(m => {
                const dob = new Date(m.dateOfBirth)
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
                    endDate: { gte: todayStart, lte: addDays(todayStart, 7) }
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
                link: getWhatsAppLink(m.phone, templates.birthdayWish(m.name, gym.name))
            })),
            overdue: overdueInvoices.map(inv => ({
                type: 'OVERDUE',
                invoiceId: inv.id,
                name: inv.member?.name || 'Unknown',
                amount: Number(inv.total),
                message: templates.paymentOverdue(inv.member?.name || 'Unknown', Number(inv.total), gym.name),
                link: getWhatsAppLink(inv.member?.phone || '', templates.paymentOverdue(inv.member?.name || 'Unknown', Number(inv.total), gym.name))
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
                    link: getWhatsAppLink(m.phone, templates.inactivityNudge(m.name, daysSince, gym.name))
                }
            }),
            expiring: expiringSubs.map(sub => {
                const daysLeft = Math.ceil((new Date(sub.endDate).getTime() - today.getTime()) / (1000 * 3600 * 24))
                return {
                    type: 'EXPIRING',
                    subId: sub.id,
                    name: sub.member?.name || 'Unknown',
                    daysLeft,
                    message: templates.renewalReminder(sub.member?.name || 'Unknown', daysLeft, gym.name),
                    link: getWhatsAppLink(sub.member?.phone || '', templates.renewalReminder(sub.member?.name || 'Unknown', daysLeft, gym.name))
                }
            })
        }

        return NextResponse.json(reminders)

    } catch (error) {
        console.error('Reminders API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
    }
}
