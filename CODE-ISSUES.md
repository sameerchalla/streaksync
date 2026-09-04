# StreakSync Code Review - Issues Found

## CRITICAL BUGS

### 1. **Email confirmation blocks sign-in for new users (Auth.tsx)**
The signup flow shows "Account created! Check your email to confirm" and switches back to login mode, but the user will NOT be able to log in until they confirm their email. This is a major UX issue because:
- User fills signup form
- Gets confused when they can't immediately log in
- May not receive the email (no SMTP configured in placeholder Supabase)

**Fix needed**: Disable email confirmation in Supabase, or auto-sign in the user after signup

### 2. **Profile creation error is silently swallowed (Auth.tsx:49-51)**
```js
if (profileError) {
  console.error('Profile creation error:', profileError)
}
```
If profile creation fails, user still sees success message and tries to login, but won't have a profile row, breaking all features.

**Fix needed**: Show error to user, or better yet, use a database trigger to auto-create the profile.

### 3. **No display_name vs username distinction in user creation (Auth.tsx)**
The `display_name` is set to the original `username` (preserving case), but the `username` is lowercased and sanitized. The user types "lolo" but the display name is also "lolo" - this is fine, but if the schema has a unique constraint on username, it could conflict.

### 4. **Race condition in Auth check (App.tsx)**
The `initialized` state prevents the app from rendering, but `loading` in the auth store is also tracked. This could cause the app to hang if Supabase auth.getSession() never resolves.

### 5. **Dashboard "This Week" stat is hardcoded to "0/7" (Dashboard.tsx:209)**
```jsx
<StatCard icon={Activity} label="This Week" value="0/7" />
```
This shows a hardcoded value instead of calculating actual weekly check-ins.

### 6. **Profile page uses wrong date comparison (Profile.tsx)**
The heatmap data and check-in calculations use `checkins` which comes from `check_in_date`, but for a new user with no check-ins, the heatmap shows 365 empty days. The "monthly success rate" calculation divides by 30 even if no check-ins exist.

### 7. **Habits page "Best Streak" calculation is wrong (Habits.tsx:142-150)**
```jsx
{Math.max(
  ...displayHabits.map((h: any) => {
    const dates = (h.habit_logs || [])
      .filter((l: any) => l.completed)
      .map((l: any) => l.completed_date)
    return dates.length  // Total count, not streak!
  }),
  0
)}
```
This returns the TOTAL count of completions, not the actual streak. A proper streak requires consecutive days.

### 8. **Habit "streak" is just total count (Habits.tsx:203)**
```jsx
const streak = dates.length
```
Same issue - it's counting total completions, not consecutive days.

### 9. **Habits page Rate calculation is suspect (Habits.tsx:159-172)**
```jsx
const possibleSlots = displayHabits.length * 30
```
If user has 0 habits, this is 0 and causes division by zero. Also assumes 30 days always, regardless of when habit was created.

### 10. **Missing logout cleanup (Layout.tsx)**
When user signs out, it navigates to '/' but the queryClient cache is not cleared. Old data may leak.

### 11. **No data validation on streak calculation (streakUtils.ts)**
The `calculateStreak` function uses raw timestamps and could fail with invalid date strings. No error handling.

### 12. **getStreakFireEmoji has duplicate cases (streakUtils.ts:110-112)**
```js
if (streak === 0) return '💨'
if (streak < 3) return '🔥'
if (streak < 7) return '🔥'  // Same as above!
```
The `streak < 3` and `streak < 7` cases return the same emoji. Wasted condition.

### 13. **Form validation mismatch in Auth (Auth.tsx:244)**
```jsx
minLength={6}
```
The placeholder says "At least 8 characters" but the validation is 6 characters. Inconsistent UX.

### 14. **Color picker "Yellow" uses same hex as warning (CreateRoom.tsx)**
```js
{ name: 'Yellow', value: '#F59E0B' }
```
This is the same color as the warning in the design system, which is fine but could be confusing.

### 15. **Profile "Edit Profile" button does nothing (Profile.tsx:116)**
```jsx
<button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-text hover:bg-border transition-colors">
  <Edit3 className="w-4 h-4" />
  Edit Profile
</button>
```
No `onClick` handler. Clicking it does nothing.

### 16. **Missing loading states on buttons (various)**
Several buttons don't have proper loading states during async operations.

### 17. **Rooms page shows "All rooms" link to non-filtered state (Rooms.tsx:160)**
```jsx
{showMyRooms && (
  <button onClick={() => setShowMyRooms(false)}>
    Browse All Rooms
  </button>
)}
```
This is fine, but the empty state copy for "My Rooms" filter is wrong - says "You haven't joined any rooms yet" but might be wrong if user has rooms but search returns nothing.

### 18. **TypeScript types in Layout.tsx for icons are wrong (Layout.tsx)**
The icons from lucide-react are React components, but they're not typed.

### 19. **Habit "rate" calculation is broken for single habit (Habits.tsx:159)**
When `displayHabits.length === 0`, the check `if (displayHabits.length === 0) return '0%'` prevents divide by zero, but if there's 1 habit, it divides by 30 which isn't accurate.

### 20. **Inconsistent date format in supabase queries (Dashboard.tsx)**
Uses `format(startOfDay(new Date()), 'yyyy-MM-dd')` which is correct, but several places don't use `startOfDay`, just `new Date()` which can include time component.

### 21. **No client-side route protection during session refresh (App.tsx)**
If a user's session expires while on a protected page, the page doesn't redirect to login.

