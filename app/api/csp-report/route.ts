import { NextResponse } from 'next/server';

const MAX_BODY_BYTES = 8_192; // 8 KB upper bound for a CSP report

/**
 * Handle Content Security Policy violation reports.
 * Validates shape, sanitizes PII, and logs structured fields only.
 */
export async function POST(request: Request) {
    // 1. Reject wrong content-types early
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json') && !contentType.includes('application/csp-report')) {
        return new NextResponse('Unsupported Media Type', { status: 415 })
    }

    // 2. Guard against oversized bodies
    const contentLength = Number(request.headers.get('content-length') ?? '0')
    if (contentLength > MAX_BODY_BYTES) {
        return new NextResponse('Payload Too Large', { status: 413 })
    }

    try {
        const body = await request.json()

        // 3. Validate expected shape — browsers send either { "csp-report": {...} } or the raw object
        const raw: Record<string, string> = body?.['csp-report'] ?? body ?? {}
        if (!raw['violated-directive'] && !raw['document-uri']) {
            return new NextResponse('Bad Request', { status: 400 })
        }

        // 4. Extract only the safe, non-PII fields
        const violatedDirective = raw['violated-directive'] ?? raw['effective-directive'] ?? 'unknown'
        const rawBlockedUri = raw['blocked-uri'] ?? ''
        // Strip path, query string, and fragment — keep only scheme + hostname
        let blockedHost = 'unknown'
        try {
            blockedHost = rawBlockedUri ? new URL(rawBlockedUri).hostname : 'inline'
        } catch {
            blockedHost = rawBlockedUri.split('/')[0] || 'unknown'
        }

        const logPayload = {
            violatedDirective,
            blockedHost,
            disposition: raw['disposition'] ?? 'enforce',
            documentUri: raw['document-uri'] ? new URL(raw['document-uri']).pathname : 'unknown',
        }

        // 5. Level-appropriate logging
        if (process.env.NODE_ENV === 'production') {
            console.info('[CSP]', JSON.stringify(logPayload))
        } else {
            console.warn('[CSP violation]', logPayload)
        }

        return new NextResponse(null, { status: 204 })
    } catch {
        return new NextResponse('Bad Request', { status: 400 })
    }
}
