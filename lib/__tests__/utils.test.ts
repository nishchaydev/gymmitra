import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, getBaseUrl } from '@/lib/utils'

describe('cn (className merger)', () => {
  it('merges classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'text-lg')).toBe('base text-lg')
  })

  it('returns empty string for no input', () => {
    expect(cn()).toBe('')
  })
})

describe('getBaseUrl', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.stubGlobal('window', undefined)
    // Clear all relevant env vars
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.VERCEL
    delete process.env.VERCEL_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env = { ...originalEnv }
  })

  it('returns NEXT_PUBLIC_APP_URL when set without trailing slash', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://gym.example.com'
    expect(getBaseUrl()).toBe('https://gym.example.com')
  })

  it('strips trailing slash from NEXT_PUBLIC_APP_URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://gym.example.com/'
    expect(getBaseUrl()).toBe('https://gym.example.com')
  })

  it('returns VERCEL_PROJECT_PRODUCTION_URL when no APP_URL, stripping protocol/slashes', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'https://gym-mitra.vercel.app/'
    expect(getBaseUrl()).toBe('https://gym-mitra.vercel.app')
  })

  it('returns VERCEL_URL as fallback, stripping protocol/slashes', () => {
    process.env.VERCEL_URL = 'http://gym-mitra-123.vercel.app/'
    expect(getBaseUrl()).toBe('https://gym-mitra-123.vercel.app')
  })

  it('returns hardcoded fallback when no env vars set', () => {
    expect(getBaseUrl()).toBe('https://gym.emitra.dev')
  })

  it('prefers production URL over VERCEL_URL when APP_URL is localhost on Vercel', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.VERCEL = '1'
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'gym-mitra.vercel.app'
    expect(getBaseUrl()).toBe('https://gym-mitra.vercel.app')
  })

  it('prefers NEXT_PUBLIC_APP_URL over development check when both are present', () => {
    vi.stubEnv('NODE_ENV', 'development')
    process.env.NEXT_PUBLIC_APP_URL = 'https://gym.custom-domain.com'
    expect(getBaseUrl()).toBe('https://gym.custom-domain.com')
  })
})
