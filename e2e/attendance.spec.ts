import { test, expect } from './fixtures/auth'

test.describe('Attendance Tracking', () => {
  test('should display attendance page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/attendance')

    await expect(page).toHaveURL(/\/dashboard\/attendance/)
  })

  test('should show check-in interface', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/attendance')

    // Look for check-in controls (phone input, search, etc.)
    const hasCheckIn =
      (await page.locator('input[type="tel"], input[placeholder*="phone"]').count()) > 0 ||
      (await page.locator('text=/check.?in/i').count()) > 0

    expect(hasCheckIn).toBeTruthy()
  })

  test('should display attendance history', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/attendance')

    // Look for attendance records
    await page.waitForTimeout(1000)

    const hasRecords =
      (await page.locator('table, [role="table"]').count()) > 0 ||
      (await page.locator('text=/no records|empty/i').count()) > 0

    expect(hasRecords).toBeTruthy()
  })

  test('should filter attendance by date', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/attendance')

    // Look for date picker
    const datePicker = page.locator('input[type="date"], button:has-text("Date")')

    if (await datePicker.first().isVisible()) {
      await datePicker.first().click()
      await page.waitForTimeout(500)
    }
  })
})
