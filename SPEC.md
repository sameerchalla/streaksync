# StreakSync — Product Specification

## 1. Concept & Vision

StreakSync is a **social habit accountability platform** that transforms solo habit tracking into a community experience. The core mechanic is simple: users join "habit rooms" where collective streaks create accountability — miss a day, and you let your team down. This social pressure dramatically outperforms solo apps in retention.

The vibe is **high-energy, gamified, dark-mode-first** — like Discord meets Linear. The interface should feel premium, alive, and reward-heavy. Every check-in should feel satisfying.

## 2. Design Language

### Aesthetic Direction
**"Neon Accountability"** — A dark-first, high-energy aesthetic with electric accent colors that match the "streak fire" gamification energy. Think Discord meets Linear, with premium polish.

### Color Palette
```
Background:    #0D0D0F  (near-black)
Surface:       #16161A  (cards, modals)
Border:        #2A2A32  (subtle dividers)
Primary:       #6366F1  (indigo — main actions)
Accent:        #F97316  (orange — fire, streaks, energy)
Success:       #22C55E  (green — completed, active)
Danger:        #EF4444  (red — missed, danger)
Text:          #F4F4F5  (near-white)
Muted:         #71717A  (gray)
```

### Typography
- **Headings:** Syne (700 weight, bold) — geometric, quirky, distinctive
- **Body:** Outfit (400-500 weight) — clean, modern, readable
- **Mono/Stats:** JetBrains Mono (for streak numbers, XP counts)
- **Scale:** 2.5rem (h1) → 2rem (h2) → 1.5rem (h3) → 1.25rem (h4) → body

### Spatial System
- Base unit: 4px
- Card padding: 24px (6 units)
- Section gaps: 32px (8 units)
- Border radius: 8px (sm), 12px (md), 16px (lg), 24px (xl)

### Motion Philosophy
- **Micro-interactions:** 150-200ms ease-out transitions on hover
- **Check-in celebration:** Confetti burst + fire pulse animation
- **Streak milestones:** Scale bounce + confetti (7, 30, 100 days)
- **Loading states:** Smooth skeleton shimmer, not spinners
- **Page transitions:** Fade in 300ms

### Visual Assets
- **Icons:** Lucide React (consistent, clean line icons)
- **Room icons:** Emoji (💻 🏋️ 📚 🧘 etc.) for personality
- **Emojis for streaks:** 🔥 escalating intensity based on streak length
- **Gradients:** Orange/amber for fire elements, indigo/violet for primary

## 3. Layout & Structure

### Page Architecture
```
├── Landing (public)
│   └── Hero, Features, Social Proof, CTA
├── Auth (public)
│   └── Login/Signup with Google OAuth + Magic Link
├── Dashboard (protected)
│   ├── Stats Grid (streaks, XP, level)
│   ├── Today's Check-ins (room cards)
│   └── Quick Actions
├── Rooms (protected)
│   ├── Search & Filter
│   └── Room Grid (discovery)
├── Room Detail (protected)
│   ├── Room Header + Banner
│   ├── Collective Progress
│   ├── Today's Check-in Button
│   └── Room Leaderboard
├── Create Room (protected)
│   └── Room Creation Form
├── Habits (protected)
│   ├── Stats Overview
│   ├── Habit Cards (individual tracking)
│   └── Mini Streak Charts
├── Leaderboard (protected)
│   ├── Top 3 Podium
│   └── Full Rankings
└── Profile (protected)
    ├── Avatar & Level
    ├── Stats Grid
    ├── Activity Heatmap (GitHub-style)
    └── Achievements
```

### Responsive Strategy
- Mobile-first with bottom tab bar
- Desktop: sidebar navigation + wider content
- Breakpoints: sm (640px), md (768px), lg (1024px)

## 4. Features & Interactions

### Authentication
- **Email/Password:** Sign up with validation
- **Google OAuth:** One-click sign in
- **Magic Link:** Passwordless email auth
- **Persistence:** Session saved, auto-refresh

### Room System
- **Browse:** Search, filter, sort by streak/members
- **Join:** One-click join, auto-track membership
- **Leave:** Confirmation modal
- **Create:** Full form with icon/color picker, streak goal

### Check-in System
- **Daily button:** Large, satisfying, fire animation on click
- **One-click:** Check in to all rooms at once
- **Undo:** 5-second undo toast
- **Miss detection:** Visual indicator on missed days
- **Real-time:** Supabase subscriptions for live updates

### Gamification
- **XP System:** +10 XP per check-in, bonuses for milestones
- **Levels:** Progressive unlock (Lv.1 = 0 XP, scaling)
- **Streaks:** Current, longest, per-room, global
- **Leaderboards:** Room-level and global rankings
- **Milestones:** 7, 14, 30, 50, 100, 365 days with celebrations

### Individual Habits
- **Create:** Name, icon, color
- **Track:** Daily check-in with calendar view
- **Charts:** Streak history line chart
- **Heatmap:** GitHub-style contribution graph

### Profile
- **Stats:** All-time, monthly, weekly summaries
- **Heatmap:** Year-long contribution history
- **Achievements:** Badge system for milestones
- **Edit:** Username, display name, avatar

## 5. Component Inventory

### Buttons
- **Primary:** Indigo bg, white text, hover:scale-105
- **Accent:** Orange gradient bg, white text (check-in)
- **Ghost:** Transparent, border, hover:bg-surface
- **Icon:** Circle, icon only, tooltip on hover
- **States:** Loading (spinner), disabled (opacity-50), success (green)

### Cards
- **Room Card:** Icon, name, streak bar, member count, join button
- **Habit Card:** Icon, name, streak, mini chart, check-in button
- **Stat Card:** Icon, label, value, optional progress bar
- **User Card:** Avatar, name, streak, rank badge

### Forms
- **Inputs:** Dark bg, border, focus:border-primary
- **Textarea:** Same as input, resize-none
- **Select:** Custom dropdown with icons
- **Radio/Toggle:** Custom styled with primary color
- **Validation:** Red border + error message below

### Navigation
- **Sidebar (desktop):** Fixed left, icon + label
- **Bottom tabs (mobile):** Fixed bottom, icon + label
- **Top bar:** Logo, user menu, sign out

### Feedback
- **Toast:** Bottom-right, slide-in, auto-dismiss
- **Modal:** Centered, backdrop blur, escape to close
- **Skeleton:** Shimmer animation while loading
- **Empty state:** Illustration + CTA

## 6. Technical Approach

### Stack
- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS v4 + CSS custom properties
- **State:** Zustand (auth) + React Query (server state)
- **Routing:** React Router v6
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Dates:** date-fns
- **Deployment:** Vercel

### Supabase Schema
```sql
-- profiles: extends auth.users
-- rooms: habit room metadata
-- room_members: user-room join with timestamps
-- check_ins: daily check-in records (unique per user/room/date)
-- habits: individual habit definitions
-- habit_logs: individual habit completion logs
```

### API Design
All data operations through Supabase client:
- `supabase.from('rooms').select()` — Fetch rooms
- `supabase.from('check_ins').upsert()` — Create/update check-in
- `supabase.auth.signInWithOAuth()` — Google auth
- Real-time subscriptions for live leaderboard updates

### Environment Variables
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 7. Demo Mode

When Supabase is not configured, the app displays **realistic demo data**:
- 3 pre-joined rooms with varied streaks
- Sample leaderboard with top streakers
- 3 personal habits with partial completion
- Stats that look credible for hackathon demos

This allows the app to be demoed immediately without backend setup.
