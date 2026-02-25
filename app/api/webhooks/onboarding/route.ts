import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { OnboardingEmail } from '@/components/emails/OnboardingEmail';
import { guardRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Extract the originating client IP from the request.
 * Parses X-Forwarded-For (takes leftmost entry) or falls back to a
 * hashed fingerprint of the Authorization header to avoid a single
 * shared "anonymous" bucket.
 */
function getClientIdentifier(req: NextRequest): string {
    // Prefer req.ip when available (Vercel Edge)
    const reqIp = (req as any).ip
    if (reqIp) return reqIp

    const xff = req.headers.get('x-forwarded-for')
    if (xff) {
        const first = xff.split(',')[0].trim()
        if (first) return first
    }

    // Derive a per-caller fingerprint from auth header
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
        const hash = crypto.createHash('sha256').update(authHeader).digest('hex').slice(0, 12)
        return `auth:${hash}`
    }

    return 'anonymous'
}

/**
 * Verify the HMAC signature of the raw request body using
 * the shared webhook secret (constant-time comparison).
 */
function verifyWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
    if (!signatureHeader) return false
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    const sigBuf = Buffer.from(signatureHeader)
    const computedBuf = Buffer.from(computed)
    if (sigBuf.length !== computedBuf.length) return false
    return crypto.timingSafeEqual(sigBuf, computedBuf)
}

export async function POST(req: NextRequest) {
    try {
        // 1. Rate limit by client IP/fingerprint (public endpoint)
        const clientId = getClientIdentifier(req)
        const rl = await guardRateLimit(10, `webhook:onboarding:${clientId}`)
        if (rl) return rl

        // 2. Verify Webhook Secret (Bearer token)
        const authHeader = req.headers.get('Authorization');
        const webhookSecret = process.env.WEBHOOK_SECRET;

        if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
            console.warn(`[Webhook] Invalid auth attempt from ${clientId}`)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 3. Read & verify HMAC signature if present
        const rawBody = await req.text();
        const signature = req.headers.get('x-webhook-signature');
        if (signature && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
            console.warn(`[Webhook] HMAC signature mismatch from ${clientId}`)
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 4. Parse payload
        const payload = JSON.parse(rawBody);
        const { email, ownerName, gymName } = payload;

        if (!email || !ownerName || !gymName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 5. Send onboarding email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gym.emitra.dev'
        const { data, error } = await resend.emails.send({
            from: 'Gym Mitra <hello@mail.emitra.dev>',
            to: [email],
            subject: '🏋️ Welcome to Gym Mitra!',
            react: OnboardingEmail({
                ownerName,
                gymName,
                loginUrl: `${appUrl}/login`,
                serviceAgreementUrl: `${appUrl}/legal/service-agreement`,
            }),
        });

        if (error) {
            console.error('[Webhook] Email send failed:', error);
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ success: true, messageId: data?.id });
    } catch (error) {
        console.error('[Webhook] Onboarding error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
