# 🚨 QUICK FIX - E2E Tests Not Running

## Problem
Tests fail with: `'next' is not recognized as an internal or external command`

## ✅ SOLUTION (Choose One)

### Option 1: Start Dev Server First (EASIEST) ⭐

**Step 1:** Open a terminal and start your dev server:
```bash
npm run dev
```

**Step 2:** Open a SECOND terminal and run tests:
```bash
node run-tests-no-server.js
```

Or use the batch file:
```cmd
run-tests-manual-server.bat
```

---

### Option 2: Let Tests Start Server Automatically

If you want tests to start the server automatically, make sure dependencies are installed:

```bash
npm install
```

Then run:
```bash
npm run test:e2e
```

---

### Option 3: Run Without WebServer Config

If the auto-server doesn't work, disable it in `playwright.config.ts`:

1. Open `playwright.config.ts`
2. Comment out the `webServer` section:
```typescript
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },
```

3. Start dev server manually: `npm run dev`
4. Run tests: `npm run test:e2e`

---

## 🎯 Recommended Workflow

**For development (running tests repeatedly):**

1. **Terminal 1** - Keep dev server running:
   ```bash
   npm run dev
   ```

2. **Terminal 2** - Run tests as needed:
   ```bash
   node run-tests-no-server.js
   ```

**Benefits:**
- ✅ Faster test runs (no server restart)
- ✅ See server logs in real-time
- ✅ Tests run immediately
- ✅ Works even if server takes time to start

---

## 📝 Available Test Commands

### With Server Already Running:
```bash
# Node.js script
node run-tests-no-server.js

# Windows batch file
run-tests-manual-server.bat

# Direct command
npx playwright test --project=chromium
```

### Let Tests Start Server:
```bash
# NPM script
npm run test:e2e

# Node.js script
node run-e2e-tests.js

# Windows batch file
run-tests.bat
```

### Interactive Modes:
```bash
# UI mode (best for debugging)
npm run test:e2e:ui

# Debug mode (step through)
npm run test:e2e:debug

# Headed mode (see browser)
npx playwright test --headed
```

---

## 🐛 Still Not Working?

### Check 1: Is Node.js installed?
```bash
node --version
npm --version
```

### Check 2: Are dependencies installed?
```bash
npm install
```

### Check 3: Is port 3000 available?
```bash
# Windows
netstat -ano | findstr :3000

# If something is using it, either:
# - Stop that process
# - Change port in playwright.config.ts
```

### Check 4: Can you start dev server manually?
```bash
npm run dev
# Should start on http://localhost:3000
```

### Check 5: Are Playwright browsers installed?
```bash
npx playwright install
```

---

## 💡 Pro Tips

1. **Always keep dev server running** in a separate terminal during development
2. **Use UI mode** for debugging: `npm run test:e2e:ui`
3. **Run single test** to debug: `npx playwright test e2e/auth.spec.ts`
4. **Check HTML report** after failures: `npm run test:e2e:report`

---

## 📚 Files to Use

| What You Want | Command |
|---------------|---------|
| Run tests (server already running) | `node run-tests-no-server.js` |
| Run tests (auto-start server) | `node run-e2e-tests.js` |
| Debug tests interactively | `npm run test:e2e:ui` |
| View last test results | `npm run test:e2e:report` |
| See test info/help | `node test-summary.js` |

---

## ✅ Quick Start RIGHT NOW

**Copy and paste these commands:**

```bash
# Terminal 1 - Start server
npm run dev

# Wait for it to start, then in Terminal 2:
node run-tests-no-server.js
```

**That's it!** Tests will run against your running server.

---

## 📖 More Help

- See `PLAYWRIGHT_SETUP.md` for full setup guide
- See `E2E_TESTS_README.md` for complete documentation
- See `E2E_TESTING_GUIDE.md` for detailed testing guide

---

## 🎉 Summary

**The fix:** Start your dev server first, then run tests with:
```bash
node run-tests-no-server.js
```

Or use the manual server batch file:
```cmd
run-tests-manual-server.bat
```

This is actually the BEST way to run E2E tests during development! 🚀
