import crypto from 'crypto';

/**
 * Shared utility to verify webhook signatures using timing-safe comparisons.
 * Every webhook handler under /api/webhooks/* MUST call this to ensure secure origins.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
    if (!signatureHeader || !secret) return false;
    try {
        const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        const sigBuf = Buffer.from(signatureHeader);
        const computedBuf = Buffer.from(computed);

        if (sigBuf.length !== computedBuf.length) return false;

        return crypto.timingSafeEqual(sigBuf, computedBuf);
    } catch (e) {
        return false;
    }
}
