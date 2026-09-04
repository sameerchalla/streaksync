import { test, expect } from '@playwright/test'

const baseURL = 'http://localhost:5173'

test.describe('StreakSync - lolo User Profile Creation and Full Testing', () => {
  test('1) Sign up new user lolo with email lolo@gmail.com and password lolo123', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto(baseURL + '/auth')

    // Switch to Sign Up mode
    await page.click('button:has-text("Sign Up")')

    // Wait a bit for mode switch
    await page.waitForTimeout(500)

    // Fill in username
    const usernameInput = page.locator('input[placeholder="streakmaster"]')
    await usernameInput.fill('lolo')

    // Fill email
    await page.fill('input[placeholder="you@example.com"]', 'lolo@gmail.com')

    // Fill password
    await page.fill('input[type="password"]', 'lolo123')

    // Click the Create Account button
    await page.click('button[type="submit"]')

    // Wait for either redirect or message
    await page.waitForTimeout(3000)

    // Take screenshot
    await page.screenshot({ path: 'streakSync/test-results/01-signup.png', fullPage: true })

    // Check what happened
    const url = page.url()
    const successMessage = await page.locator('[class*="text-success"]').textContent().catch(() => '')
    const errorMessage = await page.locator('[class*="text-danger"]').textContent().catch(() => '')

    console.log('URL after signup:', url)
    console.log('Success message:', successMessage)
    console.log('Error message:', errorMessage)

    // Print page HTML for debugging
    const bodyText = await page.locator('body').textContent()
    console.log('Page text:', bodyText?.substring(0, 500))
  })

  test('2) Try to login as lolo', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto(baseURL + '/auth')

    // Should default to login mode
    await page.fill('input[placeholder="you@example.com"]', 'lolo@gmail.com')
    await page.fill('input[type="password"]', 'lolo123')

    // Click Sign In button
    await page.click('button[type="submit"]')

    await page.waitForTimeout(5000)

    // Take screenshot
    await page.screenshot({ path: 'streakSync/test-results/02-login.png', fullPage: true })

    const url = page.url()
    console.log('URL after login attempt:', url)

    // If redirected to dashboard, check profile
    if (url.includes('/dashboard')) {
      console.log('LOGIN SUCCESSFUL - redirected to dashboard')
      // Check dashboard content
      const h1 = await page.locator('h1').first().textContent()
      console.log('Dashboard h1:', h1)

      // Navigate to profile
      await page.click('a[href="/profile"]')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'streakSync/test-results/02b-profile.png', fullPage: true })

      // Check profile data
      const profileH1 = await page.locator('h1').first().textContent()
      const usernameEl = await page.locator('p').first().textContent().catch(() => '')
      console.log('Profile h1:', profileH1)
      console.log('Profile p:', usernameEl)
    } else {
      console.log('LOGIN FAILED - still on auth page')
      const errorMsg = await page.locator('[class*="text-danger"]').textContent().catch(() => 'no error')
      console.log('Error:', errorMsg)
    }
  })
})
