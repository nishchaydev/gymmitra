import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'
import { Resend, CreateEmailOptions, CreateEmailResponseSuccess } from 'resend'
import { Prisma } from '@prisma/client'
import crypto from 'crypto'
import { guardRateLimit } from '@/lib/rate-limit'

const FROM_EMAIL = 'Gym Mitra ERP <hello@mail.emitra.dev>'
const BATCH_SIZE = 100

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ── Currency formatter ──────────────────────────────────────────────
function formatINR(amount: number): string {
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        }).format(amount)
    } catch {
        // Fallback for minimal-ICU Node builds
        return `₹${amount.toFixed(2).replace(/\B(?=(\d{2})+(\d)(?!\d))/g, ',')}`
    }
}

// ── Batch processor removed (using Resend Batch API instead) ─────────

export async function GET(request: NextRequest) {
    // Basic rate limit for cron to prevent DDOS attempts against the URL
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const rawIp = realIp || forwardedFor || '127.0.0.1'
    const ip = rawIp.split(',')[0].trim() || '127.0.0.1'

    const rl = await guardRateLimit(5, `cron:reminders:${ip}`, false)
    if (rl) return rl

    // 1. Timing-safe CRON_SECRET verification
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
        console.error('[Cron] CRON_SECRET not configured')
        return new Response('Server misconfigured', { status: 500 })
    }

    const authHeader = request.headers.get('authorization') || ''
    const expected = `Bearer ${cronSecret}`

    // Constant-time comparison using fixed-length HMAC digests to prevent length leakage
    const hmacHeader = crypto.createHmac('sha256', cronSecret).update(authHeader).digest()
    const hmacExpected = crypto.createHmac('sha256', cronSecret).update(expected).digest()
    if (!crypto.timingSafeEqual(hmacHeader, hmacExpected)) {
        return new Response('Unauthorized', { status: 401 })
    }

    // 2. Email Service Configuration
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
        console.error('[Cron] RESEND_API_KEY not configured')
        return new Response('Email service misconfigured', { status: 500 })
    }
    const resend = new Resend(resendKey)

    const results = {
        expiryReminders: 0,
        overdueReminders: 0,
        birthdayWishes: 0,
        errors: 0
    }

    // ── TARGET_DAYS: exact milestone days before expiry ─────────────────
    // A member expiring in exactly D days gets ONE email today.
    // This prevents the "email every day for 7 days" spam bug.
    const TARGET_DAYS = [10, 7, 5, 3, 2, 1]

    try {
        // Timezone normalization for India Standard Time (IST)
        const now = new Date()
        const istDateStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }).format(now)
        const [month, day, year] = istDateStr.split('/').map(Number)

        // Midnight IST mapped to UTC (IST is UTC+5:30, so 00:00 IST = 18:30 UTC the previous day)
        const istMidnightUTC = new Date(Date.UTC(year, month - 1, day, -5, -30, 0, 0))

        const gyms = await prisma.gymProfile.findMany({
            select: { id: true, name: true, email: true }
        })

        for (const gym of gyms) {
            try {
                // ── Collect all emails for this gym ───────────────────
                const emailBatch: CreateEmailOptions[] = []
                const notificationBatch: Prisma.NotificationCreateManyInput[] = []

                // ── Expiring Subscriptions — exact-day countdown ───────
                // Query each target day separately so a member expiring in
                // exactly 8 days receives ZERO emails today (not in any window).
                for (const daysAhead of TARGET_DAYS) {
                    const windowStart = new Date(istMidnightUTC.getTime() + daysAhead * 24 * 60 * 60 * 1000)
                    const windowEnd = new Date(istMidnightUTC.getTime() + (daysAhead + 1) * 24 * 60 * 60 * 1000 - 1)

                    const expiringSubs = await prisma.memberSubscription.findMany({
                        where: {
                            gymId: gym.id,
                            status: 'ACTIVE',
                            endDate: { gte: windowStart, lte: windowEnd }
                        },
                        include: {
                            member: { select: { id: true, name: true, email: true, phone: true } },
                            plan: { select: { name: true } }
                        }
                    })

                    for (const sub of expiringSubs) {
                        if (!sub.member.email) continue

                        const isUrgent = daysAhead <= 2
                        const expiryDateStr = sub.endDate.toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        })

                        const subjectPrefix = isUrgent ? '⚠️ URGENT — ' : ''
                        const urgencyHtml = isUrgent
                            ? `<p style="color:#dc2626;font-weight:bold;">⚠️ Your membership expires on <strong>${expiryDateStr}</strong> — just ${daysAhead} day${daysAhead === 1 ? '' : 's'} away. Please renew immediately to avoid interruption!</p>`
                            : `<p>Your <strong>${sub.plan.name}</strong> membership at <strong>${gym.name}</strong> expires in <strong>${daysAhead} days</strong>.</p>`

                        const actSoonHtml = (daysAhead === 5 || daysAhead === 3)
                            ? `<p><em>Act soon — spots fill up fast!</em> 🏃</p>`
                            : ''

                        emailBatch.push({
                            from: FROM_EMAIL,
                            to: [sub.member.email],
                            subject: `${subjectPrefix}${gym.name} - Membership Expiring in ${daysAhead} Day${daysAhead === 1 ? '' : 's'}`,
                            html: `
                                <h2>Hi ${sub.member.name},</h2>
                                ${urgencyHtml}
                                ${actSoonHtml}
                                <p>Please visit the gym or contact us to renew and continue your fitness journey! 💪</p>
                                <br/>
                                <p>Best regards,<br/>Team ${gym.name}</p>
                            `
                        })

                        notificationBatch.push({
                            type: 'EXPIRY_REMINDER',
                            title: 'Membership Expiry Reminder',
                            message: `Sent day-${daysAhead} countdown reminder to memberId=${sub.member.id}`,
                            userId: gym.id,
                            gymId: gym.id
                        })
                    }
                }

                // ── Overdue Invoices ──────────────────────────────────
                const overdueInvoices = await prisma.invoice.findMany({
                    where: {
                        gymId: gym.id,
                        paymentStatus: 'OVERDUE',
                        memberId: { not: null }
                    },
                    include: {
                        member: { select: { id: true, name: true, email: true } }
                    }
                })

                for (const inv of overdueInvoices) {
                    if (!inv.member?.email) continue
                    const formattedTotal = formatINR(Number(inv.total))

                    emailBatch.push({
                        from: FROM_EMAIL,
                        to: [inv.member.email],
                        subject: `${gym.name} - Payment Reminder`,
                        html: `
                            <h2>Hi ${inv.member.name},</h2>
                            <p>This is a gentle reminder that invoice <strong>#${inv.invoiceNumber}</strong> of <strong>${formattedTotal}</strong> is overdue.</p>
                            <p>Please clear the payment at your earliest convenience to avoid any interruption in your membership.</p>
                            <br/>
                            <p>Thank you,<br/>Team ${gym.name}</p>
                        `
                    })

                    notificationBatch.push({
                        type: 'PAYMENT_OVERDUE',
                        title: 'Overdue Payment Reminder Sent',
                        message: `Sent overdue reminder to memberId=${inv.member.id} for ${formattedTotal}`,
                        userId: gym.id,
                        gymId: gym.id
                    })
                }

                // ── Birthday Wishes ───────────────────────────────────
                const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'numeric', day: 'numeric' })
                let todayMonth: number, todayDay: number
                try {
                    const parts = formatter.formatToParts(new Date())
                    const monthPart = parts.find(p => p.type === 'month')?.value
                    const dayPart = parts.find(p => p.type === 'day')?.value
                    if (!monthPart || !dayPart) {
                        throw new Error(`Failed to extract month or day from formatted parts for Asia/Kolkata timezone: ${JSON.stringify(parts)}`)
                    }
                    todayMonth = parseInt(monthPart, 10)
                    todayDay = parseInt(dayPart, 10)
                } catch (error) {
                    console.error('[CRON] Failed determining Kolkata date for birthdays', error)
                    return NextResponse.json({ error: 'Failed determining target timezone date' }, { status: 500 })
                }

                const birthdayMembers: { id: string; name: string; email: string | null }[] =
                    await prisma.$queryRaw`
                        SELECT "id", "name", "email" FROM "Member"
                        WHERE "gymId" = ${gym.id}
                          AND "status" = 'ACTIVE'
                          AND "dateOfBirth" IS NOT NULL
                          AND EXTRACT(MONTH FROM "dateOfBirth") = ${todayMonth}
                          AND EXTRACT(DAY FROM "dateOfBirth") = ${todayDay}
                    `

                for (const member of birthdayMembers) {
                    if (!member.email) continue

                    emailBatch.push({
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

                    notificationBatch.push({
                        type: 'BIRTHDAY',
                        title: 'Birthday Wish Sent',
                        message: `Sent birthday wish to memberId=${member.id}`,
                        userId: gym.id,
                        gymId: gym.id
                    })
                }

                // ── Dispatch Batch APIs ───────────────────────────────
                if (emailBatch.length > 0) {
                    const chunkCount = Math.ceil(emailBatch.length / BATCH_SIZE)
                    for (let i = 0; i < chunkCount; i++) {
                        const emailChunk = emailBatch.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
                        const notifChunk = notificationBatch.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)

                        try {
                            const response = await resend.batch.send(emailChunk)
                            if (response.error) {
                                console.error(`[Cron] Resend batch error for gymId=${gym.id}:`, response.error)
                                results.errors += emailChunk.length
                            } else if (response.data && response.data.data) {
                                const successfulNotifs: Prisma.NotificationCreateManyInput[] = []
                                response.data.data.forEach((emailResult: CreateEmailResponseSuccess | Error | any, idx: number) => {
                                    if (!emailResult || emailResult.error || !emailResult.id) {
                                        results.errors++
                                    } else {
                                        if (notifChunk[idx]) {
                                            successfulNotifs.push(notifChunk[idx])
                                        }
                                    }
                                })
                                if (successfulNotifs.length > 0) {
                                    try {
                                        await prisma.notification.createMany({ data: successfulNotifs })
                                        successfulNotifs.forEach(notif => {
                                            switch (notif.type) {
                                                case 'BIRTHDAY': results.birthdayWishes++; break;
                                                case 'EXPIRY_REMINDER': results.expiryReminders++; break;
                                                case 'PAYMENT_OVERDUE': results.overdueReminders++; break;
                                            }
                                        });
                                    } catch (notifErr) {
                                        console.error(`[Cron] Database insertion failed for notifications:`, notifErr)
                                        results.errors += successfulNotifs.length
                                    }
                                }
                            }
                        } catch (e) {
                            console.error(`[Cron] Resend batch failed for gymId=${gym.id}:`, e)
                            results.errors += emailChunk.length
                        }
                    }
                }
            } catch (gymError) {
                console.error(`[Cron] Failed processing gymId=${gym.id}:`, gymError)
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
