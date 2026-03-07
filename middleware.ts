import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

    const isDev = process.env.NODE_ENV === 'development';
    const scriptSrc = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""}`;

    // Create CSP header
    const cspHeader = `
        default-src 'self';
        ${scriptSrc};
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://sentry.io;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
        report-uri /api/csp-report;
        report-to csp-endpoint;
    `.replace(/\s{2,}/g, ' ').trim()

    // Clone headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)
    // Removed requestHeaders.set('Content-Security-Policy', cspHeader) because updateSession doesn't use it natively within supabase client logic unless implicitly required by backend handlers fetching cookies, avoiding redundant header bloat.

    const response = await updateSession(request, requestHeaders)

    // Ensure the CSP is passed back to the client
    response.headers.set('Content-Security-Policy', cspHeader)
    // report-to requires the Reporting-Endpoints header so browsers know where to POST
    response.headers.set('Reporting-Endpoints', 'csp-endpoint="/api/csp-report"')

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.webmanifest (PWA manifest)
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
