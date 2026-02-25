import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { addDays, startOfDay, endOfDay, differenceInDays } from 'date-fns'
import crypto from 'crypto'

const FROM_EMAIL = 'Gym Mitra ERP <hello@mail.emitra.dev>'
const BATCH_SIZE = 5

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
    // 1. Timing-safe CRON_SECRET verification
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
        console.error('[Cron] CRON_SECRET not configured')
        return new Response('Server misconfigured', { status: 500 })
    }

    // 2. Email Service Configuration
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
        console.error('[Cron] RESEND_API_KEY not configured')
        return new Response('Email service misconfigured', { status: 500 })
    }
    const resend = new Resend(resendKey)

    const authHeader = request.headers.get('authorization') || ''
    const expected = `Bearer ${cronSecret}`

    // Constant-time comparison using fixed-length HMAC digests to prevent length leakage
    const hmacHeader = crypto.createHmac('sha256', cronSecret).update(authHeader).digest()
    const hmacExpected = crypto.createHmac('sha256', cronSecret).update(expected).digest()
    if (!crypto.timingSafeEqual(hmacHeader, hmacExpected)) {
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

        const gyms = await prisma.gymProfile.findMany({
            select: { id: true, name: true, email: true }
        })

        for (const gym of gyms) {
            try {
                // ── Collect all emails for this gym ───────────────────
                const emailBatch: any[] = []
                const notificationBatch: any[] = []

                // ── Expiring Subscriptions (next 7 days) ──────────────
                const expiringSubs = await prisma.memberSubscription.findMany({
                    where: {
                        gymId: gym.id,
                        status: 'ACTIVE',
                        endDate: { gte: todayStart, lte: sevenDaysFromNow }
                    },
                    include: {
                        member: { select: { id: true, name: true, email: true, phone: true } },
                        plan: { select: { name: true } }
                    }
                })

                for (const sub of expiringSubs) {
                    if (!sub.member.email) continue
                    const daysLeft = Math.max(0, differenceInDays(sub.endDate, today))

                    emailBatch.push({
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

                    notificationBatch.push({
                        type: 'EXPIRY_REMINDER',
                        title: 'Membership Expiry Reminder',
                        message: `Sent expiry reminder to memberId=${sub.member.id} (${daysLeft} days left)`,
                        userId: gym.id,
                        gymId: gym.id
                    })
                    results.expiryReminders++
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
                    results.overdueReminders++
                }

                // ── Birthday Wishes ───────────────────────────────────
                const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'numeric', day: 'numeric' })
                const parts = formatter.formatToParts(new Date())
                const todayMonth = parseInt(parts.find(p => p.type === 'month')!.value, 10)
                const todayDay = parseInt(parts.find(p => p.type === 'day')!.value, 10)

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
                    results.birthdayWishes++
                }

                // ── Dispatch Batch APIs ───────────────────────────────
                if (emailBatch.length > 0) {
                    // Resend Batch API (max 100 per call, handles array of payloads)
                    const chunks = []
                    for (let i = 0; i < emailBatch.length; i += 100) {
                        chunks.push(emailBatch.slice(i, i + 100))
                    }

                    for (const chunk of chunks) {
                        try {
                            await resend.batch.send(chunk)
                        } catch (e) {
                            console.error(`[Cron] Resend batch failed for gymId=${gym.id}:`, e)
                            results.errors++
                        }
                    }

                    // Bulk insert notifications
                    if (notificationBatch.length > 0) {
                        await prisma.notification.createMany({ data: notificationBatch })
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
