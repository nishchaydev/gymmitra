@echo off
echo ========================================
echo  Running Diagnostic Tests
echo ========================================
echo.
echo This will:
echo   1. Check if your app loads
echo   2. Inspect login page structure
echo   3. Try to login and see what happens
echo   4. Save screenshots for debugging
echo.
echo Make sure dev server is running on localhost:3000!
echo.
pause
echo.
echo Running diagnostic tests...
echo.
npx playwright test e2e/diagnostic.spec.ts --project=chromium --reporter=list
echo.
echo ========================================
echo  Diagnostic Complete!
echo ========================================
echo.
echo Check the screenshots saved in project root:
echo   - diagnostic-homepage.png
echo   - diagnostic-login.png
echo   - diagnostic-before-submit.png
echo   - diagnostic-after-submit.png
echo.
echo Review the console output above to see what was found.
echo.
pause
