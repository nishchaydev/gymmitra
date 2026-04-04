import { test as base, Page } from '@playwright/test'

export type AuthenticatedPage = {
  page: Page
  gymId: string | null
}

type AuthFixtures = {
  authenticatedPage: AuthenticatedPage
}

// Test credentials — loaded from environment variables to prevent leaking secrets in source control.
// Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in your .env.local or CI secrets.
export const TEST_CREDENTIALS = {
  email: process.env.E2E_TEST_EMAIL || (() => { throw new Error('E2E_TEST_EMAIL env var is required for E2E tests') })() as string,
  password: process.env.E2E_TEST_PASSWORD || (() => { throw new Error('E2E_TEST_PASSWORD env var is required for E2E tests') })() as string,
}

/**
 * Authenticated test fixture
 * Automatically logs in before each test and provides authenticated page context
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login')

    // Fill in login form
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email)
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password)

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 30000 })

    // Extract gymId from URL or local storage if needed
    let gymId: string | null = null
    try {
      // Attempt to get gymId from localStorage or page context
      gymId = await page.evaluate(() => {
        return localStorage.getItem('gymId') || null
      })
    } catch (e) {
      // gymId extraction failed, continue without it
    }

    // Provide authenticated page to test
    await use({ page, gymId })

    // Cleanup: logout after test
    // This is optional but helps ensure clean state between tests
  },
})

export { expect } from '@playwright/test'
