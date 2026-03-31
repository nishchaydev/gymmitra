import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// This acts as a regular scheduled endpoint for Vercel Cron.
export const revalidate = 0;

export async function GET(req: Request) {
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
        const authHeader = req.headers.get('authorization') || '';
        const expected = `Bearer ${cronSecret}`;

        // Constant-time comparison — same pattern as daily-reminders cron
        const hmacHeader = crypto.createHmac('sha256', cronSecret).update(authHeader).digest();
        const hmacExpected = crypto.createHmac('sha256', cronSecret).update(expected).digest();

        if (!crypto.timingSafeEqual(hmacHeader, hmacExpected)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        await prisma.$queryRaw`SELECT 1 as keepalive`;
        return NextResponse.json({ success: true, message: 'Database pinged successfully.' });
    } catch (error) {
        console.error('Failed to ping database for keepalive:', error);
        return NextResponse.json({ success: false, error: 'Database ping failed' }, { status: 500 });
    }
}
