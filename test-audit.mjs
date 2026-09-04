import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const EMAIL = 'lol@gmail.com'
const PASSWORD = 'lol123'
const USERNAME = 'lolol'
const DISPLAY_NAME = 'lolol'

const issues = []
const passes = []
const infos = []

function log(type, msg) {
  const ts = new Date().toISOString().split('T')[1].slice(0, 8)
  console.log(`[${ts}] [${type.toUpperCase()}] ${msg}`)
  if (type === 'issue') issues.push(msg)
  else if (type === 'pass') passes.push(msg)
  else infos.push(msg)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  // Capture console errors
  const consoleErrors = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // ─── SIGN UP ───────────────────────────────────────────────────────────────
  log('info', '=== SIGNING UP ===')
  await page.goto(`${BASE}/auth`)
  await page.waitForLoadState('networkidle')

  // Switch to Sign Up tab
  await page.locator('button:has-text("Sign Up")').first().click()
  await page.waitForTimeout(500)

  // Fill signup form
  await page.fill('input[type="text"][required]', USERNAME)
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2000)

  // ─── SIGN IN ──────────────────────────────────────────────────────────────
  log('info', '=== SIGNING IN ===')

  const currentUrl = page.url()
  if (currentUrl.includes('/auth')) {
    // Switch to sign in
    await page.locator('button:has-text("Sign In")').first().click()
    await page.waitForTimeout(300)
    await page.fill('input[type="email"]', EMAIL)
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
  }

  try {
    await page.waitForURL(/dashboard/, { timeout: 15000 })
    log('pass', `Logged in successfully → ${page.url()}`)
  } catch (e) {
    const errEl = page.locator('.bg-danger\\/10').first()
    if (await errEl.count() > 0) {
      log('issue', `Login failed: ${(await errEl.textContent())?.trim()}`)
    } else {
      log('issue', `Login timed out — current URL: ${page.url()}`)
    }
    await browser.close()
    return
  }

  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  // ─── AUDIT: DASHBOARD ────────────────────────────────────────────────────
  log('info', '\n=== AUDITING: DASHBOARD ===')
  await page.goto(`${BASE}/dashboard`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // 1. No placeholder text
  const dashText = await page.textContent('body')
  const suspicious = [
    'streakmaster', 'Code Queen', 'Dev Master', 'Byte Wizard',
    'consistencyking', 'streakqueen', 'dailygrinder', 'habithero',
    'consistency king', 'streak queen', 'drink 8 glasses', 'meditate 10',
  ]
  const found = suspicious.filter(p => dashText?.toLowerCase().includes(p.toLowerCase()))
  if (found.length) log('issue', `Dashboard has placeholder text: ${found.join(', ')}`)
  else log('pass', 'Dashboard: no placeholder text')

  // 2. Greeting
  const greeting = await page.locator('h1').first().textContent()
  if (greeting?.includes('Hey, lolol')) log('pass', `Dashboard greeting correct: "${greeting?.trim()}"`)
  else if (greeting?.includes('Hey,')) log('issue', `Dashboard greeting wrong: "${greeting}" — expected "Hey, lolol"`)
  else log('issue', `Dashboard greeting missing: "${greeting}"`)

  // 3. Streak display
  const streakEl = await page.locator('.font-mono.text-accent').first()
  if (await streakEl.count() > 0) {
    const streak = await streakEl.textContent()
    if (streak?.trim() === '0') log('pass', `Dashboard: current streak correctly shows 0 for new user`)
    else log('issue', `Dashboard streak: "${streak?.trim()}"`)
  }

  // 4. New user empty state
  const noRoomsEl = await page.locator('text=No rooms yet').first()
  if (await noRoomsEl.count() > 0) {
    log('pass', 'Dashboard: new user correctly sees "No rooms yet"')
  } else {
    log('issue', 'Dashboard: should show "No rooms yet" for new user')
  }

  // 5. Level
  const levelEl = await page.locator('text=/Level \\d+/').first()
  if (await levelEl.count() > 0) {
    const level = await levelEl.textContent()
    log('pass', `Dashboard: ${level?.trim()}`)
  } else {
    log('issue', 'Dashboard: Level not displayed')
  }

  // 6. Done counter
  const doneCounter = await page.locator('text=/\\d+\\/\\d+ done/').first()
  if (await doneCounter.count() > 0) {
    const counter = await doneCounter.textContent()
    log('pass', `Dashboard done counter: "${counter?.trim()}"`)
  } else {
    log('issue', 'Dashboard: done counter not found')
  }

  // 7. Total XP
  const xpEl = await page.locator('text=/XP total/i').first()
  if (await xpEl.count() > 0) {
    log('pass', `Dashboard: "${(await xpEl.textContent())?.trim()}"`)
  } else {
    log('issue', 'Dashboard: XP total not shown')
  }

  // 8. Quick action links
  const createRoomLink = await page.locator('a:has-text("Create a Room")').first()
  if (await createRoomLink.count() > 0) log('pass', 'Dashboard: "Create a Room" quick action present')
  else log('issue', 'Dashboard: "Create a Room" quick action missing')

  const trackHabitsLink = await page.locator('a:has-text("Track Habits")').first()
  if (await trackHabitsLink.count() > 0) log('pass', 'Dashboard: "Track Habits" quick action present')
  else log('issue', 'Dashboard: "Track Habits" quick action missing')

  // 9. Stats grid (4 cards)
  const statCards = await page.locator('[class*="grid-cols-2"] [class*="rounded-xl"]').count()
  log('info', `Dashboard: ${statCards} stat cards`)

  // ─── AUDIT: ROOMS ────────────────────────────────────────────────────────
  log('info', '\n=== AUDITING: ROOMS ===')
  await page.goto(`${BASE}/rooms`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // 1. No placeholder text
  const roomsText = await page.textContent('body')
  const roomsFound = suspicious.filter(p => roomsText?.toLowerCase().includes(p.toLowerCase()))
  if (roomsFound.length) log('issue', `Rooms has placeholder text: ${roomsFound.join(', ')}`)
  else log('pass', 'Rooms: no placeholder text')

  // 2. Header
  const roomsHeader = await page.locator('h1').first().textContent()
  if (roomsHeader?.includes('Habit Rooms')) log('pass', 'Rooms header correct')
  else log('issue', `Rooms header wrong: "${roomsHeader}"`)

  // 3. Search input
  const searchInput = await page.locator('input[placeholder*="Search"]').first()
  if (await searchInput.count() > 0) {
    log('pass', 'Rooms: search input present')
    // Test search filters rooms
    const roomCardsBefore = await page.locator('a[href*="/rooms/"]').count()
    await searchInput.fill('XYZNEVERMATCH')
    await page.waitForTimeout(500)
    const roomCardsAfter = await page.locator('a[href*="/rooms/"]').count()
    if (roomCardsAfter < roomCardsBefore) {
      log('pass', `Rooms search works: ${roomCardsBefore} → ${roomCardsAfter} rooms after search`)
    } else if (roomCardsBefore === 0) {
      log('info', 'Rooms search: 0 rooms to filter')
    } else {
      log('issue', `Rooms search not filtering: ${roomCardsBefore} before, ${roomCardsAfter} after`)
    }
    await searchInput.clear()
    await page.waitForTimeout(300)
  } else {
    log('issue', 'Rooms: search input missing')
  }

  // 4. My Rooms toggle
  const myRoomsBtn = await page.locator('button:has-text("My Rooms")').first()
  if (await myRoomsBtn.count() > 0) {
    log('pass', 'Rooms: "My Rooms" filter present')
    // Toggle it
    await myRoomsBtn.click()
    await page.waitForTimeout(500)
    // New user has no rooms — should show empty state
    const emptyState = await page.locator("text=/You haven't joined any rooms yet|No rooms found/i").first()
    if (await emptyState.count() > 0) {
      log('pass', 'Rooms: "My Rooms" filter shows empty state for new user')
    } else {
      const visibleRooms = await page.locator('a[href*="/rooms/"]').count()
      if (visibleRooms > 0) {
        log('issue', `Rooms: "My Rooms" filter showing ${visibleRooms} rooms for new user with 0 joined`)
      } else {
        log('info', 'Rooms: "My Rooms" filter shows no rooms (good) but no empty state shown')
      }
    }
    // Toggle off
    await myRoomsBtn.click()
    await page.waitForTimeout(500)
  } else {
    log('issue', 'Rooms: "My Rooms" filter button missing')
  }

  // 5. Create Room button
  const createRoomBtn = await page.locator('a:has-text("Create Room")').first()
  if (await createRoomBtn.count() > 0) {
    log('pass', 'Rooms: "Create Room" button present')
  } else {
    log('issue', 'Rooms: "Create Room" button missing')
  }

  // 6. Check room cards (exclude /rooms/create)
  const allRoomLinks = await page.locator('a[href*="/rooms/"]:not([href*="/rooms/create"])').all()
  log('info', `Rooms: ${allRoomLinks.length} actual room links (excluding Create Room button)`)

  // If no rooms, the empty state should show
  if (allRoomLinks.length === 0) {
    const noRoomsEmpty = await page.locator('text=/No rooms found/i').first()
    if (await noRoomsEmpty.count() > 0) {
      log('pass', 'Rooms: empty state shown correctly when no rooms')
    } else {
      log('issue', 'Rooms: no room cards AND no empty state — broken state')
    }
  }

  // 7. Check first room card details (if any)
  if (allRoomLinks.length > 0) {
    const firstCard = allRoomLinks[0]
    const cardText = await firstCard.textContent()
    log('info', `First room card preview: "${cardText?.trim().slice(0, 100)}..."`)

    // Check for member count
    if (cardText?.match(/\d+\s*members?/)) {
      log('pass', 'Rooms: room card shows member count')
    } else {
      log('issue', `Rooms: room card missing member count: "${cardText?.slice(0, 200)}"`)
    }

    // Check for streak
    if (cardText?.match(/day streak/i)) {
      log('pass', 'Rooms: room card shows streak')
    } else {
      log('issue', `Rooms: room card missing streak: "${cardText?.slice(0, 200)}"`)
    }

    // Check for join button
    const joinBtn = await page.locator('button:has-text("Join Room")').count()
    log('info', `Rooms: ${joinBtn} "Join Room" buttons visible`)
  }

  // ─── AUDIT: CREATE ROOM ──────────────────────────────────────────────────
  log('info', '\n=== AUDITING: CREATE ROOM ===')
  await page.goto(`${BASE}/rooms/create`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // 1. Check form elements
  const formLabels = ['Room Name', 'Description', 'Daily Goal', 'Streak Goal', 'Room Icon', 'Room Color', 'Check-in Frequency']
  for (const label of formLabels) {
    const el = await page.locator(`text=${label}`).first()
    if (await el.count() > 0) {
      log('pass', `Create Room: "${label}" field present`)
    } else {
      log('issue', `Create Room: "${label}" field missing`)
    }
  }

  // 2. Create a room
  const uniqueRoomName = `AuditTestRoom_${Date.now()}`
  await page.fill('input[placeholder*="100 Days of Code"]', uniqueRoomName)
  await page.fill('textarea[placeholder*="Learn to code"]', 'Audit test room description')
  await page.fill('input[placeholder*="Code for at least"]', 'Test daily goal')
  // Pick a different icon (e.g., the 3rd one)
  const iconButtons = await page.locator('button[type="button"]:has-text("📚")').all()
  if (iconButtons.length > 0) {
    await iconButtons[0].click()
  }
  // Pick a different color
  const colorButtons = await page.locator('button[title="Green"]').all()
  if (colorButtons.length > 0) {
    await colorButtons[0].click()
  }

  // 3. Submit
  await page.click('button[type="submit"]:has-text("Create Room")')
  await page.waitForTimeout(3000)
  const afterCreate = page.url()
  if (afterCreate.match(/\/rooms\/[a-f0-9-]+/i)) {
    log('pass', `Create Room: navigated to ${afterCreate}`)
  } else if (afterCreate.includes('/rooms/create')) {
    const errEl = page.locator('.text-danger, [class*="danger"]').first()
    if (await errEl.count() > 0 && await errEl.isVisible()) {
      log('issue', `Create Room: error shown: ${(await errEl.textContent())?.trim()}`)
    } else {
      log('issue', `Create Room: still on create page (${afterCreate}) — submission failed`)
    }
  } else {
    log('issue', `Create Room: unexpected URL after submit: ${afterCreate}`)
  }

  // ─── AUDIT: ROOM DETAIL (just created) ───────────────────────────────────
  log('info', '\n=== AUDITING: ROOM DETAIL (just created) ===')
  if (page.url().match(/\/rooms\/[a-f0-9-]+/i)) {
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 1. Room name
    const roomName = await page.locator('h1').first().textContent()
    if (roomName?.includes(uniqueRoomName)) log('pass', `Room Detail: name shown as "${roomName?.trim()}"`)
    else log('issue', `Room Detail: name "${roomName?.trim()}" doesn't match created "${uniqueRoomName}"`)

    // 2. Goal displayed
    const goalText = await page.locator('text=Test daily goal').first()
    if (await goalText.count() > 0) log('pass', 'Room Detail: daily goal shown in check-in section')
    else log('issue', 'Room Detail: daily goal not shown')

    // 3. Streak counter
    const roomStreak = await page.locator('text=Room Streak').first()
    if (await roomStreak.count() > 0) {
      log('pass', 'Room Detail: "Room Streak" label present')
    } else {
      log('issue', 'Room Detail: "Room Streak" label missing')
    }

    // 4. Members count (creator should be a member after auto-join)
    const membersCount = await page.locator('text=Members').first()
    if (await membersCount.count() > 0) {
      log('pass', 'Room Detail: "Members" label present')
    } else {
      log('issue', 'Room Detail: "Members" label missing')
    }

    // 5. Check-in button
    const checkInBtn = await page.locator('button:has-text("Check In Today")').first()
    if (await checkInBtn.count() > 0) {
      log('pass', 'Room Detail: "Check In Today" button present')

      // Click it
      await checkInBtn.click()
      await page.waitForTimeout(2000)

      // Check it changed
      const afterClick = await page.locator('button:has-text("Checked In!")').first()
      if (await afterClick.count() > 0) {
        log('pass', 'Room Detail: check-in successful — button changed to "Checked In!"')
      } else {
        log('issue', 'Room Detail: check-in did not change button state')
      }
    } else {
      log('issue', 'Room Detail: check-in button missing')
    }

    // 6. Leaderboard
    const leaderboardH = await page.locator('h2:has-text("Leaderboard")').first()
    if (await leaderboardH.count() > 0) {
      log('pass', 'Room Detail: "Leaderboard" heading present')

      // Check for self in leaderboard
      const selfInLb = await page.locator('span:has-text("You")').first()
      if (await selfInLb.count() > 0) {
        log('pass', 'Room Detail: current user appears in leaderboard with "You" badge')
      } else {
        log('issue', 'Room Detail: current user should appear in leaderboard')
      }

      // Check streak count
      const streakNumber = await page.locator('text=/^\\s*1\\s*$/').first()
      if (await streakNumber.count() > 0) {
        log('pass', 'Room Detail: leaderboard shows streak=1 after check-in')
      }
    } else {
      log('issue', 'Room Detail: "Leaderboard" heading missing')
    }

    // 7. Back button
    const backBtn = await page.locator('a:has-text("Back to Rooms")').first()
    if (await backBtn.count() > 0) log('pass', 'Room Detail: "Back to Rooms" link present')
    else log('issue', 'Room Detail: "Back to Rooms" link missing')

    // 8. Room progress bar
    const progressText = await page.locator('text=/0.*30.*days|0% complete/').first()
    if (await progressText.count() > 0) {
      log('pass', `Room Detail: progress shows ${(await progressText.textContent())?.trim()}`)
    } else {
      log('info', 'Room Detail: progress text not found (may be 0/30 default)')
    }
  } else {
    log('issue', 'Room Detail: could not navigate to created room')
  }

  // ─── AUDIT: JOIN AN EXISTING ROOM ────────────────────────────────────────
  log('info', '\n=== AUDITING: JOIN EXISTING ROOM ===')
  await page.goto(`${BASE}/rooms`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // Find a room with "Join Room" button
  const joinBtns = await page.locator('button:has-text("Join Room")').all()
  if (joinBtns.length > 0) {
    log('info', `Found ${joinBtns.length} rooms to join`)
    await joinBtns[0].click()
    await page.waitForTimeout(3000)

    // Check if the button changed
    const afterJoin = await page.locator('button:has-text("Join Room")').count()
    if (afterJoin < joinBtns.length) {
      log('pass', `Join Room: button disappeared after click (${joinBtns.length} → ${afterJoin})`)
    } else {
      log('issue', `Join Room: button still visible after click (${afterJoin})`)
    }

    // Navigate to dashboard, verify the joined room appears
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    const dashHasRoom = await page.locator('[class*="rounded-2xl"][class*="border"]').count()
    log('info', `Dashboard: ${dashHasRoom} room cards after joining`)
  } else {
    log('info', 'Join Room: no rooms with "Join Room" button (all already joined)')
  }

  // ─── AUDIT: HABITS ────────────────────────────────────────────────────────
  log('info', '\n=== AUDITING: HABITS ===')
  await page.goto(`${BASE}/habits`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // 1. No placeholder text
  const habitsText = await page.textContent('body')
  const habitsFound = suspicious.filter(p => habitsText?.toLowerCase().includes(p.toLowerCase()))
  if (habitsFound.length) log('issue', `Habits has placeholder text: ${habitsFound.join(', ')}`)
  else log('pass', 'Habits: no placeholder text')

  // 2. Header
  const habitsHeader = await page.locator('h1').first().textContent()
  if (habitsHeader?.includes('My Habits')) log('pass', 'Habits header correct')
  else log('issue', `Habits header wrong: "${habitsHeader}"`)

  // 3. New user empty state
  const emptyHabits = await page.locator('text=/No habits yet|Create your first/i').first()
  if (await emptyHabits.count() > 0) {
    log('pass', 'Habits: new user sees "No habits yet" empty state')
  } else {
    log('issue', 'Habits: should show empty state for new user')
  }

  // 4. Create Habit button
  const newHabitBtn = await page.locator('button:has-text("New Habit")').first()
  if (await newHabitBtn.count() > 0) {
    log('pass', 'Habits: "New Habit" button present')

    // Open modal
    await newHabitBtn.click()
    await page.waitForTimeout(500)

    const modalTitle = await page.locator('text=New Habit').first()
    if (await modalTitle.count() > 0) {
      log('pass', 'Habits: modal opens with title "New Habit"')

      // Fill habit
      const habitName = `TestHabit_${Date.now()}`
      await page.fill('input[placeholder*="Read 20"]', habitName)
      // Submit — click the Create button inside the fixed-position modal overlay
      await page.locator('.fixed.inset-0 button:has-text("Create")').first().click()
      await page.waitForTimeout(2000)

      // Check it appears
      const habitCard = await page.locator(`text=${habitName}`).first()
      if (await habitCard.count() > 0) {
        log('pass', `Habits: created habit "${habitName}" appears in list`)
      } else {
        log('issue', `Habits: habit "${habitName}" not visible after creation`)
      }

      // Now test the check-in button
      const checkInHabitBtn = await page.locator('button:has-text("Check In")').first()
      if (await checkInHabitBtn.count() > 0) {
        await checkInHabitBtn.click()
        await page.waitForTimeout(2000)
        const doneBtn = await page.locator('button:has-text("Done")').first()
        if (await doneBtn.count() > 0) {
          log('pass', 'Habits: check-in button changed to "Done"')
        } else {
          log('issue', 'Habits: check-in did not update button')
        }
      } else {
        log('info', 'Habits: no Check In button found (may already be done)')
      }
    } else {
      log('issue', 'Habits: modal did not open')
    }
  } else {
    log('issue', 'Habits: "New Habit" button missing')
  }

  // 5. Stats grid (Total, Today, Best Streak, Rate)
  const totalLabel = await page.locator('text=/^Total$/').first()
  const todayLabel = await page.locator('text=/^Today$/').first()
  const bestLabel = await page.locator('text=/Best Streak/i').first()
  const rateLabel = await page.locator('text=/^Rate$/').first()

  if (await totalLabel.count() > 0) log('pass', 'Habits: "Total" stat present')
  if (await todayLabel.count() > 0) log('pass', 'Habits: "Today" stat present')
  if (await bestLabel.count() > 0) log('pass', 'Habits: "Best Streak" stat present')
  if (await rateLabel.count() > 0) log('pass', 'Habits: "Rate" stat present')

  // ─── AUDIT: LEADERBOARD ──────────────────────────────────────────────────
  log('info', '\n=== AUDITING: LEADERBOARD ===')
  await page.goto(`${BASE}/leaderboard`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // 1. No placeholder text
  const lbText = await page.textContent('body')
  const lbFound = suspicious.filter(p => lbText?.toLowerCase().includes(p.toLowerCase()))
  if (lbFound.length) log('issue', `Leaderboard has placeholder text: ${lbFound.join(', ')}`)
  else log('pass', 'Leaderboard: no placeholder text')

  // 2. Header
  const lbHeader = await page.locator('h1').first().textContent()
  if (lbHeader?.includes('Leaderboard')) log('pass', 'Leaderboard header correct')
  else log('issue', `Leaderboard header wrong: "${lbHeader}"`)

  // 3. Should show other users
  const userRows = await page.locator('text=/@\\w+/').all()
  log('info', `Leaderboard: ${userRows.length} users visible`)
  if (userRows.length > 1) {
    log('pass', 'Leaderboard: multiple users shown')
  } else if (userRows.length === 1) {
    log('issue', 'Leaderboard: only 1 user shown (expected multiple)')
  } else {
    log('info', 'Leaderboard: no users with @username (display_name only?)')
  }

  // 4. Current user "You" badge
  const youBadge = await page.locator('text="You"').first()
  if (await youBadge.count() > 0) {
    log('pass', 'Leaderboard: "You" badge shown for current user')
  } else {
    log('issue', 'Leaderboard: "You" badge missing')
  }

  // 5. Top 3 podium
  const top3 = await page.locator('text=TOP STREAK').first()
  if (await top3.count() > 0) log('pass', 'Leaderboard: top streak label shown')

  // 6. Sorted by streak
  const sortedLabel = await page.locator('text=/Sorted by streak/').first()
  if (await sortedLabel.count() > 0) log('pass', 'Leaderboard: "Sorted by streak" label shown')

  // ─── AUDIT: PROFILE ─────────────────────────────────────────────────────
  log('info', '\n=== AUDITING: PROFILE ===')
  await page.goto(`${BASE}/profile`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // 1. No placeholder text
  const profileText = await page.textContent('body')
  const profileFound = suspicious.filter(p => profileText?.toLowerCase().includes(p.toLowerCase()))
  if (profileFound.length) log('issue', `Profile has placeholder text: ${profileFound.join(', ')}`)
  else log('pass', 'Profile: no placeholder text')

  // 2. Username
  const usernameEl = await page.locator('text=@lolol').first()
  if (await usernameEl.count() > 0) log('pass', 'Profile: @lolol username shown')
  else log('issue', 'Profile: @lolol username not found')

  // 3. Display name
  const displayNameEl = await page.locator('h1').first()
  if (await displayNameEl.count() > 0) {
    const name = await displayNameEl.textContent()
    if (name?.includes('lolol') || name?.includes('Lolol')) {
      log('pass', `Profile: display name "${name?.trim()}"`)
    } else {
      log('issue', `Profile: display name unexpected: "${name}"`)
    }
  }

  // 4. Member since
  const memberSince = await page.locator('text=/Member since/').first()
  if (await memberSince.count() > 0) {
    const memberSinceText = await memberSince.textContent()
    log('pass', `Profile: "${memberSinceText?.trim()}"`)
  } else {
    log('issue', 'Profile: "Member since" missing')
  }

  // 5. Level
  const levelBadge = await page.locator('text=/Level \\d+/').first()
  if (await levelBadge.count() > 0) {
    const level = await levelBadge.textContent()
    log('pass', `Profile: ${level?.trim()}`)
  }

  // 6. Stats grid (4 cards)
  const currentStreak = await page.locator('text=/Current Streak/i').first()
  const longestStreak = await page.locator('text=/Longest Streak/i').first()
  const totalCheckins = await page.locator('text=/Total Check-ins/i').first()
  const thisWeek = await page.locator('text=/This Week/i').first()

  if (await currentStreak.count() > 0) log('pass', 'Profile: "Current Streak" stat present')
  if (await longestStreak.count() > 0) log('pass', 'Profile: "Longest Streak" stat present')
  if (await totalCheckins.count() > 0) log('pass', 'Profile: "Total Check-ins" stat present')
  if (await thisWeek.count() > 0) log('pass', 'Profile: "This Week" stat present')

  // 7. Heatmap
  const heatmap = await page.locator('text=/Activity Heatmap/i').first()
  if (await heatmap.count() > 0) log('pass', 'Profile: "Activity Heatmap" section present')
  else log('issue', 'Profile: "Activity Heatmap" missing')

  // 8. Monthly overview
  const monthly = await page.locator('text=/Monthly Overview/i').first()
  if (await monthly.count() > 0) log('pass', 'Profile: "Monthly Overview" section present')
  else log('issue', 'Profile: "Monthly Overview" missing')

  // 9. Achievements
  const achievements = await page.locator('h2:has-text("Achievements")').first()
  if (await achievements.count() > 0) {
    log('pass', 'Profile: achievements section present')
  } else {
    log('issue', 'Profile: achievements section missing')
  }

  // 10. Edit Profile button
  const editBtn = await page.locator('button:has-text("Edit Profile")').first()
  if (await editBtn.count() > 0) log('pass', 'Profile: "Edit Profile" button present')
  else log('issue', 'Profile: "Edit Profile" button missing')

  // ─── AUDIT: NAVIGATION ───────────────────────────────────────────────────
  log('info', '\n=== AUDITING: NAVIGATION ===')
  await page.goto(`${BASE}/dashboard`)
  await page.waitForLoadState('networkidle')

  // Desktop sidebar
  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/rooms', label: 'Rooms' },
    { path: '/habits', label: 'My Habits' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/profile', label: 'Profile' },
  ]

  for (const nav of navItems) {
    const link = await page.locator(`nav a[href="${nav.path}"]`).first()
    if (await link.count() > 0) {
      log('pass', `Nav: "${nav.label}" link present`)
    } else {
      log('issue', `Nav: "${nav.label}" link missing from sidebar`)
    }
  }

  // Sign Out button
  const signOutBtn = await page.locator('button:has-text("Sign Out")').first()
  if (await signOutBtn.count() > 0) log('pass', 'Nav: "Sign Out" button present')
  else log('issue', 'Nav: "Sign Out" button missing')

  // Test that clicking each nav link works
  for (const nav of navItems) {
    await page.locator(`nav a[href="${nav.path}"]`).first().click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    if (page.url().endsWith(nav.path)) {
      log('pass', `Nav click: "${nav.label}" → ${nav.path}`)
    } else {
      log('issue', `Nav click: "${nav.label}" expected ${nav.path}, got ${page.url()}`)
    }
  }

  // ─── AUDIT: AUTH PAGE (logged out) ───────────────────────────────────────
  log('info', '\n=== AUDITING: AUTH (logged out) ===')
  await page.locator('button:has-text("Sign Out")').first().click()
  await page.waitForTimeout(2000)
  if (!page.url().includes('/auth') && !page.url().endsWith('/')) {
    log('info', `Sign Out: redirected to ${page.url()}`)
  }

  // Test sign-in with wrong password
  await page.goto(`${BASE}/auth`)
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="email"]', 'lol@gmail.com')
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2000)
  const wrongPwErr = await page.locator('.bg-danger\\/10').first()
  if (await wrongPwErr.count() > 0 && await wrongPwErr.isVisible()) {
    log('pass', `Auth: wrong password shows error: "${(await wrongPwErr.textContent())?.trim()}"`)
  } else {
    log('issue', 'Auth: wrong password did not show error')
  }

  // ─── CONSOLE ERRORS ─────────────────────────────────────────────────────
  log('info', '\n=== CONSOLE ERRORS ===')
  if (consoleErrors.length === 0) {
    log('pass', 'No console errors')
  } else {
    const critical = consoleErrors.filter(e =>
      !e.includes('[vite]') &&
      !e.includes('DevTools') &&
      !e.includes('Download the React') &&
      !e.includes('Failed to load resource: 401') // 401s for avatar URLs
    )
    if (critical.length === 0) {
      log('pass', `No critical console errors (${consoleErrors.length} non-critical)`)
    } else {
      log('issue', `${critical.length} critical console errors:`)
      critical.forEach((e, i) => {
        if (i < 5) log('issue', `  ${e.slice(0, 250)}`)
      })
    }
  }

  // ─── SUMMARY ─────────────────────────────────────────────────────────────
  log('info', '\n' + '='.repeat(60))
  log('info', 'SUMMARY')
  log('info', '='.repeat(60))
  log('info', `PASS: ${passes.length}`)
  log('info', `INFO: ${infos.length}`)
  log('info', `ISSUES: ${issues.length}`)

  if (issues.length > 0) {
    log('issue', '\nIssues found:')
    issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`))
  } else {
    log('pass', '\nAll checks passed!')
  }

  await browser.close()
}

main().catch(err => {
  console.error('Test crashed:', err.message)
  console.error(err.stack)
  process.exit(1)
})