### 22. **QueryClient stale time is too long (App.tsx)**
```jsx
staleTime: 1000 * 60 * 5 // 5 minutes
```
After a check-in, the UI might not update immediately.

### 23. **Habits page doesn't track individual habit streaks correctly (Habits.tsx)**
Uses `dates.length` which is total count, not consecutive streak. A user with check-ins on Mon, Wed, Fri would show "3 day streak" instead of "1 day streak".

### 24. **Profile heatmap shows 90 days but tooltip format is wrong (Profile.tsx:202)**
```jsx
title={`${day.date}: ${day.count > 0 ? 'Checked in' : 'No check-in'}`}
```
The tooltip says "Checked in" for any count > 0, but the count is binary (0 or 1) anyway.

### 25. **Dashboard "Today's Check-ins" section doesn't handle empty state (Dashboard.tsx:237)**
Actually it does handle empty state, but the sparkline/heatmap logic isn't shown.

### 26. **The 'container' class in Layout doesn't match the 'container-page' class used in Landing**
Two different container classes are used across the app.

### 27. **CSP / Security issues**
- No CSRF protection
- No rate limiting visible
- No password strength indicator

### 28. **Accessibility issues**
- No aria-labels on icon-only buttons
- Color contrast might be poor in some areas
- No keyboard navigation tested

### 29. **Auth signup doesn't check if username is already taken (Auth.tsx)**
Username is supposed to be unique (per types), but no check before insert.

### 30. **Mobile bottom nav lacks room creation button (Layout.tsx)**
The mobile bottom nav has 5 items but room creation is only in the desktop sidebar context.

### 31. **RoomDetail member count fetch runs on every render (RoomDetail.tsx)**
The query for member count doesn't have proper caching.

### 32. **ConfettiEffect has 50 elements, may impact performance (RoomDetail.tsx)**
No throttling or limits.

### 33. **Profile "Top 10" achievement is hardcoded to false (Profile.tsx:72)**
```jsx
{ emoji: '🏆', label: 'Top 10', earned: false }
```
This achievement can never be earned because the logic is hardcoded. Should be derived from leaderboard rank.

### 34. **Profile "Member since" date might be wrong format (Profile.tsx)**
The format function is correct, but if `created_at` is null, the conditional check works.

### 35. **No error boundary in app (App.tsx)**
If any component throws, the whole app crashes.

### 36. **The username in profiles table has a unique constraint, but no conflict handling (Auth.tsx)**
```js
await supabase.from('profiles').insert({...})
```
If username is taken, this fails but error is only logged.

### 37. **Check-in mutation doesn't update user's streak count (Dashboard.tsx, RoomDetail.tsx)**
After a check-in, the user's `current_streak` and `longest_streak` in the profiles table are not updated. They stay at 0 forever for new users.

### 38. **Total Check-ins count is also not updated (Dashboard.tsx)**
The `total_checkins` field in profiles is never updated when a user checks in.

### 39. **XP is not awarded for check-ins (Dashboard.tsx)**
No XP is added to the user's profile when they check in.

### 40. **The `display_name` in Auth is set to `username` (raw input) (Auth.tsx:46)**
This could allow users to have display names with special characters that break the UI.

## UI / UX BUGS

### 41. **The "This Week" stat in Dashboard is hardcoded "0/7" (Dashboard.tsx:209)**
Already mentioned, but it's a visible bug.

### 42. **Habits "Best Streak" shows total count, not best streak (Habits.tsx:142)**
Should compute consecutive day streak.

### 43. **No way to set goal/duration when creating a habit (Habits.tsx AddHabitModal)**
Users can only set name, icon, color. No frequency, no target, etc.

### 44. **Form fields use different styles**
Some inputs use `bg-background` (Habits) while others use `bg-surface` (Auth). Inconsistent.

### 45. **The "Member since" uses created_at which is the profile creation time (Profile.tsx)**
But the user was created in Supabase auth, which is a different timestamp. Mismatch.

### 46. **Achievement grid has 4 cols mobile, 8 cols desktop (Profile.tsx:262)**
```jsx
<div className="grid grid-cols-4 md:grid-cols-8 gap-4">
```
This means 8 items, but on mobile only 4 cols - so 2 rows. Looks fine but could be 3 cols on mobile.

### 47. **The "Cancel" link in CreateRoom doesn't reset state (CreateRoom.tsx)**
It just navigates away. If user comes back, state is still there (in memory).

### 48. **Leaderboard sorts by current_streak only (Leaderboard.tsx:38)**
Doesn't break ties by total check-ins or XP.

### 49. **Room card shows member_count from room data (Rooms.tsx:242)**
But this is not a column in the rooms table - it's likely a computed field via SQL. If not, this is wrong.

### 50. **Habits stats card layout is too wide for mobile (Habits.tsx:115)**
4 columns on mobile is cramped.

## BUGS REQUIRING IMMEDIATE FIX

1. **Hardcoded "0/7" in Dashboard This Week stat**
2. **Habit "Best Streak" calculation is just total count**
3. **Profile creation error silently swallowed**
4. **Streak not updated on check-in (server-side issue)**
5. **Edit Profile button does nothing**
6. **getStreakFireEmoji duplicate cases**
7. **Inconsistent password min length (6 vs 8)**
8. **Top 10 achievement hardcoded false**
9. **"Member since" uses profile creation, not auth creation**
10. **No error boundary**
