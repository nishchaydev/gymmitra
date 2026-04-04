@echo off
echo ========================================
echo  GymMitra E2E Tests - Manual Server
echo ========================================
echo.
echo This script runs tests WITHOUT starting the dev server automatically.
echo.
echo IMPORTANT: Make sure your dev server is ALREADY RUNNING on port 3000!
echo.
echo To start dev server in another terminal:
echo   npm run dev
echo.
echo ========================================
echo.
pause
echo.
echo Running tests (assuming server is on localhost:3000)...
echo.
npx playwright test --project=chromium
echo.
echo ========================================
echo Tests completed!
echo.
echo To view HTML report:
echo   npm run test:e2e:report
echo.
pause
