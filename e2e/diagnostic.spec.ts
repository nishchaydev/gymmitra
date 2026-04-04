import { test, expect } from '@playwright/test'

/**
 * Diagnostic Test - Find Out Why Tests Are Failing
 * Run this to see what's actually on your pages
 */

test.describe('Diagnostic Tests - Check Your App', () => {
  test('check if app loads at all', async ({ page }) => {
    console.log('\n=== Testing if app loads ===')
    
    const response = await page.goto('/', { waitUntil: 'networkidle' })
    console.log('Status:', response?.status())
    console.log('URL after load:', page.url())
    
    // Take screenshot
    await page.screenshot({ path: 'diagnostic-homepage.png', fullPage: true })
    console.log('Screenshot saved: diagnostic-homepage.png')
    
    // Check page title
    const title = await page.title()
    console.log('Page title:', title)
    
    expect(response?.status()).toBe(200)
  })

  test('check login page structure', async ({ page }) => {
    console.log('\n=== Testing login page ===')
    
    await page.goto('/login', { waitUntil: 'networkidle' })
    
    // Take screenshot
    await page.screenshot({ path: 'diagnostic-login.png', fullPage: true })
    console.log('Screenshot saved: diagnostic-login.png')
    
    // Log page title
    const title = await page.title()
    console.log('Login page title:', title)
    
    // Find all input fields
    const inputs = await page.locator('input').all()
    console.log(`Found ${inputs.length} input fields`)
    
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type')
      const name = await inputs[i].getAttribute('name')
      const id = await inputs[i].getAttribute('id')
      const placeholder = await inputs[i].getAttribute('placeholder')
      console.log(`  Input ${i + 1}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}"`)
    }
    
    // Find all buttons
    const buttons = await page.locator('button').all()
    console.log(`Found ${buttons.length} buttons`)
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent()
      const type = await buttons[i].getAttribute('type')
      console.log(`  Button ${i + 1}: type="${type}", text="${text?.trim()}"`)
    }
    
    // Check for form
    const forms = await page.locator('form').count()
    console.log(`Found ${forms} form(s)`)
  })

  test('try to login and see what happens', async ({ page }) => {
    console.log('\n=== Testing actual login flow ===')
    
    await page.goto('/login', { waitUntil: 'networkidle' })
    
    // Try different selectors for email
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[id="email"]',
      'input[placeholder*="email" i]',
      'input[autocomplete="email"]',
    ]
    
    let emailField = null
    for (const selector of emailSelectors) {
      const field = page.locator(selector).first()
      if (await field.isVisible().catch(() => false)) {
        console.log(`✓ Found email field with: ${selector}`)
        emailField = field
        break
      }
    }
    
    if (!emailField) {
      console.log('❌ Could not find email field!')
      await page.screenshot({ path: 'diagnostic-no-email-field.png', fullPage: true })
      return
    }
    
    // Try different selectors for password
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
      'input[placeholder*="password" i]',
    ]
    
    let passwordField = null
    for (const selector of passwordSelectors) {
      const field = page.locator(selector).first()
      if (await field.isVisible().catch(() => false)) {
        console.log(`✓ Found password field with: ${selector}`)
        passwordField = field
        break
      }
    }
    
    if (!passwordField) {
      console.log('❌ Could not find password field!')
      await page.screenshot({ path: 'diagnostic-no-password-field.png', fullPage: true })
      return
    }
    
    // Fill in credentials
    await emailField.fill('guptanishchay1158@gmail.com')
    await passwordField.fill('UOF7hJdq')
    console.log('✓ Filled in credentials')
    
    // Try to find submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Login")',
      'button:has-text("Log in")',
      'input[type="submit"]',
    ]
    
    let submitButton = null
    for (const selector of submitSelectors) {
      const button = page.locator(selector).first()
      if (await button.isVisible().catch(() => false)) {
        console.log(`✓ Found submit button with: ${selector}`)
        submitButton = button
        break
      }
    }
    
    if (!submitButton) {
      console.log('❌ Could not find submit button!')
      await page.screenshot({ path: 'diagnostic-no-submit.png', fullPage: true })
      return
    }
    
    // Take screenshot before submit
    await page.screenshot({ path: 'diagnostic-before-submit.png', fullPage: true })
    
    // Click submit
    console.log('Clicking submit...')
    await submitButton.click()
    
    // Wait a bit
    await page.waitForTimeout(3000)
    
    // Take screenshot after submit
    await page.screenshot({ path: 'diagnostic-after-submit.png', fullPage: true })
    
    // Log current URL
    const currentUrl = page.url()
    console.log('URL after submit:', currentUrl)
    
    // Check if we're on dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard!')
    } else {
      console.log('⚠️ Not on dashboard. Current URL:', currentUrl)
      
      // Check for error messages
      const errorText = await page.textContent('body')
      if (errorText?.toLowerCase().includes('error') || 
          errorText?.toLowerCase().includes('invalid') ||
          errorText?.toLowerCase().includes('wrong')) {
        console.log('❌ Looks like there might be an error message on page')
      }
    }
  })
})
