# 🔥 StreakSync

> **Social Habit Accountability Platform** — Don't break the streak, don't let your team down.

StreakSync transforms solo habit tracking into a community experience. Join habit rooms, check in daily, and build collective streaks that create real accountability. Miss a day? The flame dies — but you can always reignite it.

## ✨ Features

- 🏠 **Habit Rooms** — Join rooms like "100 Days of Code" or "Daily 6 AM Gym"
- 🔥 **Collective Streaks** — Your check-in keeps the room's streak alive
- 🏆 **Leaderboards** — Compete within rooms and globally
- ⭐ **XP & Levels** — Earn experience points for every check-in
- 📊 **Analytics** — GitHub-style contribution heatmaps and streak charts
- 🎯 **Individual Habits** — Personal tracker alongside your rooms
- 🎨 **Beautiful Dark UI** — Premium design that makes habit tracking satisfying

## 🚀 Quick Start

### 1. Run the App (Demo Mode)

```bash
cd streakSync
npm install
npm run dev
```

The app runs in **demo mode** with realistic sample data — no backend needed to explore.

### 2. Connect Supabase (For Full Features)

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Create `.env.local`** from `.env.example`:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. **Run the database schema** — paste the contents of `supabase/migrations/001_initial_schema.sql` into your Supabase SQL Editor
4. **Enable Google OAuth** in Supabase → Authentication → Providers
5. **Restart the app**

## 📁 Project Structure

```
streakSync/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx       # Public landing page
│   │   ├── Auth.tsx          # Login/Signup
│   │   ├── Dashboard.tsx      # Main hub after login
│   │   ├── Rooms.tsx          # Room discovery
│   │   ├── RoomDetail.tsx     # Individual room page
│   │   ├── CreateRoom.tsx     # Create a new room
│   │   ├── Habits.tsx        # Individual habit tracker
│   │   ├── Leaderboard.tsx    # Global rankings
│   │   └── Profile.tsx       # User profile + stats
│   ├── components/
│   │   └── Layout.tsx        # Navigation shell
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client
│   │   ├── types.ts          # TypeScript types
│   │   └── streakUtils.ts    # Streak calculation logic
│   ├── store/
│   │   └── authStore.ts      # Zustand auth state
│   └── style.css             # Global styles + design system
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
├── SPEC.md                   # Full design specification
└── README.md
```

## 🎨 Design System

- **Theme:** Dark mode first, neon accents
- **Colors:** Background `#0D0D0F`, Primary `#6366F1`, Accent `#F97316`
- **Typography:** Syne (headings), Outfit (body), JetBrains Mono (stats)
- **Animations:** Streak glow, fire pulse, confetti on milestones

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand + React Query |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Charts | Recharts |
| Icons | Lucide React |

## 📅 Roadmap

- [x] Phase 0: Project scaffolding + design system
- [x] Phase 1: Auth (email + Google OAuth)
- [x] Phase 2: Room discovery + joining
- [x] Phase 3: Daily check-in system
- [x] Phase 4: Leaderboards + gamification
- [x] Phase 5: Individual habit tracker
- [x] Phase 6: Analytics dashboard
- [ ] Phase 7: Polish + deploy to Vercel
- [ ] Phase 8: Push notifications (reminders)
- [ ] Phase 9: Mobile app (React Native)

## 🏆 Hackathon Tips

1. **Demo with fake data** — The app works without Supabase!
2. **Show the streak** — "I have a 47-day streak in the Code room"
3. **Social proof** — "85% of users maintain streaks for 30+ days"
4. **Pitch angle** — "Solo habit apps die in a week. This won't."

## 📝 License

MIT — use it, build on it, make it yours.

---

Built with 🔥 by Claude Code + Supabase + Vercel
