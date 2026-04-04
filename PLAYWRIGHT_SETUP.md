# Playwright E2E Testing Setup Guide

## 📦 Installation Steps

Since PowerShell 6+ is not available on your system, please run these commands manually in your terminal:

### 1. Install Playwright and Dependencies
```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install --with-deps
```

### 2. Create E2E Test Directories
```bash
# Create directories
mkdir -p e2e/fixtures e2e/helpers

# Or on Windows CMD:
mkdir e2e\fixtures
mkdir e2e\helpers
```

### 3. Create Example E2E Test File

Create `e2e/example.spec.ts` with the following content:

```typescript
import { test, expect } from '@playwright/test'

test.describe('GymMitra - Public Pages', () => {
  test('homepage should load successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page loaded
    await expect(page).toHaveTitle(/GymMitra/i)
    
    // Should see login or landing page
    const loginButton = page.getByRole('link', { name: /login|sign in/i })
    await expect(loginButton).toBeVisible()
  })

  test('login page should render form', async ({ page }) => {
    await page.goto('/login')
    
    // Check for email and password inputs
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Check for submit button
    const submitButton = page.getByRole('button', { name: /sign in|login/i })
    await expect(submitButton).toBeVisible()
  })
})

test.describe('GymMitra - Request Trial Flow', () => {
  test('should allow requesting a trial', async ({ page }) => {
    await page.goto('/request-trial')
    
    // Fill in the trial request form (adjust selectors based on actual form)
    await page.getByLabel(/gym name|business name/i).fill('Test Gym E2E')
    await page.getByLabel(/email/i).fill(`test-${Date.now()}@example.com`)
    await page.getByLabel(/phone/i).fill('9876543210')
    
    // Submit the form
    const submitButton = page.getByRole('button', { name: /request trial|submit/i })
    await submitButton.click()
    
    // Wait for success message or redirect
    // Adjust this based on your actual success flow
    await page.waitForURL(/\/onboarding|\/login/, { timeout: 10000 })
  })
})

// Example authenticated test - requires test user setup
test.describe('GymMitra - Dashboard (Authenticated)', () => {
  test.skip('should show dashboard after login', async ({ page }) => {
    // TODO: Implement login helper and test user seeding
    // For now, this is skipped until auth fixtures are set up
    
    // await loginAsTestUser(page, 'test@gym.com', 'password123')
    // await page.goto('/dashboard')
    // await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })
})
```

### 4. Create Auth Fixture

Create `e2e/fixtures/auth.ts`:

