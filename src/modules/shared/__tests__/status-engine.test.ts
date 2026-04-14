/**
 * Tier 1 — Pure Function Tests: status-engine.ts
 * TDD: Tests verify BEHAVIOR through public interface.
 * No mocks needed — getMemberStatus is a pure function.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { getMemberStatus } from '../status-engine'
import { addDays, subDays } from 'date-fns'

afterEach(() => {
  vi.useRealTimers()
})

describe('getMemberStatus', () => {
  it('returns INACTIVE when member has no expiry date', () => {
    const status = getMemberStatus({ expiryDate: null, lastCheckIn: null })
    expect(status).toBe('INACTIVE')
  })

  it('returns ACTIVE when subscription expires 30 days from now', () => {
    const status = getMemberStatus({
      expiryDate: addDays(new Date(), 30),
      lastCheckIn: null,
    })
    expect(status).toBe('ACTIVE')
  })

  it('returns EXPIRING_SOON when subscription expires in 3 days', () => {
    const status = getMemberStatus({
      expiryDate: addDays(new Date(), 3),
      lastCheckIn: null,
    })
    expect(status).toBe('EXPIRING_SOON')
  })

  it('returns EXPIRING_SOON when subscription expires exactly today', () => {
    // Today's expiry = member can still use gym today → EXPIRING_SOON not EXPIRED
    const status = getMemberStatus({
      expiryDate: new Date(),
      lastCheckIn: null,
    })
    expect(status).toBe('EXPIRING_SOON')
  })

  it('returns EXPIRED when subscription ended yesterday', () => {
    const status = getMemberStatus({
      expiryDate: subDays(new Date(), 1),
      lastCheckIn: null,
    })
    expect(status).toBe('EXPIRED')
  })

  it('returns EXPIRED when subscription ended 6 months ago', () => {
    const status = getMemberStatus({
      expiryDate: subDays(new Date(), 180),
      lastCheckIn: null,
    })
    expect(status).toBe('EXPIRED')
  })

  it('boundary: exactly 7 days from now → EXPIRING_SOON', () => {
    const status = getMemberStatus({
      expiryDate: addDays(new Date(), 7),
      lastCheckIn: null,
    })
    expect(status).toBe('EXPIRING_SOON')
  })

  it('boundary: 8 days from now → ACTIVE', () => {
    const status = getMemberStatus({
      expiryDate: addDays(new Date(), 8),
      lastCheckIn: null,
    })
    expect(status).toBe('ACTIVE')
  })
})
