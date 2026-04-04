@echo off
echo ========================================
echo  Running Playwright E2E Tests...
echo ========================================
echo.
echo This will try to start the dev server automatically.
echo If it fails, start the server manually first:
echo   npm run dev
echo.
echo Then run: run-tests-manual-server.bat
echo ========================================
echo.
call npx playwright test --project=chromium --reporter=list
echo.
if %ERRORLEVEL% EQU 0 (
  echo ========================================
  echo   All tests passed!
  echo ========================================
) else (
  echo ========================================
  echo   Some tests failed
  echo ========================================
  echo.
  echo Troubleshooting:
  echo   1. Make sure dev server can start
  echo   2. Run: npm install
  echo   3. Try: run-tests-manual-server.bat
  echo ========================================
)
echo.
echo View report: npm run test:e2e:report
echo.
pause
