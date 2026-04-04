# E2E Testing with Playwright - GymMitra ERP

## ✅ Test Suite Created

I've created a comprehensive E2E test suite covering:

### Test Files Created:
1. **`e2e/fixtures/auth.ts`** - Authentication fixture with your credentials
2. **`e2e/auth.spec.ts`** - Login/logout tests
3. **`e2e/dashboard.spec.ts`** - Dashboard navigation tests
4. **`e2e/members.spec.ts`** - Member management tests
5. **`e2e/subscriptions.spec.ts`** - Subscription management tests
6. **`e2e/attendance.spec.ts`** - Attendance tracking tests

### Test Credentials (Already Configured)
- **Email**: guptanishchay1158@gmail.com
- **Password**: UOF7hJdq

## 🚀 Running the Tests

### Quick Start (3 Easy Ways)

**Option 1: Use the Node.js runner (Recommended)**
```bash
node run-e2e-tests.js
```

**Option 2: Use the batch file (Windows)**
```cmd
run-tests.bat          # Run Chromium tests
run-tests-all.bat      # Run all browsers
run-tests-ui.bat       # Interactive UI mode
```

**Option 3: Use npm scripts directly**

```bash
# Run all E2E tests
npm run test:e2e

# Run only Chromium tests (faster)
npm run test:e2e -- --project=chromium

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Running Specific Tests
```bash
# Run only auth tests
npx playwright test e2e/auth.spec.ts

# Run only dashboard tests
npx playwright test e2e/dashboard.spec.ts

# Run only members tests
npx playwright test e2e/members.spec.ts
```

## 📋 Test Coverage

### Authentication Tests (`auth.spec.ts`)
- ✅ Display login page
- ✅ Login with valid credentials
- ✅ Show error with invalid credentials
- ✅ Logout successfully

### Dashboard Tests (`dashboard.spec.ts`)
- ✅ Display dashboard after login
- ✅ Navigate to Members
- ✅ Navigate to Subscriptions
- ✅ Navigate to Billing
- ✅ Navigate to Attendance
- ✅ Navigate to Products/POS
- ✅ Navigate to Settings

### Members Tests (`members.spec.ts`)
- ✅ Display members list
- ✅ Open add member form
- ✅ Search members
- ✅ Filter members by status

### Subscriptions Tests (`subscriptions.spec.ts`)
- ✅ Display subscriptions page
- ✅ Display subscription statistics
- ✅ Filter subscriptions by status
- ✅ Navigate to create subscription

### Attendance Tests (`attendance.spec.ts`)
- ✅ Display attendance page
- ✅ Show check-in interface
- ✅ Display attendance history
- ✅ Filter attendance by date

## 🔧 Configuration

The Playwright config (`playwright.config.ts`) is set up to:
- Run tests on Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Auto-start dev server (`npm run dev`) before tests
- Take screenshots on failure
- Record video on failure
- Generate HTML report
- Base URL: `http://localhost:3000`

## 🎯 Using the Auth Fixture

For authenticated tests, import from the auth fixture:

```typescript
import { test, expect } from './fixtures/auth'

test('my authenticated test', async ({ authenticatedPage }) => {
  const { page, gymId } = authenticatedPage
  
  // Already logged in! Navigate and test
  await page.goto('/dashboard/members')
  // ... your test logic
})
```

## 📊 Viewing Results

After running tests, view the HTML report:
```bash
npm run test:e2e:report
```

Or check the JSON results:
```
playwright-report/results.json
```

## 🐛 Debugging Tips

1. **UI Mode** - Best for developing tests:
   ```bash
   npm run test:e2e:ui
   ```

2. **Debug Mode** - Step through tests:
   ```bash
   npm run test:e2e:debug
   ```

3. **Headed Mode** - See browser:
   ```bash
   npx playwright test --headed
   ```

4. **Specific Browser**:
   ```bash
   npx playwright test --project=chromium
   ```

## 📝 Next Steps

1. Install PowerShell 7 (see Prerequisites above)
2. Run `npm run test:e2e` to execute all tests
3. Check the HTML report for results
4. Customize tests based on your actual UI selectors

## 🎨 Customizing Tests

The tests use generic selectors that should work with most UIs. If tests fail, you may need to update selectors to match your actual component structure:

- Login form inputs
- Navigation links
- Buttons and form controls
- Table/list elements

Check your actual HTML and update selectors in the test files accordingly.