```typescript
import { test as base } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

type AuthFixtures = {
  authenticatedPage: {
    page: any
    gymId: string
    userId: string
  }
}

/**
 * Fixture for authenticated Playwright tests
 * Creates a test gym and logs in before each test
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Initialize Supabase client (only for test environment)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create test user and gym
    const testEmail = `playwright-${Date.now()}@test.com`
    const testPassword = 'TestPassword123!'

    // 1. Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`)
    }

    const userId = authData.user.id

    // 2. Create gym profile (adjust based on your schema)
    // This is a placeholder - adjust to match your actual DB setup
    const gymData = {
      userId,
      name: 'Test Gym E2E',
      email: testEmail,
      phone: '9999999999',
      slug: \`test-gym-${Date.now()}\`,
      isVerified: true,
      saasPlan: 'TRIAL',
      planTier: 'TRIAL',
    }

    // TODO: Insert gym via Supabase or Prisma
    // const { data: gym } = await supabase.from('GymProfile').insert(gymData).select().single()

    // 3. Log in via UI
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(testEmail)
    await page.getByLabel(/password/i).fill(testPassword)
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })

    // Provide authenticated context to test
    await use({
      page,
      gymId: 'placeholder-gym-id', // Replace with actual gymId from insertion
      userId,
    })

    // Cleanup: Delete test gym and user after test
    // TODO: Implement cleanup based on your schema
    // await supabase.from('GymProfile').delete().eq('userId', userId)
    await supabase.auth.admin.deleteUser(userId)
  },
})

export { expect } from '@playwright/test'
```

### 5. Update .gitignore

Add to your `.gitignore` file:

```
# Playwright
playwright-report/
test-results/
```

## 🚀 Running Playwright Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/example.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# View HTML report
npm run test:e2e:report
```

## 🤖 Playwright MCP Server

The Playwright MCP server is configured in `.github/copilot-mcp.json` and enables:

- **AI-assisted test generation** - Ask Copilot to generate E2E tests
- **Test debugging** - Get help debugging failing tests
- **Selector suggestions** - Get better test selectors
- **Visual testing** - Screenshots and videos on failure

### Activating the MCP Server

The MCP server will be automatically detected by GitHub Copilot CLI when you work in this repository.

To use it:
1. Start your dev server: `npm run dev`
2. Ask Copilot to generate or run E2E tests
3. Copilot will use the Playwright MCP to execute tests and analyze results

Example prompts:
- "Generate an E2E test for the member registration flow"
- "Debug the failing login test"
- "Create tests for the invoice creation flow with screenshots"

## 📝 Writing Good E2E Tests

### Best Practices

1. **Use User-Facing Selectors**
   ```typescript
   // ✅ Good - Uses accessible roles
   await page.getByRole('button', { name: /submit/i })
   await page.getByLabel(/email/i)
   
   // ❌ Bad - Brittle CSS selectors
   await page.locator('.btn-submit')
   await page.locator('#email-input')
   ```

2. **Test User Journeys, Not Implementation**
   ```typescript
   // ✅ Good - Tests user flow
   test('user can create a new member', async ({ page }) => {
     await page.goto('/dashboard/members')
     await page.getByRole('button', { name: /add member/i }).click()
     // Fill form...
     // Verify member appears in list
   })
   
   // ❌ Bad - Tests internal state
   test('createMember API is called', async ({ page }) => {
     // Don't test API calls directly in E2E
   })
   ```

3. **Use Fixtures for Common Setup**
   ```typescript
   // Use the auth fixture for authenticated tests
   import { test, expect } from './fixtures/auth'
   
   test('dashboard shows gym name', async ({ authenticatedPage }) => {
     const { page, gymId } = authenticatedPage
     // Already logged in!
   })
   ```

4. **Make Tests Independent**
   ```typescript
   // Each test should be able to run standalone
   test('test A', async ({ page }) => {
     // Don't rely on state from other tests
   })
   ```

## 🎯 Test Coverage Goals

- [ ] **Authentication flows** - Login, register, logout, password reset
- [ ] **Member management** - Create, edit, delete, search members
- [ ] **Subscription flows** - Create subscription, renew, cancel
- [ ] **Billing** - Create invoice, record payment, export reports
- [ ] **Attendance** - Check-in, check-out, view history
- [ ] **POS** - Create sale, manage inventory
- [ ] **Multi-tenancy** - Verify gym isolation (no cross-gym data leaks)
- [ ] **Accessibility** - Keyboard navigation, screen reader support

## 🔧 Environment Variables

For E2E tests, you may need:

```bash
# .env.test.local
PLAYWRIGHT_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For test fixtures
DATABASE_URL=your-test-database-url  # Use separate test DB
```

**Important:** Never commit real credentials. Use test-only credentials for E2E testing.

## 🐛 Debugging Failed Tests

```bash
# Run with debug mode
npx playwright test --debug

# Generate trace for debugging
npx playwright test --trace on

# Open last trace
npx playwright show-trace trace.zip

# Take screenshot at specific point
await page.screenshot({ path: 'screenshot.png' })

# Pause execution and inspect
await page.pause()
```

## ✅ Next Steps

1. Run `npm install -D @playwright/test @axe-core/playwright`
2. Run `npx playwright install --with-deps`
3. Create the `e2e` directories and files as shown above
4. Run your first test: `npm run test:e2e`
5. Start writing E2E tests for critical user flows!

---

**All configuration files have been created:**
- ✅ `playwright.config.ts` - Playwright configuration
- ✅ `.github/copilot-mcp.json` - MCP server configuration
- ✅ `package.json` - Updated with E2E test scripts
- ✅ `.github/copilot-instructions.md` - Updated with E2E testing info

**Manual steps required:**
1. Install Playwright packages (see command above)
2. Create `e2e` directories and test files
3. Run tests to verify setup
