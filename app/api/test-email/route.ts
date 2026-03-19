import { NextResponse } from 'next/server'

/**
 * Temporary test endpoint — DELETE after verifying email works.
 * GET /api/test-email
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
        return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
    }

    try {
        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)

        const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || '')
            .split(',')
            .map(email => email.trim())
            .filter(Boolean) as string[]
        const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

        const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'GymMitra <adminnotification@mail.emitra.dev>',
            to: ADMIN_EMAILS,
            subject: `🧪 Test Email — Admin Notification (${now})`,
            html: `
                <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
                    <h2 style="font-size: 20px; margin-bottom: 16px;">🧪 Admin Email Test</h2>
                    <p>This is a test email to verify the admin notification system is working.</p>
                    <table style="border-collapse: collapse; width: 100%; font-size: 14px; margin-top: 16px;">
                        <tr><td style="padding: 6px 12px; color: #64748b;">Sent At</td><td style="padding: 6px 12px; font-weight: 600;">${now}</td></tr>
                        <tr style="background: #f8fafc;"><td style="padding: 6px 12px; color: #64748b;">Recipients</td><td style="padding: 6px 12px; font-weight: 600;">${ADMIN_EMAILS.join(', ')}</td></tr>
                        <tr><td style="padding: 6px 12px; color: #64748b;">From</td><td style="padding: 6px 12px; font-weight: 600;">${process.env.RESEND_FROM_EMAIL || 'GymMitra <hello@mail.emitra.dev>'}</td></tr>
                        <tr style="background: #f8fafc;"><td style="padding: 6px 12px; color: #64748b;">Status</td><td style="padding: 6px 12px; font-weight: 600; color: green;">✅ Delivered</td></tr>
                    </table>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #94a3b8; font-size: 12px;">GymMitra Admin Test — You can delete /api/test-email after verification.</p>
                </div>
            `,
        })

        return NextResponse.json({ success: true, result })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 })
    }
}
