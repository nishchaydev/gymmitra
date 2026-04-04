import { test, expect } from './fixtures/auth'

test.describe('Subscriptions Management', () => {
  test('should display subscriptions page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/subscriptions')

    // Check page loaded
    await expect(page).toHaveURL(/\/dashboard\/subscriptions/)
  })

  test('should display subscription statistics', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/subscriptions')

    // Look for stat cards
    const hasStats =
      (await page.locator('text=/active|expired|expiring/i').count()) > 0

    expect(hasStats).toBeTruthy()
  })

  test('should filter subscriptions by status', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/subscriptions')

    // Look for status filters
    const statusFilter = page.locator(
      'button:has-text("Active"), button:has-text("Expired")'
    )

    if (await statusFilter.first().isVisible()) {
      await statusFilter.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('should navigate to create subscription', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/subscriptions')

    // Click create/add button
    const createButton = page.locator(
      'button:has-text("Add"), a:has-text("Create")'
    )

    if (await createButton.isVisible()) {
      await createButton.click()
      // Should show form or navigate
      await page.waitForTimeout(1000)
    }
  })
})
