import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the canonical app base URL.
 * Uses NEXT_PUBLIC_APP_URL env var (set to your custom domain) so
 * shared links always point to your domain, not gymmitra.vercel.app.
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "");
  const vUrl = process.env.VERCEL_URL?.replace(/\/$/, "");
  const isProd = process.env.NODE_ENV === "production";

  // 1. If we are in production and appUrl is localhost, we shouldn't use it
  if (isProd && appUrl?.includes("localhost")) {
    // Fall through
  } else if (appUrl) {
    return appUrl;
  }

  // 2. Vercel deployment detection - use provided production URL if available
  if (prodUrl) {
    return `https://${prodUrl.replace(/^https?:\/\//, "")}`;
  }

  // 3. Fallback to VERCEL_URL (usually for preview deployments)
  if (vUrl) {
    return `https://${vUrl.replace(/^https?:\/\//, "")}`;
  }

  if (process.env.NODE_ENV === "development") {
    return `http://localhost:${process.env.PORT || 3000}`;
  }

  // 4. Default fallback for this project
  return "https://gym.emitra.dev";
}

