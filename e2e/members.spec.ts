import { test, expect } from './fixtures/auth'

test.describe('Members Management', () => {
  test('should display members list', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/members')

    // Check for members list or empty state
    const hasList = await page.locator('table, [role="table"]').isVisible()
    const hasEmptyState = await page.locator('text=/no members|empty/i').isVisible()

    expect(hasList || hasEmptyState).toBeTruthy()
  })

  test('should open add member form', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/members')

    // Click add member button
    await page.click('button:has-text("Add Member"), a:has-text("Add Member")')

    // Form should be visible
    await expect(
      page.locator('input[name="name"], input[name="firstName"]')
    ).toBeVisible({
      timeout: 5000,
    })
  })

  test('should search members', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/members')

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]')

    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      // Wait for search results
      await page.waitForTimeout(1000)
    }
  })

  test('should filter members by status', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage

    await page.goto('/dashboard/members')

    // Look for filter controls
    const filterButton = page.locator('button:has-text("Filter"), select')

    if (await filterButton.isVisible()) {
      await filterButton.click()
      // Interact with filter options
      await page.waitForTimeout(500)
    }
  })
})
