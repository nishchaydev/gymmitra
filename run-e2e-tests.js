#!/usr/bin/env node

/**
 * Test Runner Script for GymMitra E2E Tests
 * 
 * This script runs Playwright tests and provides a summary of results.
 * Run with: node run-e2e-tests.js
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting GymMitra E2E Test Suite...\n');
console.log('📧 Test Credentials: guptanishchay1158@gmail.com');
console.log('🔒 Password: UOF7hJdq\n');

// Check if dev server might already be running
console.log('⏳ This will try to start the dev server automatically...');
console.log('   If your server is already running, the tests will use it.\n');

console.log('=' .repeat(60));
console.log('\n');

// Run Playwright tests - let Playwright handle the server
const testCommand = 'npx playwright test --project=chromium --reporter=list';

const testProcess = exec(testCommand, {
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
  console.log('\n');
  console.log('=' .repeat(60));
  
  if (code === 0) {
    console.log('✅ All tests passed!');
    console.log('\n📊 To view detailed HTML report, run:');
    console.log('   npm run test:e2e:report');
  } else {
    console.log('❌ Some tests failed (exit code: ' + code + ')');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure dependencies are installed: npm install');
    console.log('   2. Try starting dev server manually: npm run dev');
    console.log('   3. Then run: node run-tests-no-server.js');
    console.log('\n🔍 To debug:');
    console.log('   npm run test:e2e:ui    (Interactive UI mode)');
    console.log('   npm run test:e2e:debug (Debug mode)');
    console.log('\n📊 To view detailed HTML report, run:');
    console.log('   npm run test:e2e:report');
  }
  
  console.log('=' .repeat(60));
  process.exit(code);
});
