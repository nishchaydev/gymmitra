import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

const getTracesSampleRate = () => {
    const rawValue = process.env.SENTRY_TRACES_SAMPLE_RATE;
    const parsed = parseFloat(rawValue || "0.1");
    return isNaN(parsed) ? 0.1 : Math.max(0, Math.min(1, parsed));
};

if (SENTRY_DSN) {
    Sentry.init({
        // Performance Monitoring
        dsn: SENTRY_DSN,
        tracesSampleRate: getTracesSampleRate(),
        // Environment and Release
        environment: process.env.NODE_ENV || 'development',
        release: process.env.SENTRY_RELEASE,
    });
} else {
    console.debug("Sentry initialization skipped: SENTRY_DSN not provided.");
}
