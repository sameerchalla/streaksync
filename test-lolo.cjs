// Test file using the regular playwright library (not @playwright/test)
const { chromium } = require('playwright')
const path = require('path')

const baseURL = 'http://localhost:5175'

async function runTest() {
  console.log('=== Test 1: Sign up new user lolo ===')
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(baseURL + '/auth', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Take initial screenshot
    await page.screenshot({ path: path.resolve('test-results', '00-auth-initial.png'), fullPage: true })

    // Switch to Sign Up mode
    await page.click('button:has-text("Sign Up")')
    await page.waitForTimeout(1000)

    // Fill in the signup form
    const usernameInput = page.locator('input[placeholder="streakmaster"]')
    await usernameInput.fill('lolo')

    await page.fill('input[placeholder="you@example.com"]', 'lolo@gmail.com')
    await page.fill('input[type="password"]', 'lolo123')

    // Click the Create Account button
    await page.click('button[type="submit"]')

    // Wait for response
    await page.waitForTimeout(5000)

    // Take screenshot after signup attempt
    await page.screenshot({ path: path.resolve('test-results', '01-signup-attempt.png'), fullPage: true })

    // Check for success or error message
    const successMessages = await page.locator('[class*="text-success"]').allTextContents()
    const errorMessages = await page.locator('[class*="text-danger"]').allTextContents()

    console.log('Success messages:', successMessages)
    console.log('Error messages:', errorMessages)

    // Check if there's a general message in the success box
    const bodyText = await page.locator('body').textContent()
    console.log('=== Page contains (first 2000 chars) ===')
    console.log(bodyText?.substring(0, 2000))

    // Check current URL
    const url = page.url()
    console.log('Current URL:', url)

    // Take a final screenshot
    await page.screenshot({ path: path.resolve('test-results', '02-signup-result.png'), fullPage: true })

  } catch (err) {
    console.error('Signup test error:', err.message)
    await page.screenshot({ path: path.resolve('test-results', 'error-signup.png'), fullPage: true })
  }

  // Now try to login
  console.log('\n=== Test 2: Try to login as lolo ===')
  try {
    await page.goto(baseURL + '/auth', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    await page.fill('input[placeholder="you@example.com"]', 'lolo@gmail.com')
    await page.fill('input[type="password"]', 'lolo123')

    // Click Sign In
    await page.click('button[type="submit"]')

    // Wait for response
    await page.waitForTimeout(5000)

    // Check URL
    const url = page.url()
    console.log('URL after login attempt:', url)

    // Take screenshot
    await page.screenshot({ path: path.resolve('test-results', '03-login-result.png'), fullPage: true })

    if (url.includes('/dashboard')) {
      console.log('✓ LOGIN SUCCESSFUL')

      // Check profile
      await page.click('a[href="/profile"]')
      await page.waitForTimeout(3000)
      await page.screenshot({ path: path.resolve('test-results', '04-profile.png'), fullPage: true })

      // Test other pages
      const pages = ['/dashboard', '/rooms', '/habits', '/leaderboard']
      for (const pagePath of pages) {
        await page.goto(baseURL + pagePath, { waitUntil: 'networkidle' })
        await page.waitForTimeout(2000)
        const filename = '05-' + pagePath.replace('/', '') + '.png'
        await page.screenshot({ path: path.resolve('test-results', filename), fullPage: true })
        console.log(`✓ Visited ${pagePath}`)
      }
    } else {
      const errorMessages = await page.locator('[class*="text-danger"]').allTextContents()
      console.log('Error messages:', errorMessages)
      console.log('Login failed - still on auth page')
    }
  } catch (err) {
    console.error('Login test error:', err.message)
    await page.screenshot({ path: path.resolve('test-results', 'error-login.png'), fullPage: true })
  }

  await browser.close()
  console.log('\n=== All tests complete ===')
}

runTest().catch(console.error)
