import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PROD = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: SENTRY_DSN,

  // Only run Sentry if a DSN is provided and we are in production (or explicitly testing Sentry)
  enabled: !!SENTRY_DSN && (IS_PROD || process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true'),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // Adjust tracesSampleRate: 10% in production, 100% in development for testing
  tracesSampleRate: IS_PROD ? 0.1 : 1.0,

  // Session Replay - Capture context around errors to help with debugging.
  // We sample 0% of regular sessions by default, but 100% of sessions with errors.
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
})
