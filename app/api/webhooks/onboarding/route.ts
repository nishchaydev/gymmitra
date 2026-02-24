import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { OnboardingEmail } from '@/components/emails/OnboardingEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Webhook Secret
        const authHeader = req.headers.get('Authorization');
        const webhookSecret = process.env.WEBHOOK_SECRET;

        if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Payload from Supabase
        // Supabase sends the entire inserted row as `record` for INSERT webhooks
        const payload = await req.json();
        const { record } = payload;

        if (!record || !record.email) {
            return NextResponse.json({ error: 'Invalid payload - missing email' }, { status: 400 });
        }

        // Extract relevant data, handling both potential table sources (auth.users vs public.GymProfile)
        const ownerEmail = record.email;
        const ownerName = record.name || 'Gym Owner';
        const gymName = record.businessName || record.name || 'your new gym';

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gym.emitra.dev';

        console.log(`Sending onboarding email to ${ownerEmail}...`);

        // 3. Send Email using Resend
        const { data, error } = await resend.emails.send({
            from: 'Gym Mitra ERP <hello@mail.emitra.dev>', // MUST use the verified domain
            to: [ownerEmail],
            subject: 'Welcome to Gym Mitra ERP -> Next Steps Inside!',
            react: OnboardingEmail({
                ownerName,
                gymName,
                loginUrl: `${baseUrl}/login`,
                serviceAgreementUrl: `${baseUrl}/legal/service-agreement`,
            }),
        });

        if (error) {
            console.error('Resend Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
