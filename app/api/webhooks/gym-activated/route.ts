import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import React from 'react'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function timingSafeEqual(a: string, b: string) {
    if (!a || !b) return false;
    try {
        const bufA = Buffer.from(a);
        const bufB = Buffer.from(b);
        if (bufA.length !== bufB.length) return false;
        return crypto.timingSafeEqual(bufA, bufB);
    } catch {
        return false;
    }
}

const FROM_EMAIL = 'Gym Mitra ERP <hello@mail.emitra.dev>'

// ── Webhook to send Day 0 Welcome Email + Poster ──────────────────
export async function POST(request: NextRequest) {
    try {
        // Internal webhook protection logic moved BEFORE body parse
        const secret = request.headers.get('x-webhook-secret')
        if (!timingSafeEqual(secret || '', process.env.CRON_SECRET || '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { gymId } = body

        if (!gymId) {
            return NextResponse.json({ error: 'gymId required' }, { status: 400 })
        }

        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/9fabe3c7-5a18-4ee1-8658-5542d056de00', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': '69a8f3'
            },
            body: JSON.stringify({
                sessionId: '69a8f3',
                runId: 'pre-fix',
                hypothesisId: 'H2-gym-activated-email',
                location: 'app/api/webhooks/gym-activated/route.ts:POST:entry',
                message: 'Gym activated webhook received',
                data: { gymId },
                timestamp: Date.now()
            })
        }).catch(() => { })
        // #endregion agent log

        const gym = await prisma.gymProfile.findUnique({
            where: { id: gymId }
        })

        if (!gym || !gym.email) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/9fabe3c7-5a18-4ee1-8658-5542d056de00', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '69a8f3'
                },
                body: JSON.stringify({
                    sessionId: '69a8f3',
                    runId: 'pre-fix',
                    hypothesisId: 'H2-gym-activated-email',
                    location: 'app/api/webhooks/gym-activated/route.ts:POST:gym-missing',
                    message: 'Gym missing or has no email',
                    data: { gymId, hasGym: !!gym, email: gym?.email ?? null },
                    timestamp: Date.now()
                })
            }).catch(() => { })
            // #endregion agent log

            return NextResponse.json({ error: 'Gym or email not found' }, { status: 404 })
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.emitra.dev'
        const checkinUrl = `${baseUrl}/${gym.slug}/checkin`

        // 1. Generate QR Code image (data URI)
        const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
            width: 800,
            margin: 2,
            color: {
                dark: '#0f172a',
                light: '#ffffff'
            }
        })

        // 2. Generate PDF using jsPDF (A4 portrait)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        // Background
        doc.setFillColor(248, 250, 252) // #f8fafc
        doc.rect(0, 0, 210, 297, 'F')

        // Title
        doc.setTextColor(15, 23, 42) // #0f172a
        doc.setFontSize(28)
        doc.setFont('helvetica', 'bold')
        doc.text('MEMBER CHECK-IN', 105, 40, { align: 'center' })

        // Gym Name
        doc.setTextColor(14, 165, 233) // #0ea5e9
        doc.setFontSize(24)
        doc.text(gym.name, 105, 55, { align: 'center' })

        // Instruction
        doc.setTextColor(71, 85, 105) // #475569
        doc.setFontSize(16)
        doc.setFont('helvetica', 'normal')
        doc.text('Scan the QR code below to mark your attendance', 105, 75, { align: 'center' })

        // Add QR Code Image
        doc.addImage(qrDataUrl, 'PNG', 55, 90, 100, 100)

        // Bottom text
        doc.setFontSize(18)
        doc.setTextColor(15, 23, 42)
        doc.setFont('helvetica', 'bold')
        doc.text('Enter your phone number to check in', 105, 210, { align: 'center' })

        // Branding
        doc.setFontSize(12)
        doc.setTextColor(148, 163, 184)
        doc.setFont('helvetica', 'normal')
        doc.text('Powered by GymMitra', 105, 280, { align: 'center' })

        // Convert PDF to Buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

        // 3. Send Email with Resend
        const resendKey = process.env.RESEND_API_KEY
        if (!resendKey) {
            return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 })
        }
        const resend = new Resend(resendKey)

        const Component = (await import('@/components/emails/GymOwnerWelcomeEmail')).GymOwnerWelcomeEmail

        // Dynamically imported React structure
        const fallbackOwnerName = (gym.ownerName && gym.ownerName.trim().length > 0) ? gym.ownerName.trim().split(' ')[0] : 'Gym Owner'
        const reactElement = React.createElement(Component, {
            ownerName: fallbackOwnerName,
            gymName: gym.name,
            slug: gym.slug || 'demo',
            loginUrl: `${baseUrl}/login`
        }) as React.ReactElement

        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: gym.email,
            subject: `Welcome to GymMitra, ${fallbackOwnerName}! 🎉`,
            react: reactElement,
            attachments: [
                {
                    filename: 'GymMitra-Checkin-Poster.pdf',
                    content: pdfBuffer,
                }
            ]
        })

        if (error) {
            console.error('[Webhooks] Gym activation email failed', error)

            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/9fabe3c7-5a18-4ee1-8658-5542d056de00', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '69a8f3'
                },
                body: JSON.stringify({
                    sessionId: '69a8f3',
                    runId: 'pre-fix',
                    hypothesisId: 'H2-gym-activated-email',
                    location: 'app/api/webhooks/gym-activated/route.ts:POST:resend-error',
                    message: 'Resend email API returned error',
                    data: { gymId, errorMessage: error.message },
                    timestamp: Date.now()
                })
            }).catch(() => { })
            // #endregion agent log

            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/9fabe3c7-5a18-4ee1-8658-5542d056de00', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': '69a8f3'
            },
            body: JSON.stringify({
                sessionId: '69a8f3',
                runId: 'pre-fix',
                hypothesisId: 'H2-gym-activated-email',
                location: 'app/api/webhooks/gym-activated/route.ts:POST:success',
                message: 'Gym activation email sent successfully',
                data: { gymId, email: gym.email },
                timestamp: Date.now()
            })
        }).catch(() => { })
        // #endregion agent log

        // Temporarily commented out as onboardingEmailsSentAt doesn't exist in Prisma schema
        // await prisma.gymProfile.update({
        //     where: { id: gym.id },
        //     data: { onboardingEmailsSentAt: new Date() }
        // })

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('[Webhooks] Gym activation error', e)
        return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 })
    }
}
