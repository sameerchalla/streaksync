import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Login
  await page.goto(`${BASE}/auth`)
  await page.waitForLoadState('networkidle')

  // Fill login
  await page.fill('input[type="email"]', 'sameerchalla08@gmail.com')
  await page.fill('input[type="password"]', 'test123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard/, { timeout: 15000 })
  await page.waitForLoadState('networkidle')

  const pages = [
    { url: '/dashboard', name: 'Dashboard' },
    { url: '/rooms', name: 'Rooms' },
    { url: '/habits', name: 'Habits' },
    { url: '/leaderboard', name: 'Leaderboard' },
    { url: '/profile', name: 'Profile' },
  ]

  const suspiciousPatterns = [
    'streakmaster', 'Code Queen', 'Dev Master', 'Byte Wizard',
    'consistencyking', 'streakqueen', 'dailygrinder', 'habithero',
    'consistency king', 'streak queen', 'daily grinder', 'habit hero',
    'Drink 8 glasses', 'Meditate 10 minutes', 'Write journal',
  ]

  for (const p of pages) {
    await page.goto(`${BASE}${p.url}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const text = await page.textContent('body')

    console.log(`\n========== ${p.name} (${p.url}) ==========`)

    const found = suspiciousPatterns.filter(pat => text?.includes(pat))
    if (found.length > 0) {
      console.log(`⚠️  PLACEHOLDER DATA FOUND:`, found)
    } else {
      console.log(`✅ No obvious placeholders`)
    }
  }

  await browser.close()
}

main().catch(console.error)
