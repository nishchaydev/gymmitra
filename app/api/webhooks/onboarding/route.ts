import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { OnboardingEmail } from '@/components/emails/OnboardingEmail';
import { guardRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { verifyWebhookSignature } from '@/lib/webhook-utils';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

function isTrustedProxy(ip: string): boolean {
    if (ip === '127.0.0.1' || ip === '::1') return true
    const trusted = process.env.TRUSTED_PROXIES?.split(',').map(s => s.trim()) || []
    return trusted.includes(ip)
}

function getClientIdentifier(req: NextRequest): string {
    const reqIp = (req as any).ip || req.headers.get('x-real-ip')
    if (reqIp && isTrustedProxy(reqIp)) {
        const xff = req.headers.get('x-forwarded-for')
        if (xff && xff.trim() !== '') {
            const first = xff.split(',')[0].trim()
            if (first) return first
        }
        console.warn(`[Webhook] Missing or empty X-Forwarded-For from trusted proxy ${reqIp}`);
        return `proxy:${reqIp}`;
    }
    if (reqIp) return reqIp

    const authHeader = req.headers.get('authorization')
    if (authHeader) {
        const hash = crypto.createHash('sha256').update(authHeader).digest('hex').slice(0, 12)
        return `auth:${hash}`
    }
    return 'anonymous'
}

export async function POST(req: NextRequest) {
    try {
        // 1. Rate limit by client IP/fingerprint to prevent email abuse
        const clientId = getClientIdentifier(req)
        const rl = await guardRateLimit(10, `webhook:onboarding:${clientId}`)
        if (rl) return rl

        // 2. We support two forms of Auth: Bearer token (internal cron) or HMAC signature (Supabase Webhooks)
        const authHeader = req.headers.get('Authorization');
        const webhookSecret = process.env.WEBHOOK_SECRET;
        const signature = req.headers.get('x-supabase-signature') || req.headers.get('x-webhook-signature');

        if (!webhookSecret) {
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
        }

        const rawBody = await req.text();

        // Check if either the Bearer token matches OR the HMAC signature matches
        let isBearerValid = false;
        if (authHeader) {
            const expectedDigest = crypto.createHash('sha256').update(`Bearer ${webhookSecret}`).digest();
            const actualDigest = crypto.createHash('sha256').update(authHeader).digest();
            if (expectedDigest.length === actualDigest.length) {
                isBearerValid = crypto.timingSafeEqual(expectedDigest, actualDigest);
            }
        }

        const isHmacValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

        if (!isBearerValid && !isHmacValid) {
            console.warn(`[Webhook] Invalid auth attempt from ${clientId}`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 3. Parse Payload from Supabase `auth.users` UPDATE trigger
        let payload;
        try {
            payload = JSON.parse(rawBody);
        } catch (err: any) {
            return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
        }

        const { type, record, old_record } = payload;

        // Security check - Only process UPDATE events on the auth.users table
        if (type !== 'UPDATE' || !record) {
            return NextResponse.json({ message: 'Ignoring non-update event' }, { status: 200 });
        }

        if (typeof record.id !== 'string' || !record.id.trim() || typeof record.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
            return NextResponse.json({ error: 'Missing or invalid record.id/record.email' }, { status: 400 });
        }

        // 4. CORE LOGIC: Did they *just* confirm their email?
        const justConfirmed = !old_record?.email_confirmed_at && !!record?.email_confirmed_at;

        if (!justConfirmed) {
            return NextResponse.json({ message: 'Email not freshly confirmed. Skipping email delivery.' }, { status: 200 });
        }

        // 5. Fetch the Gym Profile to get their Name and SaaS Plan
        const gymProfile = await prisma.gymProfile.findUnique({
            where: { userId: record.id }
        });

        if (!gymProfile) {
            console.error(`Webhook Error: GymProfile not found for user ${record.id}`);
            return NextResponse.json({ error: 'Profile sync error' }, { status: 400 });
        }

        const ownerEmail = record.email;
        const ownerName = gymProfile.name || 'Gym Owner';
        const gymName = gymProfile.businessName || gymProfile.name || 'your new gym';

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gym.emitra.dev';

        console.log(`Email confirmed! Sending Welcome to ${ownerEmail}...`);

        // 6. Send Welcome Email using Resend
        const { data, error } = await resend.emails.send({
            from: 'Gym Mitra ERP <hello@mail.emitra.dev>',
            to: [ownerEmail],
            subject: `Welcome to Gym Mitra ERP!`,
            react: OnboardingEmail({
                ownerName,
                gymName,
                loginUrl: `${baseUrl}/login`,
                serviceAgreementUrl: `${baseUrl}/legal/service-agreement`,
                saasPlan: (gymProfile as any).saasPlan || 'BASIC',
            }),
        });

        if (error) {
            console.error('Resend Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
    }
}
