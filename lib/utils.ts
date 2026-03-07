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
    const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
    // If we are on a real domain (not localhost) but env says localhost, follow reality
    if (envUrl && envUrl.includes('localhost') && !window.location.hostname.includes('localhost')) {
      return window.location.origin
    }
    // If we are on localhost but env is set to a real domain, follow reality
    if (envUrl && !envUrl.includes('localhost') && window.location.hostname.includes('localhost')) {
      return window.location.origin
    }
    return envUrl || window.location.origin
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    // Don't return localhost if we're in Vercel environment
    if (url.includes('localhost') && (process.env.VERCEL || process.env.VERCEL_URL)) {
      if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      }
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`
      }
    }
    return url
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'https://gym.emitra.dev'
}
