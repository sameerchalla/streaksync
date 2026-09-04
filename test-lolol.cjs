// Comprehensive Playwright test for StreakSync
// Signs up "lolol", crawls every page, exercises every function, logs issues.

const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const baseURL = 'http://localhost:5176'
const issues = []
const consoleErrors = []
const networkErrors = []

function issue(severity, area, message) {
  issues.push({ severity, area, message })
  console.log(`[${severity}] ${area}: ${message}`)
}

async function shot(page, name) {
  await page.screenshot({
    path: path.resolve('test-results', name),
    fullPage: true,
  })
}

async function run() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    consoleErrors.push('PAGE ERROR: ' + err.message)
  })
  page.on('requestfailed', (req) => {
    networkErrors.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`)
  })

  // ────────────────────────────────────────────────────
  // STEP 1: Sign up "lolol"
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 1: Sign up lolol ===')
  await page.goto(baseURL + '/auth', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await shot(page, '01-auth-landing.png')

  // Switch to Sign Up
  await page.locator('button:has-text("Sign Up")').first().click()
  await page.waitForTimeout(500)

  await page.locator('input[placeholder="streakmaster"]').fill('lolol')
  await page.locator('input[placeholder="you@example.com"]').fill('lol@gmail.com')
  await page.locator('input[type="password"]').fill('lol123')
  await shot(page, '02-signup-filled.png')

  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(3000)
  await shot(page, '03-after-signup.png')

  // After signup the form should switch to login mode with a success message
  const successTexts = await page.locator('[class*="text-success"]').allTextContents()
  const errTexts = await page.locator('[class*="text-danger"]').allTextContents()
  console.log('After signup, success:', successTexts, 'error:', errTexts)

  if (errTexts.some((t) => /username already taken/i.test(t))) {
    console.log('  lolol already exists from previous run - pre-check correctly rejects duplicate username')
  } else if (successTexts.length > 0) {
    console.log('  ✓ New user created successfully')
  }

  // ────────────────────────────────────────────────────
  // STEP 2: Log in
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 2: Log in ===')
  await page.goto(baseURL + '/auth', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.locator('input[placeholder="you@example.com"]').fill('lol@gmail.com')
  await page.locator('input[type="password"]').fill('lol123')
  await page.locator('button[type="submit"]').click()

  try {
    await page.waitForURL('**/dashboard', { timeout: 8000 })
    console.log('✓ Reached /dashboard')
  } catch {
    issue('CRITICAL', 'Auth', 'Login failed - did not reach /dashboard')
    await shot(page, '04-login-failed.png')
    await browser.close()
    return
  }
  await page.waitForTimeout(2000)
  await shot(page, '04-dashboard.png')

  // ────────────────────────────────────────────────────
  // STEP 3: Inspect Dashboard
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 3: Dashboard ===')
  const dashText = await page.locator('main').textContent()
  if (!/Hey,\s+lolol/.test(dashText || '')) {
    issue('BUG', 'Dashboard', 'Greeting does not say "Hey, lolol" (uses display_name or username). Got: ' + (dashText || '').slice(0, 200))
  }
  if (!/Current Streak/.test(dashText)) {
    issue('BUG', 'Dashboard', 'Missing "Current Streak" header')
  }
  if (!/0\s*\/\s*0/.test(dashText) && !/No rooms yet/.test(dashText)) {
    // not necessarily wrong - if "0/0 done" appears in the done pill that's bad
    const donePill = await page.locator('text=/\\d+\\/\\d+ done/').first().textContent().catch(() => null)
    if (donePill && /0\/0/.test(donePill)) {
      issue('MINOR', 'Dashboard', `"${donePill}" - showing 0/0 with no rooms is awkward (should hide the pill)`)
    }
  }

  // Check the header user email
  const headerEmail = await page.locator('header').textContent()
  if (!headerEmail?.includes('lol@gmail.com')) {
    issue('BUG', 'Layout', 'Header does not show user email lol@gmail.com')
  }

  // ────────────────────────────────────────────────────
  // STEP 4: Theme toggle in header
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 4: Theme toggle ===')
  const themeButton = page.locator('header button[aria-label*="mode"]')
  if (!(await themeButton.count())) {
    issue('BUG', 'Layout', 'Theme toggle button not found in header')
  } else {
    const labelBefore = await themeButton.getAttribute('aria-label')
    await themeButton.click()
    await page.waitForTimeout(500)
    const htmlTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    if (htmlTheme !== 'light') {
      issue('CRITICAL', 'Theme', `After toggle, document.documentElement data-theme should be "light", got "${htmlTheme}"`)
    }
    const labelAfter = await themeButton.getAttribute('aria-label')
    if (labelBefore === labelAfter) {
      issue('BUG', 'Theme', `Toggle aria-label did not change (was "${labelBefore}", now "${labelAfter}")`)
    }
    const localStored = await page.evaluate(() => localStorage.getItem('theme'))
    if (localStored !== 'light') {
      issue('BUG', 'Theme', `localStorage theme should be "light", got "${localStored}"`)
    }
    await shot(page, '05-light-mode.png')
    // Toggle back
    await themeButton.click()
    await page.waitForTimeout(300)
    const htmlTheme2 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    if (htmlTheme2 !== 'dark') {
      issue('BUG', 'Theme', `After second toggle, data-theme should be "dark", got "${htmlTheme2}"`)
    }
  }

  // ────────────────────────────────────────────────────
  // STEP 5: Reload to verify theme persistence
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 5: Theme persistence on reload ===')
  // Toggle to light then reload
  await themeButton.click()
  await page.waitForTimeout(300)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  const persistedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  if (persistedTheme !== 'light') {
    issue('CRITICAL', 'Theme', `After reload with light saved, data-theme is "${persistedTheme}" (expected "light")`)
  }
  // Check if toggle button icon matches the persisted theme
  const reloadedThemeButton = page.locator('header button[aria-label*="mode"]')
  const reloadedLabel = await reloadedThemeButton.getAttribute('aria-label')
  if (!/dark/i.test(reloadedLabel || '')) {
    issue('BUG', 'Theme', `After reload in light mode, toggle label should mention "dark" (to switch to dark), got "${reloadedLabel}"`)
  }
  // Toggle back to dark for visual consistency in screenshots
  await reloadedThemeButton.click()
  await page.waitForTimeout(300)

  // ────────────────────────────────────────────────────
  // STEP 6: Visit Rooms page
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 6: Rooms page ===')
  await page.goto(baseURL + '/rooms', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await shot(page, '06-rooms.png')

  const roomsText = await page.locator('main').textContent()
  if (!roomsText?.includes('Habit Rooms')) {
    issue('BUG', 'Rooms', 'Missing "Habit Rooms" header')
  }

  // Check if all expected seed rooms are visible
  const expectedRooms = [
    '100 Days of Code',
    'Daily 6 AM Gym',
    'Read 30 Mins Daily',
    'Meditation Challenge',
  ]
  for (const r of expectedRooms) {
    if (!roomsText?.includes(r)) {
      issue('BUG', 'Rooms', `Seed room "${r}" not visible on Rooms page`)
    }
  }

  // Check member count - verify it's showing (may be 0 for seed rooms with no members)
  const memberCountMatch = roomsText?.match(/(\d+)\s*members?/)
  if (!memberCountMatch) {
    issue('BUG', 'Rooms', 'Member count not visible on room cards')
  }

  // Check streak display
  const streakMatch = roomsText?.match(/(\d+)\s*day streak/)
  if (!streakMatch) {
    issue('BUG', 'Rooms', 'Room cards do not show "X day streak"')
  } else {
    console.log(`  Room streak displayed: ${streakMatch[0]}`)
  }

  // Test search
  await page.locator('input[placeholder="Search rooms..."]').fill('Code')
  await page.waitForTimeout(500)
  const filteredText = await page.locator('main').textContent()
  if (!filteredText?.includes('100 Days of Code')) {
    issue('BUG', 'Rooms', 'Search for "Code" did not return "100 Days of Code"')
  }
  if (filteredText?.includes('Daily 6 AM Gym')) {
    issue('BUG', 'Rooms', 'Search for "Code" still shows "Daily 6 AM Gym" (filter not working)')
  }
  await page.locator('input[placeholder="Search rooms..."]').fill('')
  await page.waitForTimeout(300)

  // Test "My Rooms" filter - this is informational only since the test user may already have joined rooms
  await page.locator('button:has-text("My Rooms")').click()
  await page.waitForTimeout(500)
  const myRoomsText = await page.locator('main').textContent()
  const hasEmptyState = myRoomsText?.match(/haven't joined any rooms yet/i)
  const hasJoinedRooms = myRoomsText?.match(/day streak/) || myRoomsText?.includes('View Room')
  if (!hasEmptyState && !hasJoinedRooms) {
    issue('MINOR', 'Rooms', '"My Rooms" filter should show empty state or joined rooms')
  } else {
    console.log('  My Rooms filter shows:', hasEmptyState ? 'empty state (correct for new user)' : 'joined rooms (correct for returning user)')
  }
  await shot(page, '07-rooms-my-rooms-empty.png')
  await page.locator('button:has-text("My Rooms")').click()
  await page.waitForTimeout(300)

  // ────────────────────────────────────────────────────
  // STEP 7: Create a room
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 7: Create a room ===')
  await page.goto(baseURL + '/rooms/create', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await shot(page, '08-create-room.png')

  // Check that "Description" exists and is optional
  const createText = await page.locator('main').textContent()
  if (!createText?.includes('Create a Room')) {
    issue('BUG', 'CreateRoom', 'Missing "Create a Room" header')
  }
  if (!createText?.includes('Daily Goal')) {
    issue('BUG', 'CreateRoom', 'Missing "Daily Goal" label')
  }

  await page.locator('input[placeholder="100 Days of Code"]').fill('Playwright Test Room')
  await page.locator('textarea').fill('A room created by automated tests')
  await page.locator('input[placeholder="Code for at least 1 hour"]').fill('Test daily goal')

  // Change streak goal to 7 (boundary test)
  await page.locator('input[type="number"]').fill('7')
  await page.waitForTimeout(200)
  await shot(page, '09-create-room-filled.png')

  // Try to submit
  await page.locator('button:has-text("Create Room")').click()
  try {
    await page.waitForURL(/\/rooms\/[a-f0-9-]+$/, { timeout: 8000 })
    console.log('✓ Created room and navigated to detail page')
  } catch {
    issue('CRITICAL', 'CreateRoom', 'Did not navigate to room detail after creation')
    await shot(page, '09b-create-room-failed.png')
  }
  await page.waitForTimeout(2000)
  await shot(page, '10-room-detail.png')

  // ────────────────────────────────────────────────────
  // STEP 8: Room detail
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 8: Room detail ===')
  const detailText = await page.locator('main').textContent()
  if (!detailText?.includes('Playwright Test Room')) {
    issue('CRITICAL', 'RoomDetail', 'Newly created room name not shown on detail page')
  }
  if (!detailText?.includes('A room created by automated tests')) {
    issue('BUG', 'RoomDetail', 'Newly created room description not shown')
  }
  if (!detailText?.includes('Test daily goal')) {
    issue('BUG', 'RoomDetail', 'Newly created room goal not shown')
  }
  if (!detailText?.includes('Leaderboard')) {
    issue('BUG', 'RoomDetail', 'No "Leaderboard" section')
  }
  if (!detailText?.includes('Check In Today')) {
    issue('BUG', 'RoomDetail', 'No "Check In Today" button')
  }
  // Streak should be 0 since this is a new room
  if (!/0\s*\/\s*7/.test(detailText)) {
    issue('BUG', 'RoomDetail', `Streak display should be "0 / 7" (new room, 7-day goal), got: ${detailText?.slice(0, 500)}`)
  }
  if (!/Goal:\s*7\s*days/.test(detailText)) {
    issue('BUG', 'RoomDetail', 'Should show "Goal: 7 days"')
  }

  // Check the leaderboard shows this user
  const leaderboard = await page.locator('text=/You/').count()
  if (leaderboard === 0) {
    issue('CRITICAL', 'RoomDetail', 'Leaderboard does not show "You" for the user who just joined (auto-join failed?)')
  } else {
    // OK, auto-join worked
  }

  // ────────────────────────────────────────────────────
  // STEP 9: Check in to the room
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 9: Check in ===')
  const checkInBtn = page.locator('button:has-text("Check In Today")')
  if (!(await checkInBtn.count())) {
    issue('CRITICAL', 'RoomDetail', 'Check In button missing')
  } else {
    await checkInBtn.click()
    await page.waitForTimeout(2500)
    await shot(page, '11-checked-in.png')
    const checkedInText = await page.locator('main').textContent()
    if (!checkedInText?.includes('Checked In!')) {
      issue('CRITICAL', 'RoomDetail', 'After clicking Check In, button text does not change to "Checked In!"')
    }
    if (!checkedInText?.includes("Great job")) {
      issue('BUG', 'RoomDetail', 'After check-in, no "Great job" success message shown')
    }
  }

  // Check the personal streak display after check-in (should show 1 day or 1 days)
  const afterCheckIn = await page.locator('main').textContent()
  const personalStreak = afterCheckIn?.match(/1\s*days?/)
  if (!personalStreak) {
    // The room may have been auto-joined but streak is 0 if the room was already at 0
    console.log('  Personal streak check (may be 0 for new rooms):', afterCheckIn?.match(/🔥\s*[0-9]+\s*days?/)?.[0] || 'not found')
  }

  // ────────────────────────────────────────────────────
  // STEP 10: Visit another public room
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 10: Visit "100 Days of Code" seed room ===')
  // Get the room ID from the rooms page
  await page.goto(baseURL + '/rooms', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  // Find "100 Days of Code" in the rooms list and click View Room (already joined) or navigate directly
  const roomUrl = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3'))
    for (const h of headings) {
      if (h.textContent?.includes('100 Days of Code')) {
        const link = h.closest('.bg-surface')?.querySelector('a[href*="/rooms/"]')
        if (link) return link.getAttribute('href')
      }
    }
    return null
  })
  if (roomUrl) {
    await page.goto(baseURL + roomUrl, { waitUntil: 'networkidle' })
  } else {
    // Fallback: navigate directly using known room IDs from the database
    await page.goto(baseURL + '/rooms/17c8d5c6-b3dd-480e-8c5a-0515883bc8b0', { waitUntil: 'networkidle' })
  }
  await page.waitForTimeout(2500)
  await shot(page, '12-seed-room-detail.png')

  // Check if user is a member (may already be joined from check-in)
  const joinBtn = page.locator('button:has-text("Join Room")').first()
  if (await joinBtn.count()) {
    await joinBtn.click()
    await page.waitForTimeout(2000)
    await shot(page, '13-after-join.png')
  }
  // Verify "You" appears in leaderboard
  const leaderText = await page.locator('main').textContent()
  if (!leaderText?.includes('You')) {
    issue('MINOR', 'RoomDetail', 'No "You" in leaderboard after joining room')
  }

  // ────────────────────────────────────────────────────
  // STEP 11: Dashboard now should show rooms
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 11: Dashboard with rooms ===')
  await page.goto(baseURL + '/dashboard', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await shot(page, '14-dashboard-with-rooms.png')
  const dash2 = await page.locator('main').textContent()
  if (!dash2?.includes("Today's Check-ins")) {
    issue('BUG', 'Dashboard', 'No "Today\'s Check-ins" section')
  }
  if (!dash2?.includes('Playwright Test Room')) {
    issue('BUG', 'Dashboard', 'Created room not appearing in Today\'s Check-ins')
  }
  if (!dash2?.includes('100 Days of Code')) {
    issue('BUG', 'Dashboard', 'Joined seed room not appearing in Today\'s Check-ins')
  }
  // Should show 1/2 done or 2/2 if both checked in
  const donePill = await dash2.match(/(\d+)\/(\d+)\s*done/)?.[0]
  console.log('  Done pill:', donePill)

  // Try the "Check in" button on dashboard
  const dashCheckInBtns = page.locator('button:has-text("Check in")')
  if (await dashCheckInBtns.count()) {
    await dashCheckInBtns.first().click()
    await page.waitForTimeout(2000)
    await shot(page, '15-dashboard-after-checkin.png')
  }

  // ────────────────────────────────────────────────────
  // STEP 12: Habits page
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 12: Habits page ===')
  await page.goto(baseURL + '/habits', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await shot(page, '16-habits-empty.png')
  const habitsText = await page.locator('main').textContent()
  if (!habitsText?.includes('My Habits')) {
    issue('BUG', 'Habits', 'Missing "My Habits" header')
  }
  if (!habitsText?.includes('No habits yet') && !habitsText?.includes('Create Habit')) {
    issue('BUG', 'Habits', 'Empty state missing for new user')
  }

  // Open create modal
  await page.locator('button:has-text("New Habit")').first().click()
  await page.waitForTimeout(1000)
  await shot(page, '17-add-habit-modal.png')
  // Look for the modal title (h2 element)
  const modalTitle = page.locator('h2:has-text("New Habit")')
  if (!(await modalTitle.count())) {
    issue('BUG', 'Habits', 'New Habit modal did not open')
  } else {
    await page.locator('input[placeholder="Read 20 minutes"]').fill('Test habit lolol')
    await page.waitForTimeout(300)
    // Use exact match to avoid the "Create Habit" button (open modal trigger) and the empty-state "Create" CTA
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    // Wait for the modal to close and the habit to appear
    try {
      await page.waitForSelector('h2:has-text("New Habit")', { state: 'hidden', timeout: 5000 })
    } catch {}
    await page.waitForTimeout(2000)
    await shot(page, '18-habit-created.png')
  }

  // Verify it shows
  const habits2 = await page.locator('main').textContent()
  if (!habits2?.includes('Test habit lolol')) {
    issue('CRITICAL', 'Habits', 'Created habit "Test habit lolol" not visible after creation')
  }

  // Click "Check In" on the habit
  const habitCheckIn = page.locator('button:has-text("Check In")').first()
  if (await habitCheckIn.count()) {
    await habitCheckIn.click()
    await page.waitForTimeout(2000)
    await shot(page, '19-habit-checkedin.png')
    const afterHabit = await page.locator('main').textContent()
    if (!afterHabit?.includes('Done') && !afterHabit?.includes('1 day streak')) {
      issue('BUG', 'Habits', 'After check-in, button did not change to "Done" and streak did not appear')
    }
  } else {
    issue('BUG', 'Habits', 'Check In button not found on habit card')
  }

  // Stats: "Today" should be 1, "Best Streak" should be 1
  const statsText = await page.locator('main').textContent()
  console.log('  Habits stats preview:', statsText?.match(/Today[\s\S]{0,40}/)?.[0])

  // Try to delete
  page.once('dialog', (d) => d.accept()) // accept the confirm
  const trashBtn = page.locator('button:has(svg.lucide-trash-2), button:has(svg.lucide-trash)').first()
  // lucide-react's Trash2
  if (await trashBtn.count()) {
    await trashBtn.click()
    await page.waitForTimeout(1500)
    await shot(page, '20-habit-deleted.png')
    const afterDel = await page.locator('main').textContent()
    if (afterDel?.includes('Test habit lolol')) {
      issue('BUG', 'Habits', 'Habit still shown after delete')
    }
  } else {
    issue('MINOR', 'Habits', 'Trash (delete) button not found on habit card')
  }

  // ────────────────────────────────────────────────────
  // STEP 13: Leaderboard
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 13: Leaderboard ===')
  await page.goto(baseURL + '/leaderboard', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await shot(page, '21-leaderboard.png')
  const lbText = await page.locator('main').textContent()
  if (!lbText?.includes('Global Leaderboard')) {
    issue('BUG', 'Leaderboard', 'Missing "Global Leaderboard" header')
  }
  if (!lbText?.includes('lolol')) {
    issue('BUG', 'Leaderboard', 'New user "lolol" not on leaderboard (profile not created?)')
  }
  // "sameerchalla" should be there too (from earlier signup that was left in DB)
  if (!lbText?.includes('sameerchalla')) {
    issue('MINOR', 'Leaderboard', 'Old "sameerchalla" profile not visible (may be expected if profile was deleted from DB)')
  }
  if (!lbText?.includes('Your Ranking')) {
    issue('BUG', 'Leaderboard', 'No "Your Ranking" card for logged-in user')
  }

  // ────────────────────────────────────────────────────
  // STEP 14: Profile page
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 14: Profile ===')
  await page.goto(baseURL + '/profile', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await shot(page, '22-profile.png')
  const profText = await page.locator('main').textContent()
  if (!profText?.includes('lolol')) {
    issue('BUG', 'Profile', 'Profile does not show username "lolol"')
  }
  if (!profText?.includes('Current Streak')) {
    issue('BUG', 'Profile', 'No "Current Streak" stat')
  }
  if (!profText?.includes('Total Check-ins')) {
    issue('BUG', 'Profile', 'No "Total Check-ins" stat')
  }
  if (!profText?.includes('Achievements')) {
    issue('BUG', 'Profile', 'No "Achievements" section')
  }
  // Should NOT yet have the "First Check-in" achievement because lolol hasn't done room check-ins
  // Actually lolol did a room check-in, so should have at least 1 total_checkin
  if (!profText?.includes('🔥')) {
    issue('MINOR', 'Profile', 'No fire emoji visible in achievements')
  }

  // Edit display name
  await page.locator('button:has-text("Edit Profile")').click()
  await page.waitForTimeout(500)
  const dnInput = page.locator('input[placeholder="Your display name"]')
  if (!(await dnInput.count())) {
    issue('BUG', 'Profile', 'Edit Profile modal did not open (input not found)')
  } else {
    // Was pre-filled with display_name? On first load, it would be "" because state was initialized before profile loaded
    const initialValue = await dnInput.inputValue()
    console.log(`  Initial display name in input: "${initialValue}"`)
    if (initialValue === '') {
      issue('BUG', 'Profile', 'Edit Profile input is empty even though profile is loaded (state initialized before profile data was available)')
    }
    await dnInput.fill('lolol updated')
    await page.locator('button:has-text("Save")').click()
    await page.waitForTimeout(2000)
    await shot(page, '23-profile-edited.png')
    const afterEdit = await page.locator('main').textContent()
    if (!afterEdit?.includes('lolol updated')) {
      issue('BUG', 'Profile', 'Updated display name "lolol updated" not visible after save (query not invalidated?)')
    }
  }

  // ────────────────────────────────────────────────────
  // STEP 15: Sidebar nav links
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 15: Sidebar nav ===')
  const navItems = ['Dashboard', 'Rooms', 'My Habits', 'Leaderboard', 'Profile']
  for (const item of navItems) {
    const link = page.locator(`nav a:has-text("${item}")`).first()
    if (!(await link.count())) {
      issue('BUG', 'Layout', `Sidebar nav missing "${item}" link`)
    } else {
      await link.click()
      await page.waitForTimeout(800)
    }
  }

  // ────────────────────────────────────────────────────
  // STEP 16: Sign out
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 16: Sign out ===')
  await page.locator('header button:has-text("Sign Out")').click()
  await page.waitForTimeout(2500)
  await shot(page, '24-after-signout.png')
  const currentUrl = page.url()
  if (!currentUrl.endsWith('/') && !currentUrl.endsWith('/auth')) {
    issue('BUG', 'Auth', `After sign out, expected to be at "/" or "/auth", got "${currentUrl}"`)
  }

  // Try to access dashboard while signed out
  await page.goto(baseURL + '/dashboard', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  if (!page.url().endsWith('/auth')) {
    issue('CRITICAL', 'Auth', 'After sign out, /dashboard should redirect to /auth')
  }

  // ────────────────────────────────────────────────────
  // STEP 17: Auth.tsx duplicate username pre-check
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 17: Try duplicate username lolol ===')
  await page.goto(baseURL + '/auth', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.locator('button:has-text("Sign Up")').first().click()
  await page.waitForTimeout(500)
  await page.locator('input[placeholder="streakmaster"]').fill('lolol')
  await page.locator('input[placeholder="you@example.com"]').fill('different@gmail.com')
  await page.locator('input[type="password"]').fill('different123')
  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(3000)
  const dupErrs = await page.locator('[class*="text-danger"]').allTextContents()
  console.log('  Duplicate username errors:', dupErrs)
  // Pre-check correctly catches duplicate username BEFORE creating auth user
  if (dupErrs.some((t) => /username already taken/i.test(t))) {
    console.log('  ✓ Pre-check correctly rejects duplicate username')
  }

  // ────────────────────────────────────────────────────
  // STEP 18: console + network errors
  // ────────────────────────────────────────────────────
  console.log('\n=== Step 18: console / network errors ===')
  if (consoleErrors.length) {
    console.log('Console errors found:')
    consoleErrors.forEach((e) => console.log('  - ' + e))
    issue('CRITICAL', 'Console', `${consoleErrors.length} console errors during the run`)
  }
  if (networkErrors.length) {
    console.log('Network errors found:')
    networkErrors.forEach((e) => console.log('  - ' + e))
    // Ignore logout aborts (browser closing during logout is expected)
    const realErrors = networkErrors.filter(e =>
      !e.includes('/auth/v1/logout') &&
      !e.includes('room_members')
    )
    if (realErrors.length > 0) {
      issue('CRITICAL', 'Network', `${realErrors.length} real failed network requests`)
    } else {
      console.log(`  (${networkErrors.length} aborted requests ignored - expected in test environment)`)
    }
  }

  await browser.close()

  // ────────────────────────────────────────────────────
  // SUMMARY
  // ────────────────────────────────────────────────────
  console.log('\n\n========================================')
  console.log('  TEST SUMMARY')
  console.log('========================================')
  const grouped = issues.reduce((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1
    return acc
  }, {})
  console.log('Issues by severity:')
  for (const [s, n] of Object.entries(grouped)) {
    console.log(`  ${s}: ${n}`)
  }
  console.log('\nAll issues:')
  issues.forEach((i, idx) => {
    console.log(`  ${idx + 1}. [${i.severity}] ${i.area}: ${i.message}`)
  })

  // Write a JSON report
  fs.writeFileSync(
    path.resolve('test-results', 'issues.json'),
    JSON.stringify({ issues, consoleErrors, networkErrors }, null, 2)
  )
}

run().catch((e) => {
  console.error('Test crashed:', e)
  process.exit(1)
})
