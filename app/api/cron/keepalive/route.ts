import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This acts as a regular scheduled endpoint for Vercel Cron.
// Ensure it stays fast and uses minimal resources.
export const revalidate = 0; // Don't cache cron job execution

export async function GET(req: Request) {
    // Only allow Vercel's Cron request to hit this route directly
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    // In local development or if checking without CRON_SECRET, allow bypass for testing purposes
    // But in production you ideally enforce this. For simplicity we'll check it if it exists.
    if (process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        if (authHeader !== expectedAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        // A minimal, lightweight query to keep the Supabase database connection active 
        // to prevent tier pausing.
        await prisma.$queryRaw`SELECT 1 as keepalive`;

        return NextResponse.json({ success: true, message: "Database pinged successfully." });
    } catch (error) {
        console.error("Failed to ping database for keepalive:", error);
        return NextResponse.json({ success: false, error: "Database ping failed" }, { status: 500 });
    }
}
