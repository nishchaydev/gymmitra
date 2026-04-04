#!/usr/bin/env node

/**
 * Test Runner - Assumes dev server is already running
 * Run this AFTER starting: npm run dev
 */

const { exec } = require('child_process');

console.log('\n🚀 GymMitra E2E Test Suite (Manual Server Mode)\n');
console.log('⚠️  IMPORTANT: Make sure dev server is running on http://localhost:3000');
console.log('   Start it in another terminal: npm run dev\n');
console.log('📧 Test Credentials: guptanishchay1158@gmail.com');
console.log('🔒 Password: UOF7hJdq\n');
console.log('=' .repeat(60));
console.log('\nStarting tests in 3 seconds...\n');

setTimeout(() => {
  const testProcess = exec('npx playwright test --project=chromium', {
    cwd: __dirname,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  testProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  testProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  testProcess.on('close', (code) => {
    console.log('\n' + '='.repeat(60));
    
    if (code === 0) {
      console.log('✅ All tests passed!');
    } else {
      console.log('❌ Some tests failed (exit code: ' + code + ')');
      console.log('\n💡 Common issues:');
      console.log('   - Is dev server running on port 3000?');
      console.log('   - Are credentials still valid?');
      console.log('   - Did UI selectors change?');
    }
    
    console.log('\n📊 View detailed report: npm run test:e2e:report');
    console.log('🐛 Debug in UI mode: npm run test:e2e:ui');
    console.log('=' .repeat(60));
    process.exit(code);
  });
}, 3000);
