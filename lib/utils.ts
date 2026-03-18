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
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const isVercel = process.env.VERCEL === "1";
  const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "");
  const vUrl = process.env.VERCEL_URL?.replace(/\/$/, "");

  // If on Vercel and APP_URL is localhost, prefer the production URL
  if (isVercel && prodUrl && appUrl?.includes("localhost")) {
    return `https://${prodUrl.replace(/^https?:\/\//, "")}`;
  }

  if (appUrl) {
    return appUrl;
  }

  if (process.env.NODE_ENV === "development") {
    return `http://localhost:${process.env.PORT || 3000}`;
  }

  const fallbackUrl = prodUrl || vUrl;
  if (fallbackUrl) {
    return `https://${fallbackUrl.replace(/^https?:\/\//, "")}`;
  }

  return "https://gym.emitra.dev";
}

