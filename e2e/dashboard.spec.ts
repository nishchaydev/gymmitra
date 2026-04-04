import { test, expect } from './fixtures/auth'

test.describe('Dashboard', () => {
  test('should display dashboard after login', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/)

    // Check for common dashboard elements
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('should navigate to members page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    // Navigate to members
    await page.click('a[href*="/dashboard/members"], text="Members"')
    await expect(page).toHaveURL(/\/dashboard\/members/)
  })

  test('should navigate to subscriptions page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    // Navigate to subscriptions
    await page.click('a[href*="/dashboard/subscriptions"], text="Subscriptions"')
    await expect(page).toHaveURL(/\/dashboard\/subscriptions/)
  })

  test('should navigate to billing page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    // Navigate to billing
    await page.click('a[href*="/dashboard/billing"], text=/billing|invoice/i')
    await expect(page).toHaveURL(/\/dashboard\/billing/)
  })

  test('should navigate to attendance page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    // Navigate to attendance
    await page.click('a[href*="/dashboard/attendance"], text="Attendance"')
    await expect(page).toHaveURL(/\/dashboard\/attendance/)
  })

  test('should navigate to products/POS page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    // Navigate to products
    await page.click('a[href*="/dashboard/products"], text=/products|pos|inventory/i')
    await expect(page).toHaveURL(/\/dashboard\/products/)
  })

  test('should navigate to settings page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    // Navigate to settings
    await page.click('a[href*="/dashboard/settings"], text="Settings"')
    await expect(page).toHaveURL(/\/dashboard\/settings/)
  })
})
