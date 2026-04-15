import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { render } from '@react-email/render'
import { GymOwnerWelcomeEmail } from '@/components/emails/GymOwnerWelcomeEmail'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import React from 'react'
import { verifyWebhookSecret } from '@/lib/webhook-auth'
import { sendEmail, FROM_EMAIL } from '@/lib/email'

export const dynamic = 'force-dynamic'

// ── Webhook to send Day 0 Welcome Email + Poster ──────────────────
export async function POST(request: NextRequest) {
    try {
        if (!verifyWebhookSecret(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { gymId } = body

        if (!gymId) {
            return NextResponse.json({ error: 'gymId required' }, { status: 400 })
        }


        const gym = await prisma.gymProfile.findUnique({
            where: { id: gymId }
        })

        if (!gym || !gym.email) {
            return NextResponse.json({ error: 'Gym or email not found' }, { status: 404 })
        }

        if (gym.onboardingEmailsSentAt) {
            return NextResponse.json({ success: true, skipped: 'already sent' })
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

        // 3. Send Email via centralized gateway

        const fallbackOwnerName = (gym.ownerName && gym.ownerName.trim().length > 0) ? gym.ownerName.trim().split(' ')[0] : 'Gym Owner'
        
        // Render the email template to HTML string
        const emailHtml = await render(
            React.createElement(GymOwnerWelcomeEmail, {
                ownerName: fallbackOwnerName,
                gymName: gym.name,
                slug: gym.slug || 'demo',
                loginUrl: `${baseUrl}/login`,
                trialExpiresAt: (gym as any).trialExpiresAt || undefined
            })
        );

        // Send via centralized email service
        const emailResult = await sendEmail({
            from: FROM_EMAIL,
            to: gym.email,
            subject: `Welcome to GymMitra, ${fallbackOwnerName}! 🎉`,
            html: emailHtml,
            attachments: [
                {
                    filename: 'GymMitra-Checkin-Poster.pdf',
                    content: pdfBuffer.toString('base64'),
                }
            ]
        });

        if (emailResult.error) {
            console.error('[Webhooks] Gym activation email failed', emailResult.error);
            return NextResponse.json({ error: emailResult.error }, { status: 500 });
        }


        await prisma.gymProfile.update({
            where: { id: gym.id },
            data: { onboardingEmailsSentAt: new Date() }
        })

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('[Webhooks] Gym activation error', e)
        return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 })
    }
}
