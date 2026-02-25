import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { addDays, startOfDay, endOfDay } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'Gym Mitra ERP <hello@mail.emitra.dev>'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60s for processing all gyms

export async function GET(request: NextRequest) {
    // 1. Verify cron secret (Vercel auto-sets CRON_SECRET for cron invocations)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    const results = {
        expiryReminders: 0,
        overdueReminders: 0,
        birthdayWishes: 0,
        errors: 0
    }

    try {
        const today = new Date()
        const todayStart = startOfDay(today)
        const sevenDaysFromNow = endOfDay(addDays(today, 7))

        // Process all gyms
        const gyms = await prisma.gymProfile.findMany({
            select: { id: true, name: true, email: true }
        })

        for (const gym of gyms) {
            try {
                // ── Expiring Subscriptions (next 7 days) ────────────────
                const expiringSubs = await prisma.memberSubscription.findMany({
                    where: {
                        gymId: gym.id,
                        status: 'ACTIVE',
                        endDate: { gte: todayStart, lte: sevenDaysFromNow }
                    },
                    include: {
                        member: { select: { name: true, email: true, phone: true } },
                        plan: { select: { name: true } }
                    }
                })

                for (const sub of expiringSubs) {
                    if (!sub.member.email) continue
                    try {
                        const daysLeft = Math.max(0, Math.ceil((sub.endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)))
                        await resend.emails.send({
                            from: FROM_EMAIL,
                            to: [sub.member.email],
                            subject: `${gym.name} - Membership Expiring in ${daysLeft} Days`,
                            html: `
                                <h2>Hi ${sub.member.name},</h2>
                                <p>Your <strong>${sub.plan.name}</strong> membership at <strong>${gym.name}</strong> expires in <strong>${daysLeft} days</strong>.</p>
                                <p>Please visit the gym or contact us to renew and continue your fitness journey! 💪</p>
                                <br/>
                                <p>Best regards,<br/>Team ${gym.name}</p>
                            `
                        })

                        await prisma.notification.create({
                            data: {
                                type: 'EXPIRY_REMINDER',
                                title: 'Membership Expiry Reminder',
                                message: `Sent expiry reminder to ${sub.member.name} (${daysLeft} days left)`,
                                userId: gym.id,
                                gymId: gym.id
                            }
                        })
                        results.expiryReminders++
                    } catch (e) {
                        console.error(`[Cron] Failed expiry email for ${sub.member.email}:`, e)
                        results.errors++
                    }
                }

                // ── Overdue Invoices ─────────────────────────────────────
                const overdueInvoices = await prisma.invoice.findMany({
                    where: {
                        gymId: gym.id,
                        paymentStatus: 'OVERDUE',
                        memberId: { not: null }
                    },
                    include: {
                        member: { select: { name: true, email: true } }
                    }
                })

                for (const inv of overdueInvoices) {
                    if (!inv.member?.email) continue
                    try {
                        await resend.emails.send({
                            from: FROM_EMAIL,
                            to: [inv.member.email],
                            subject: `${gym.name} - Payment Reminder`,
                            html: `
                                <h2>Hi ${inv.member.name},</h2>
                                <p>This is a gentle reminder that invoice <strong>#${inv.invoiceNumber}</strong> of <strong>₹${Number(inv.total).toLocaleString('en-IN')}</strong> is overdue.</p>
                                <p>Please clear the payment at your earliest convenience to avoid any interruption in your membership.</p>
                                <br/>
                                <p>Thank you,<br/>Team ${gym.name}</p>
                            `
                        })

                        await prisma.notification.create({
                            data: {
                                type: 'PAYMENT_OVERDUE',
                                title: 'Overdue Payment Reminder Sent',
                                message: `Sent overdue reminder to ${inv.member.name} for ₹${Number(inv.total)}`,
                                userId: gym.id,
                                gymId: gym.id
                            }
                        })
                        results.overdueReminders++
                    } catch (e) {
                        console.error(`[Cron] Failed overdue email for ${inv.member?.email}:`, e)
                        results.errors++
                    }
                }

                // ── Birthday Wishes ──────────────────────────────────────
                const allActiveMembers = await prisma.member.findMany({
                    where: { gymId: gym.id, status: 'ACTIVE' },
                    select: { id: true, name: true, email: true, dateOfBirth: true }
                })

                const birthdayMembers = allActiveMembers.filter(m => {
                    if (!m.dateOfBirth) return false
                    const dob = new Date(m.dateOfBirth)
                    return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth()
                })

                for (const member of birthdayMembers) {
                    if (!member.email) continue
                    try {
                        await resend.emails.send({
                            from: FROM_EMAIL,
                            to: [member.email],
                            subject: `🎂 Happy Birthday from ${gym.name}!`,
                            html: `
                                <h2>🎉 Happy Birthday, ${member.name}!</h2>
                                <p>The entire team at <strong>${gym.name}</strong> wishes you a wonderful year ahead filled with health and happiness!</p>
                                <p>Keep crushing your fitness goals! 💪🎂</p>
                                <br/>
                                <p>With love,<br/>Team ${gym.name}</p>
                            `
                        })

                        await prisma.notification.create({
                            data: {
                                type: 'BIRTHDAY',
                                title: 'Birthday Wish Sent',
                                message: `Sent birthday wish to ${member.name}`,
                                userId: gym.id,
                                gymId: gym.id
                            }
                        })
                        results.birthdayWishes++
                    } catch (e) {
                        console.error(`[Cron] Failed birthday email for ${member.email}:`, e)
                        results.errors++
                    }
                }
            } catch (gymError) {
                console.error(`[Cron] Failed processing gym ${gym.id}:`, gymError)
                results.errors++
            }
        }

        console.log(`[Cron] Daily reminders completed:`, results)
        return NextResponse.json({ success: true, ...results })
    } catch (error) {
        console.error('[Cron] Fatal error in daily reminders:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
