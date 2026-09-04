import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on('console', msg => console.log(`[browser ${msg.type()}]`, msg.text()))

  // Login
  await page.goto(`${BASE}/auth`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  await page.screenshot({ path: 'debug-auth.png', fullPage: true })
  console.log('Screenshot saved to debug-auth.png')

  // Fill email + password
  await page.fill('input[type="email"]', 'sameerchalla08@gmail.com')
  await page.fill('input[type="password"]', 'password123')
  await page.waitForTimeout(500)

  // Click submit (should be the form button)
  await page.click('button[type="submit"]')
  console.log('Clicked submit')

  try {
    await page.waitForURL(/dashboard/, { timeout: 10000 })
    console.log('✅ Navigated to dashboard')
  } catch (e) {
    console.log('❌ No nav. Current URL:', page.url())
    await page.screenshot({ path: 'debug-error.png', fullPage: true })
    const errorBox = await page.locator('.bg-danger\\/10, [class*="danger"]').first()
    if (await errorBox.count() > 0) {
      console.log('Error text:', await errorBox.textContent())
    }
  }

  await browser.close()
}

main().catch(console.error)
