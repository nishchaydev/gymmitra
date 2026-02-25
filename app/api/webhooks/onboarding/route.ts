import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { OnboardingEmail } from '@/components/emails/OnboardingEmail';
import { prisma } from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Webhook Secret
        const authHeader = req.headers.get('Authorization');
        const webhookSecret = process.env.WEBHOOK_SECRET;

        if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Payload from Supabase `auth.users` UPDATE trigger
        const payload = await req.json();
        const { type, record, old_record } = payload;

        // Security check - Only process UPDATE events on the auth.users table
        if (type !== 'UPDATE' || !record) {
            return NextResponse.json({ message: 'Ignoring non-update event' }, { status: 200 });
        }

        // 3. CORE LOGIC: Did they *just* confirm their email?
        // We check if `email_confirmed_at` was empty in the old record, but now has a timestamp in the new record.
        const justConfirmed = !old_record?.email_confirmed_at && !!record?.email_confirmed_at;

        if (!justConfirmed) {
            // It was just another profile update, not the initial email confirmation. We skip.
            return NextResponse.json({ message: 'Email not freshly confirmed. Skipping email delivery.' }, { status: 200 });
        }

        // 4. Fetch the Gym Profile to get their Name and SaaS Plan
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
        const saasPlan = gymProfile.saasPlan; // BASIC, GROWTH, or ENTERPRISE

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gym.emitra.dev';

        console.log(`Email confirmed! Sending Welcome + Plan [${saasPlan}] to ${ownerEmail}...`);

        // 5. Send Welcome Email using Resend
        const { data, error } = await resend.emails.send({
            from: 'Gym Mitra ERP <hello@mail.emitra.dev>', // MUST use the verified domain
            to: [ownerEmail],
            subject: `Welcome to Gym Mitra ERP -> Your ${saasPlan} Plan is Ready!`,
            react: OnboardingEmail({
                ownerName,
                gymName,
                loginUrl: `${baseUrl}/login`,
                serviceAgreementUrl: `${baseUrl}/legal/service-agreement`,
                saasPlan,
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
