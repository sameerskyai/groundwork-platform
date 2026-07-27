# Groundwork — Session Log

---

## Session 1 — July 7, 2026

**Goal:** Get the app running end-to-end from scratch.

**Done:**
- Scaffolded Next.js 16.2 app at ~/Desktop/renova-platform
- Connected Supabase project (dhmxxywdsdxzzcuezztv, us-west-2)
- Deployed migration 001_initial.sql — all core tables: profiles, contractor_profiles, projects, matches, messages, reviews, trades, cost_data, subscription_tiers, etc.
- Deployed migration 002_feed.sql — feed_entries, feed_config tables
- Disabled email confirmation via Supabase Management API (accounts work on signup)
- Fixed black screen caused by stray ~/package-lock.json making Turbopack scan home directory
- Fixed next.config.ts to set turbopack.root to project directory
- Fixed useEffect dependency warnings in homeowner matches page
- Fixed unused import in contractor chat page
- Built all 34 routes (auth, dashboards, public marketing pages)
- Built 8 AI agents (estimator, matcher, classifier, bio writer, feed writer, chat assistant, interview, admin)
- Created docs/ folder: PROJECT_OVERVIEW, CREDENTIALS, BUILD_STATUS, DATABASE_SCHEMA, NEXT_STEPS

---

## Session 2 — July 8, 2026

**Goal:** Implement Warp Master Build Prompt — full backend + rebuilt dashboards.

**Done:**

### Database
- Deployed migration 003_swipes_estimates_jobs.sql to live Supabase:
  - `swipes` table (separate from matches — tracks each party's individual swipe direction)
  - `estimates` table (separate from projects — stores AI estimate range + paid status)
  - `completed_jobs` table (post-match job completion + verification)
  - Added trust_score, trust_accuracy, trust_on_time, trust_dispute_free columns to contractor_profiles
  - Added monthly_swipe_count + monthly_swipe_reset_at columns to contractor_profiles (cap enforcement)

### New API Endpoints
- `POST /api/projects` — create a homeowner project (maps trade_slug → trade_id, geocodes ZIP)
- `GET /api/projects` — list user's projects with embedded estimate + match count
- `GET /api/projects/[id]/candidates` — matching pre-filter: trade match + haversine radius + not-already-swiped, sorted by trust score, top 10
- `GET /api/contractors/[id]/feed` — contractor project feed with monthly cap check (standard=15, growth=40 swipes/month), auto-resets prior month
- `POST /api/swipes` — records swipe, enforces + increments monthly cap (429 on exceed), detects mutual yes/yes, creates match row in matches table

### Homeowner Dashboard (/homeowner)
- Rebuilt from scratch with Part A reference design system
- Navy #12181F background, amber #E8722C accent, off-white #F7F5F1 text
- Fraunces serif (headings) + Inter (body) + IBM Plex Mono (numbers) via next/font/google
- Real data: loads active project, estimate range, match count from Supabase
- Drag-to-swipe contractor cards: pointer events, 90px threshold, PASS/YES stamps, fly-out animation, stacked background card at scale(0.96) translateY(10px)
- Swipe right → POST /api/swipes direction=yes → match modal if backend returns matched:true
- Swipe left → POST /api/swipes direction=pass
- Trust score sidebar: shows matched contractor's breakdown (accuracy/on-time/dispute-free bars)
- Neighborhood feed sidebar: pulls from /api/feed?zip=XXXXX

### Contractor Dashboard (/contractor)
- Same design system as homeowner
- Loads contractor's project feed from /api/contractors/[id]/feed
- Monthly cap enforcement: shows "limit reached" state when swipes exhausted
- Trust score panel shows own breakdown + verified job count

### Housekeeping
- Added .claude/ to .gitignore (prevents worktree symlinks from blocking git)

**Blocked:**
- GitHub push: `git add` times out due to .claude/worktrees/ symlinked node_modules
- Fix: use GitHub Desktop app to publish repo (no terminal needed)

**Next session:**
1. Use GitHub Desktop to push to github.com/rycrypn/renova-platform
2. Deploy to Vercel (import from GitHub, add env vars)
3. Add ANTHROPIC_API_KEY to .env.local
4. Create test contractor + homeowner accounts
5. Test full flow: signup → estimate → swipe → match → message

---
