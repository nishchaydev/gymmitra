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

  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:${process.env.PORT || 3000}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  const vUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vUrl) {
    return `https://${vUrl.replace(/^https?:\/\//, '')}`;
  }

  return 'https://gym.emitra.dev';
}
