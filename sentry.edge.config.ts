import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PROD = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: SENTRY_DSN,

  // Only run Sentry in production with a valid DSN
  enabled: IS_PROD && !!SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: IS_PROD ? 0.1 : 1.0,
})
