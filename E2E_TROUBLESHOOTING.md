# 🔧 E2E Tests Failing? Troubleshooting Guide

## 🎯 Step 1: Run Diagnostic Tests

**This will tell you exactly what's wrong:**

```bash
# Make sure dev server is running first!
npm run dev

# Then in another terminal:
run-diagnostic.bat
```

Or:
```bash
npx playwright test e2e/diagnostic.spec.ts --project=chromium
```

**What it does:**
- Checks if your app loads
- Inspects login page structure
- Finds all input fields and buttons
- Tries to login and logs everything
- Saves screenshots for debugging

**Check the output** - it will tell you:
- ✅ What selectors work
- ❌ What's missing
- 📸 Screenshots saved in project root

---

## 🐛 Common Issues & Fixes

### Issue 1: "input[type='email'] not found"

**Problem:** Your login form uses different HTML attributes.

**Fix:** Check `diagnostic-login.png` screenshot and console output to see what selectors actually exist.

**Update `e2e/fixtures/auth.ts` with correct selectors:**
```typescript
// Example: If your email input has name="userEmail"
await page.fill('input[name="userEmail"]', TEST_CREDENTIALS.email)

// Or if it has a specific ID:
await page.fill('#email-input', TEST_CREDENTIALS.email)
```

---

### Issue 2: "Timeout waiting for /dashboard"

**Possible causes:**
1. Login failed (wrong credentials)
2. Redirects to different URL (not `/dashboard`)
3. App is slow to respond

**Check:**
1. Verify credentials work manually in browser
2. See `diagnostic-after-submit.png` - where did it actually go?
3. Check console output for actual URL after login

**Fix:**
```typescript
// If redirects to /app or /home instead:
await page.waitForURL('**/app/**', { timeout: 15000 })

// Or if just checking not on login:
await page.waitForTimeout(3000)
expect(page.url()).not.toContain('/login')
```

---

### Issue 3: "Login button not found"

**Problem:** Submit button has different text or attributes.

**Check:** `diagnostic-login.png` to see actual button text.

**Fix in test files:**
```typescript
// If button says "Sign In" instead of "Login":
await page.click('button:has-text("Sign In")')

// Or if it's an <a> tag:
await page.click('a[href="/api/auth/signin"]')

// Or specific class:
await page.click('.login-submit-btn')
```

---

### Issue 4: Tests run but nothing happens

**Causes:**
1. Dev server not running
2. Running on wrong port
3. Supabase auth issue

**Check:**
```bash
# Is server actually running?
curl http://localhost:3000

# Or open in browser
start http://localhost:3000
```

**Fix:**
1. Start dev server: `npm run dev`
2. Verify it's on port 3000
3. Check `.env` variables are set

---

### Issue 5: Credentials don't work

**Problem:** Account doesn't exist or password changed.

**Test manually:**
1. Open http://localhost:3000/login in browser
2. Try logging in with:
   - Email: guptanishchay1158@gmail.com
   - Password: UOF7hJdq

**If manual login fails:**
- Update `e2e/fixtures/auth.ts` with correct credentials
- Or create a test account

---

## 📋 Debugging Checklist

Run through this list:

- [ ] Dev server is running (`npm run dev`)
- [ ] Can access http://localhost:3000 in browser
- [ ] Login page loads at http://localhost:3000/login
- [ ] Can login manually with test credentials
- [ ] Ran diagnostic tests (`run-diagnostic.bat`)
- [ ] Checked screenshot files
- [ ] Read console output from diagnostic
- [ ] Updated selectors based on findings

---

## 🔍 Advanced Debugging

### Run Single Test with Debugging

```bash
# Run just auth tests with full output
npx playwright test e2e/auth.spec.ts --debug

# Or specific test:
npx playwright test e2e/auth.spec.ts -g "should login" --debug
```

### See Tests Run in Browser

```bash
npx playwright test --headed --project=chromium
```

### Generate Test Code

Let Playwright watch you login and generate the code:

```bash
npx playwright codegen http://localhost:3000/login
```

This opens a browser - do your login manually and Playwright writes the code for you!

### Check Network Requests

Add this to a test:
```typescript
page.on('request', request => console.log('→', request.method(), request.url()))
page.on('response', response => console.log('←', response.status(), response.url()))
```

---

## 📸 Screenshot Analysis

After running diagnostic, check these files:

1. **`diagnostic-homepage.png`**
   - Does homepage load?
   - Any error messages?

2. **`diagnostic-login.png`**
   - Is it the login page?
   - Can you see email/password fields?
   - Is there a submit button?

3. **`diagnostic-before-submit.png`**
   - Are fields filled in?
   - Is form ready to submit?

4. **`diagnostic-after-submit.png`**
   - Where did it go?
   - Dashboard? Error page? Still on login?
   - Any error messages visible?

---

## 🛠️ Manual Test Fixes

### Fix Auth Tests

Edit `e2e/auth.spec.ts`:

```typescript
// Make it more flexible:
test('should login', async ({ page }) => {
  await page.goto('/login')
  
  // Use whatever selectors work from diagnostic
  await page.fill('YOUR_EMAIL_SELECTOR', TEST_CREDENTIALS.email)
  await page.fill('YOUR_PASSWORD_SELECTOR', TEST_CREDENTIALS.password)
  await page.click('YOUR_SUBMIT_SELECTOR')
  
  // Wait and check
  await page.waitForTimeout(3000)
  console.log('Current URL:', page.url())
  
  expect(page.url()).not.toContain('/login')
})
```

### Fix Auth Fixture

Edit `e2e/fixtures/auth.ts`:

```typescript
// Update the selectors that work for your app
const emailField = page.locator('YOUR_WORKING_SELECTOR')
const passwordField = page.locator('YOUR_WORKING_SELECTOR')
const submitButton = page.locator('YOUR_WORKING_SELECTOR')
```

---

## 💡 Pro Tips

1. **Start Simple**
   - Get one test working first
   - Use diagnostic to find selectors
   - Then update other tests

2. **Use Flexible Selectors**
   ```typescript
   // Bad - too specific
   page.locator('#root > div > form > input:nth-child(2)')
   
   // Good - semantic
   page.locator('input[type="email"]')
   page.locator('button:has-text("Login")')
   ```

3. **Add Waits**
   ```typescript
   // After actions, give app time to respond
   await submitButton.click()
   await page.waitForTimeout(2000)  // 2 second pause
   ```

4. **Check Console**
   - Tests show helpful error messages
   - Screenshots show visual state
   - Console logs show what was found

---

## 📞 Still Stuck?

1. **Run diagnostic**: `run-diagnostic.bat`
2. **Check screenshots**: Look at the PNG files created
3. **Read output**: Console shows what was found
4. **Update selectors**: Use what diagnostic found
5. **Test again**: `node run-tests-no-server.js`

**The diagnostic test is your best friend** - it will show you EXACTLY what's on your pages and what selectors to use!

---

## ✅ Next Steps

After fixing:

1. Update `e2e/fixtures/auth.ts` with working selectors
2. Update `e2e/auth.spec.ts` if needed
3. Run all tests: `node run-tests-no-server.js`
4. Check results: `npm run test:e2e:report`

Good luck! 🚀
