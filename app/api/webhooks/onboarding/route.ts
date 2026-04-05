import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { OnboardingEmail } from '@/components/emails/OnboardingEmail';
import { render } from '@react-email/render';
import { guardRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { verifyWebhookSignature } from '@/lib/webhook-utils';
import { getBaseUrl } from '@/lib/utils';

const resend = new Resend(process.env.RESEND_API_KEY);

function isTrustedProxy(ip: string): boolean {
    if (ip === '127.0.0.1' || ip === '::1') return true
    const trusted = process.env.TRUSTED_PROXIES?.split(',').map(s => s.trim()) || []
    if (process.env.NODE_ENV === 'production' && trusted.includes('*')) {
        console.warn('CRITICAL: TRUSTED_PROXIES contains "*" in production! Rejecting wildcard.');
        return false;
    }
    return trusted.includes('*') || trusted.includes(ip)
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
        const rl = await guardRateLimit(10, `webhook:onboarding:${clientId}`, false)
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

        // Security check - Only process INSERT or UPDATE events on the auth.users table
        if ((type !== 'INSERT' && type !== 'UPDATE') || !record) {
            return NextResponse.json({ message: 'Ignoring non-auth event' }, { status: 200 });
        }

        if (typeof record.id !== 'string' || !record.id.trim() || typeof record.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
            return NextResponse.json({ error: 'Missing or invalid record.id/record.email' }, { status: 400 });
        }

        // 4. CORE LOGIC: Did they *just* confirm their email (or were they auto-confirmed)?
        let justConfirmed = false;
        if (type === 'INSERT') {
            // For auto-confirmed signups
            justConfirmed = !!record.email_confirmed_at;
        } else {
            // For manual confirmation via link
            justConfirmed = !old_record?.email_confirmed_at && !!record?.email_confirmed_at;
        }

        if (!justConfirmed) {
            return NextResponse.json({ message: 'Email not freshly confirmed. Skipping email delivery.' }, { status: 200 });
        }

        // 5. HYBRID GYM LOOKUP: Owner vs Staff
        // First try finding as Owner (Direct GymProfile)
        let gymProfile = await prisma.gymProfile.findUnique({
            where: { userId: record.id }
        });

        // Fallback: Check if they are a Staff Member
        if (!gymProfile) {
            const staffMember = await prisma.staffMember.findFirst({
                where: { userId: record.id },
                orderBy: { createdAt: 'asc' },
                include: { gym: true }
            });
            if (staffMember?.gym) {
                gymProfile = staffMember.gym;
            }
        }

        if (!gymProfile) {
            console.log(`[Webhook] No GymProfile yet for user ${record.id} — user likely hasn't completed onboarding. Skipping.`);
            return NextResponse.json({ message: 'No gym profile yet — email will be sent after onboarding' }, { status: 200 });
        }

        const ownerEmail = record.email;
        const ownerName = record.raw_user_meta_data?.name || gymProfile.name || 'User'; // Generic 'User' if name missing
        const gymName = gymProfile.businessName || gymProfile.name || 'your local gym';

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || getBaseUrl()

        console.log(`[Webhook] Event: ${type} | User: ${ownerEmail} | Gym: ${gymName} | Sending Welcome...`);

        // 6. Send Welcome Email using Resend
        try {
            const emailHtml = await render(OnboardingEmail({
                ownerName,
                gymName,
                loginUrl: gymProfile.slug ? `${baseUrl}/${gymProfile.slug}/dashboard` : `${baseUrl}/login`,
                serviceAgreementUrl: `${baseUrl}/terms`,
                saasPlan: (gymProfile as any).saasPlan || 'BASIC',
                trialExpiresAt: gymProfile.trialExpiresAt || undefined,
            }));

            const { data, error } = await resend.emails.send({
                from: 'GymMitra <hello@mail.emitra.dev>',
                to: [ownerEmail],
                subject: `Welcome to GymMitra, ${ownerName}! 🎉`,
                html: emailHtml,
            });

            if (error) {
                console.error('[Resend Error]:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: 'Welcome email sent', data });
        } catch (resendErr) {
            console.error('[Webhook] Resend Runtime Exception:', resendErr);
            return NextResponse.json({ error: 'Email service failed' }, { status: 503 });
        }
    } catch (error) {
        console.error('[Webhook] Global processing error:', error);
        return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
    }
}
