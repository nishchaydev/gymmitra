import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withPWA from "@ducanh2912/next-pwa";

const pwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  cacheOnFrontEndNav: true,
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com ${process.env.NODE_ENV !== 'production' ? "'unsafe-eval' localhost:*" : ''}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://va.vercel-scripts.com https://*.upstash.io ${process.env.NODE_ENV !== 'production' ? "ws://localhost:* http://localhost:*" : ''}`,
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              process.env.NODE_ENV === 'production' ? "report-uri /api/csp-report" : "",
            ].filter(Boolean).join('; ')
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/register",
        destination: "/login?view=register",
      },
    ];
  },
};

export default withSentryConfig(pwa(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "emitra-technologies",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
