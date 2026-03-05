import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

    // Create CSP header
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
        style-src 'self' 'nonce-${nonce}';
        img-src 'self' blob: data: https:;
        font-src 'self';
        connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://sentry.io;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
        report-uri /api/csp-report;
    `.replace(/\s{2,}/g, ' ').trim()

    // Clone headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)
    // Removed requestHeaders.set('Content-Security-Policy', cspHeader) because updateSession doesn't use it natively within supabase client logic unless implicitly required by backend handlers fetching cookies, avoiding redundant header bloat.

    const response = await updateSession(request, requestHeaders)

    // Ensure the CSP is passed back to the client
    response.headers.set('Content-Security-Policy', cspHeader)

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
