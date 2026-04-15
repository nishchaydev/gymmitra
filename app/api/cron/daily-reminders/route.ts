import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'
import { Prisma } from '@prisma/client'
import React from 'react'
import { guardRateLimit } from '@/lib/rate-limit'
import { syncMemberStatuses } from '@/src/modules/shared/status-engine'
import { verifyCronSecret } from '@/lib/webhook-auth'
import { extractIp } from '@/lib/with-gym-auth'
import { sendBatch, FROM_EMAIL, type BatchResult } from '@/lib/email'
import type { CreateEmailOptions } from 'resend'

// ── XSS Prevention ─────────────────────────────────────────────────
function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
const BATCH_SIZE = 100
const GYMS_PER_RUN = 5 // Process only 5 gyms per cron invocation

export const dynamic = 'force-dynamic'
export const maxDuration = 10 // Vercel Hobby plan limit

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

export async function GET(request: NextRequest) {
    const ip = extractIp(request)

    const rl = await guardRateLimit(5, `cron:reminders:${ip}`, false)
    if (rl) return rl

    if (!verifyCronSecret(request)) {
        return new Response('Unauthorized', { status: 401 })
    }

    // 2. Email service is centralized in lib/email.ts (singleton)


    const results = {
        expiryReminders: 0,
        overdueReminders: 0,
        birthdayWishes: 0,
        errors: 0,
        gymsProcessed: 0,
        gymsRemaining: 0
    }

    // ── TARGET_DAYS: exact milestone days before expiry ─────────────────
    // A member expiring in exactly D days gets ONE email today.
    // This prevents the "email every day for 7 days" spam bug.
    const TARGET_DAYS = [10, 7, 6, 5, 4, 3, 2, 1]

    try {
        // Timezone normalization for India Standard Time (IST)
        const now = new Date()
        const istDateStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }).format(now)
        const [month, day, year] = istDateStr.split('/').map(Number)

        // Midnight IST mapped to UTC (IST is UTC+5:30, so 00:00 IST = 18:30 UTC the previous day)
        const istMidnightUTC = new Date(Date.UTC(year, month - 1, day, -5, -30, 0, 0))

        // ── BATCH: Fetch only gyms not yet processed today ──────────────
        const gyms = await prisma.gymProfile.findMany({
            where: {
                OR: [
                    { lastBriefingSentAt: null },
                    { lastBriefingSentAt: { lt: istMidnightUTC } }
                ]
            },
            select: {
                id: true, name: true, email: true, ownerName: true, slug: true,
                createdAt: true, isVerified: true, userId: true
            },
            take: GYMS_PER_RUN,
            orderBy: { createdAt: 'asc' } // Process oldest gyms first
        })

        // Count remaining gyms for diagnostics
        const totalUnprocessed = await prisma.gymProfile.count({
            where: {
                OR: [
                    { lastBriefingSentAt: null },
                    { lastBriefingSentAt: { lt: istMidnightUTC } }
                ]
            }
        })
        results.gymsRemaining = Math.max(0, totalUnprocessed - gyms.length)

          for (const gym of gyms) {
              try {
                  // Step 0: Sync member statuses before sending any reminders
                  await syncMemberStatuses(gym.id);
                  
                  // ── Collect all emails for this gym ───────────────────
                 const emailBatch: CreateEmailOptions[] = []
                 const notificationBatch: Prisma.NotificationCreateManyInput[] = []

                // ── Expiring Subscriptions — exact-day countdown ───────
                // Query a single window to save DB round-trips
                const maxDaysAhead = Math.max(...TARGET_DAYS)
                const minDaysAhead = Math.min(...TARGET_DAYS)
                const overallWindowStart = new Date(istMidnightUTC.getTime() + minDaysAhead * 24 * 60 * 60 * 1000)
                const overallWindowEnd = new Date(istMidnightUTC.getTime() + (maxDaysAhead + 1) * 24 * 60 * 60 * 1000 - 1)

                const allExpiringSubs = await prisma.memberSubscription.findMany({
                    where: {
                        gymId: gym.id,
                        status: 'ACTIVE',
                        endDate: { gte: overallWindowStart, lte: overallWindowEnd },
                        member: { deletedAt: null }  // exclude soft-deleted members
                    },
                    include: {
                        member: { select: { id: true, name: true, email: true, phone: true } },
                        plan: { select: { name: true } }
                    }
                })

                for (const sub of allExpiringSubs) {
                    const diffTime = sub.endDate.getTime() - istMidnightUTC.getTime();
                    const daysAhead = Math.floor(diffTime / (1000 * 3600 * 24));
                    
                    if (!TARGET_DAYS.includes(daysAhead)) continue;
                        if (!sub.member.email) continue

                        const isUrgent = daysAhead <= 2
                        const expiryDateStr = sub.endDate.toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        })

                        const subjectPrefix = isUrgent ? '⚠️ URGENT — ' : ''
                        const safeGymName = escapeHtml(gym.name)
                        const safeMemberName = escapeHtml(sub.member.name)
                        const safePlanName = escapeHtml(sub.plan.name)
                        const urgencyHtml = isUrgent
                            ? `<p style="color:#dc2626;font-weight:bold;">⚠️ Your membership expires on <strong>${expiryDateStr}</strong> — just ${daysAhead} day${daysAhead === 1 ? '' : 's'} away. Please renew immediately to avoid interruption!</p>`
                            : `<p>Your <strong>${safePlanName}</strong> membership at <strong>${safeGymName}</strong> expires in <strong>${daysAhead} days</strong>.</p>`

                        const actSoonHtml = (daysAhead === 5 || daysAhead === 3)
                            ? `<p><em>Act soon — spots fill up fast!</em> 🏃</p>`
                            : ''

                        emailBatch.push({
                            from: FROM_EMAIL,
                            to: [sub.member.email],
                            subject: `${subjectPrefix}${gym.name} - Membership Expiring in ${daysAhead} Day${daysAhead === 1 ? '' : 's'}`,
                            html: `
                                <h2>Hi ${safeMemberName},</h2>
                                ${urgencyHtml}
                                ${actSoonHtml}
                                <p>Please visit the gym or contact us to renew and continue your fitness journey! 💪</p>
                                <br/>
                                <p>Best regards,<br/>Team ${safeGymName}</p>
                            `
                        })

                        notificationBatch.push({
                            type: 'EXPIRY_REMINDER',
                            title: 'Membership Expiry Reminder',
                            message: `Sent day-${daysAhead} countdown reminder to memberId=${sub.member.id}`,
                            userId: gym.userId,
                            gymId: gym.id
                        })
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
                    const formattedTotal = formatINR(Number(inv.balanceDue || inv.total))

                    emailBatch.push({
                        from: FROM_EMAIL,
                        to: [inv.member.email],
                        subject: `${gym.name} - Payment Reminder`,
                        html: `
                            <h2>Hi ${escapeHtml(inv.member.name)},</h2>
                            <p>This is a gentle reminder that invoice <strong>#${escapeHtml(inv.invoiceNumber)}</strong> of <strong>${formattedTotal}</strong> is overdue.</p>
                            <p>Please clear the payment at your earliest convenience to avoid any interruption in your membership.</p>
                            <br/>
                            <p>Thank you,<br/>Team ${escapeHtml(gym.name)}</p>
                        `
                    })

                    notificationBatch.push({
                        type: 'PAYMENT_OVERDUE',
                        title: 'Overdue Payment Reminder Sent',
                        message: `Sent overdue reminder to memberId=${inv.member.id} for ${formattedTotal}`,
                        userId: gym.userId,
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
                          AND "deletedAt" IS NULL
                          AND "dateOfBirth" IS NOT NULL
                          AND EXTRACT(MONTH FROM "dateOfBirth" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${todayMonth}
                          AND EXTRACT(DAY FROM "dateOfBirth" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${todayDay}
                    `

                for (const member of birthdayMembers) {
                    if (!member.email) continue

                    emailBatch.push({
                        from: FROM_EMAIL,
                        to: [member.email],
                        subject: `🎂 Happy Birthday from ${gym.name}!`,
                        html: `
                            <h2>🎉 Happy Birthday, ${escapeHtml(member.name)}!</h2>
                            <p>The entire team at <strong>${escapeHtml(gym.name)}</strong> wishes you a wonderful year ahead filled with health and happiness!</p>
                            <p>Keep crushing your fitness goals! 💪🎂</p>
                            <br/>
                            <p>With love,<br/>Team ${escapeHtml(gym.name)}</p>
                        `
                    })

                    notificationBatch.push({
                        type: 'BIRTHDAY',
                        title: 'Birthday Wish Sent',
                        message: `Sent birthday wish to memberId=${member.id}`,
                        userId: gym.userId,
                        gymId: gym.id
                    })
                }

                // ── Daily Briefing Email ──────────────────────────────
                try {
                    const todayStart = istMidnightUTC
                    const todayEnd = new Date(istMidnightUTC.getTime() + 24 * 60 * 60 * 1000 - 1)

                    const followUpsToday = await prisma.lead.findMany({
                        where: { gymId: gym.id, followUpDate: { gte: todayStart, lte: todayEnd }, status: { notIn: ['CONVERTED', 'NOT_INTERESTED'] } }
                    })
                    const partialInvoices = await prisma.invoice.findMany({
                        where: { gymId: gym.id, paymentStatus: 'PARTIAL', memberId: { not: null } },
                        include: { member: { select: { name: true } } }
                    })
                    const lowStockProducts = await prisma.product.findMany({
                        where: { gymId: gym.id, isActive: true, stock: { lte: 5 } }
                    })
                    const urgentRenewals = await prisma.memberSubscription.findMany({
                        where: { gymId: gym.id, status: 'ACTIVE', endDate: { gte: todayStart, lte: new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000) } },
                        include: { member: { select: { name: true } }, plan: { select: { name: true } } }
                    })

                    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)
                    const yesterdayEnd = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000)
                    
                    const yesterdayCheckInsCount = await prisma.attendance.count({
                        where: {
                            gymId: gym.id,
                            date: { gte: yesterdayStart, lte: yesterdayEnd }
                        }
                    })
                    
                    const activeMembersCount = await prisma.member.count({
                        where: { gymId: gym.id, status: 'ACTIVE' }
                    })

                    const Component = (await import('@/components/emails/DailyBriefingEmail')).DailyBriefingEmail
                    emailBatch.push({
                        from: FROM_EMAIL,
                        to: [gym.email],
                        subject: `☀️ Good morning, ${gym.ownerName?.split(' ')[0] || 'Admin'} — ${gym.name} Briefing`,
                        react: React.createElement(Component, {
                            ownerName: gym.ownerName?.split(' ')[0] || 'Admin',
                            gymName: gym.name,
                            date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
                            slug: gym.slug || 'demo',
                            urgentRenewals: urgentRenewals.map(u => ({
                                id: u.id,
                                name: u.member.name,
                                planName: u.plan.name || 'Membership',
                                daysLeft: Math.floor((u.endDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
                            })),
                            followUps: followUpsToday.map((l: any) => ({
                                id: l.id, name: l.name, phone: l.phone, planInterest: l.planInterest
                            })),
                            partialPayments: partialInvoices.map((p: any) => ({
                                id: p.id, memberName: p.member?.name || 'Unknown', amountDue: Number(p.balanceDue), invoiceNumber: p.invoiceNumber
                            })),
                            overdueInvoices: [], // Overdue logic handled by separate overdue block
                            lowStockItems: lowStockProducts.map((p: any) => ({
                                id: p.id, name: p.name, stock: p.stock, category: p.category
                            })),
                            yesterdayCheckIns: yesterdayCheckInsCount,
                            activeMembers: activeMembersCount
                        }) as React.ReactElement
                    })

                    notificationBatch.push({
                        type: 'MONTHLY_SUMMARY',
                        title: 'Daily Briefing Sent',
                        message: `Sent daily briefing email with ${urgentRenewals.length} urgent renewals and ${followUpsToday.length} follow-ups`,
                        userId: gym.userId,
                        gymId: gym.id
                    })
                } catch (e) {
                    console.error('[CRON] Failed to generate Daily Briefing for gym:', gym.slug, e)
                }

                // ── Onboarding / Welcome Sequence Emails ──────────────
                if (gym.isVerified && gym.email) {
                    const daysSinceCreated = Math.floor((now.getTime() - gym.createdAt.getTime()) / (1000 * 60 * 60 * 24))

                    // Day 3 Email
                    if (daysSinceCreated === 3) {
                        emailBatch.push({
                            from: FROM_EMAIL,
                            to: [gym.email],
                            subject: `Your GymMitra check-in poster is ready!`,
                            html: `
                                <h2>Hi ${gym.ownerName?.split(' ')[0] || 'Gym Owner'},</h2>
                                <p>It's been 3 days since you joined GymMitra. How are things going?</p>
                                <p>We wanted to remind you that your members can check in using the self-service page. Have you printed your check-in poster yet?</p>
                                <p>Your check-in URL is: <strong>https://gym.emitra.dev/${gym.slug}/checkin</strong></p>
                                <p>If you'd like a laminated copy of your QR poster delivered to your gym, just reply to this email.</p>
                                <br/>
                                <p>Best regards,<br/>The GymMitra Team</p>
                            `
                        })
                    }

                    // Day 7 Email
                    if (daysSinceCreated === 7) {
                        const membersAdded = await prisma.member.count({
                            where: { gymId: gym.id, createdAt: { gte: gym.createdAt } }
                        })
                        const invoicesAgg = await prisma.invoice.aggregate({
                            where: { gymId: gym.id, createdAt: { gte: gym.createdAt } },
                            _sum: { amountPaid: true }
                        })

                        emailBatch.push({
                            from: FROM_EMAIL,
                            to: [gym.email],
                            subject: `How is ${gym.name}'s first week jumping in?`,
                            html: `
                                <h2>Hi ${gym.ownerName?.split(' ')[0] || 'Gym Owner'},</h2>
                                <p>Congratulations on completing your first week with GymMitra!</p>
                                <p>So far, you've added <strong>${membersAdded}</strong> members and collected <strong>Rs. ${Number(invoicesAgg._sum?.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong> in payments.</p>
                                <p>If you need any help scaling up your usage or have any technical issues, book a quick call with us.</p>
                                <br/>
                                <p>Best,<br/>The GymMitra Team</p>
                            `
                        })
                    }
                }

                // ── Dispatch Batch APIs ───────────────────────────────
                if (emailBatch.length > 0) {
                    const batchResult = await sendBatch(emailBatch)
                    
                    // Process notification persistence for successful sends
                    const successfulNotifs: Prisma.NotificationCreateManyInput[] = []
                    batchResult.results.forEach((result, idx) => {
                        if (result.id && notificationBatch[idx]) {
                            successfulNotifs.push(notificationBatch[idx])
                        } else if (result.error) {
                            results.errors++
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

                // ── Mark gym as processed for today ──────────────────
                await prisma.gymProfile.update({
                    where: { id: gym.id },
                    data: { lastBriefingSentAt: new Date() }
                })
                results.gymsProcessed++

            } catch (gymError) {
                console.error(`[Cron] Failed processing gymId=${gym.id}:`, gymError)
                results.errors++
            }
        }

        console.log(`[Cron] Daily reminders batch completed:`, results)
        return NextResponse.json({ success: true, ...results })
    } catch (error) {
        console.error('[Cron] Fatal error in daily reminders:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
