import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

export default async function TestEmailPage() {
    let status = 'Sending...'
    let result: any = null

    try {
        const resendKey = process.env.RESEND_API_KEY
        if (!resendKey) {
            throw new Error('RESEND_API_KEY not configured')
        }

        const resend = new Resend(resendKey)
        const ADMIN_EMAILS = ['nikhilpal525@gmail.com', 'nishchaygupta54@gmail.com']
        const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

        result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Gym Mitra <Admin@mail.emitra.dev>',
            to: ADMIN_EMAILS,
            subject: `🧪 Test Email — Admin Notification (${now})`,
            html: `
                <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
                    <h2 style="font-size: 20px;">🧪 Admin Email Test</h2>
                    <p>This is a test email triggered from the /test-email page.</p>
                </div>
            `,
        })

        status = 'Email sent successfully!'
    } catch (err: any) {
        status = 'Failed to send email'
        result = err.message
    }

    const logPath = path.join(process.cwd(), 'email-result.txt')
    fs.writeFileSync(logPath, JSON.stringify({ status, result }, null, 2))

    return (
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
            <h2>Test Email Status</h2>
            <p><strong>Status:</strong> {status}</p>
            <pre style={{ background: '#f4f4f4', padding: 20, marginTop: 20 }}>
                {JSON.stringify(result, null, 2)}
            </pre>
        </div>
    )
}
