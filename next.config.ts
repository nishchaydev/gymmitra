import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-javascript/blob/master/packages/nextjs/src/config/types.ts

  // Can be used to configure automatic source map uploads
  org: "gym-mitra",
  project: "gym-mitra-erp",

  // An auth token is required for uploading source maps.
  // authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: true, // Suppresses all logs
});
