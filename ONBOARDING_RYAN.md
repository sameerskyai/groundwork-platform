# Onboarding: Ryan

Welcome to Groundwork Platform. This document is your start guide for work on this codebase.

---

## Quick Start

### Clone & Setup

```bash
git clone https://github.com/sameerskyai/groundwork-platform.git
cd groundwork-platform
npm install
```

### Environment Setup

**Required variables** (ask Sameer directly for values — never hardcode, never store in repo):
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (for migrations/seeding only, never in client code)

Create `.env.local` with these values. It's in .gitignore and will never be committed.

### How to Run

```bash
# Dev server (watches for changes)
npm run dev

# Build for production
npm run build

# Run unit tests
npm test

# Run live-db tests (requires SUPABASE_SERVICE_ROLE_KEY in env)
npm run test:live-db

# Run Playwright E2E tests
npm run test:e2e

# Type check
npx tsc --noEmit
```

---

## Read First (In Order)

1. **WARP.md** — engineering rules (§14–§24: migrations, RLS, review workflow, evidence standards)
2. **EXECUTION.md** — current multi-phase plan (read first unchecked item, check off with hashes)
3. **DECISIONS.md** — honesty ledger + design constraints + blocker routing

Then: WAR_PLAN.md, MASTER_PLAN.md, TIMELINE.md for full context.

---

## Current State (Commit 0956ea6)

### Phase 1 ✅ VERIFIED COMPLETE
- Live Supabase database connected
- Founder walkthrough seeded and tested
- Dashboard displays estimate range ($18,500–$42,000)
- **Evidence**: Playwright screenshot in `tests/e2e-screenshots/phase1-dashboard-estimate-rendered.png`

### Phase 2 🏗️ INFRASTRUCTURE READY
- **Database**: Migrations 032 and 033 applied 2026-07-21, confirmed live via direct schema queries + a real signup returning 201 (see honesty-ledger entry in DECISIONS.md — this line previously said "Migration 032 applied" when it never actually had been; caught by live testing, not code-reading). Migration 034 (a small `anon` INSERT grant fix found while testing 033) is written but **not yet applied** — doesn't block the real app, low urgency.
- **API**: `/api/waitlist` endpoint with anti-abuse + referral mechanics
- **UI**: `/waitlist` page (hero, form, success state) — **design refinement needed** (Warm Copper via 21st.dev)
- **Admin**: `/admin/waitlist` dashboard (stats view)
- **Tests**: Playwright E2E suite started (debug timing needed)

**What's ready for you**: waitlist landing page design polish, 21st.dev component integration, public domain deployment

### Phase 3–6 NOT STARTED
- Gate 4 bug fixes (back button audit, navigation)
- Experience fixes (empty states, CTAs, microcopy)
- Growth tooling (viral tracker, health score)
- Final close-out (mobile audit, shipping)

---

## Your Lane (Design + UX + Deployment)

From DECISIONS.md + EXECUTION.md, these are your ownership areas:

### 1. Waitlist Landing Page (Phase 2)
**Current state**: Functional form with SMS consent, position display, referral link
**What's needed**:
- Refine hero section visual design (currently using gradient + video fallback)
- 21st.dev component theming → Warm Copper color tokens (already set in CSS variables)
- Success state polish (position card design)
- Referral sharing UI (currently plain text input + copy button)
- Mobile responsive check + optimization

**Files to touch**:
- `app/waitlist/page.tsx` (main component)
- Design review: compare to brand guidelines in DECISIONS.md (Warm Copper defined)

### 2. B3 Navigation Architecture (Phase 4)
**Status**: Flagged in DECISIONS.md as needing design input
**Required**: feedback on nav structure, authenticated vs. unauthenticated flows

### 3. Deploy to Public Domain
**When ready**: Coordinate with Sameer on domain setup and deployment
**Your responsibility**: verify the deployed page works, matches design intent
**Evidence**: screenshot of deployed page + URL

---

## Workflow Rules (You Must Follow)

### §20 Evidence
- Every change you make needs: **file path + commit hash + real command output/screenshot**
- UI claims require **Playwright screenshot** showing rendered output
- No approximations: "looks good" is not evidence

### §21 Durability
- Start each session by reading EXECUTION.md
- Find the first unchecked item in your phase
- Work on that item until complete
- Check it off with commit hash
- Document stopping point if pausing mid-phase

### §23 Review Workflow
All code changes (not docs) must go through:
1. Feature branch: `feature/<phase>-<slug>`
2. Commit locally
3. Push with `-u` flag
4. Create PR with detailed body + test plan
5. Wait for CodeRabbit review (2–5 min typical)
6. Address findings / log disagreements in DECISIONS.md
7. Merge via `gh pr merge --squash`
8. Report: PR link + evidence

**Exception**: Docs-only commits (EXECUTION.md updates, design notes) can commit direct to main

### §22 Status Language
Status is one of four values only:
- **VERIFIED** — works, screenshot + test evidence
- **IN PROGRESS** — active work, next task identified
- **BLOCKED** — named blocker, workaround documented
- **NOT STARTED** — waiting for prerequisite

No percentages. No "almost there." Status = fact, not feeling.

---

## Key Technical Stack

- **Frontend**: Next.js 15 (App Router), Turbopack
- **UI Components**: 21st.dev library
- **Design**: Warm Copper theme via CSS variables (see DECISIONS.md)
- **Database**: Supabase PostgreSQL with RLS
- **Auth**: Supabase Auth
- **Testing**: Playwright (E2E), Vitest (unit)
- **API**: Next.js API routes (server-side)

---

## Important Constraints

1. **Warm Copper is Fixed** — Do not ask "what color should we use?" Color palette is locked. Use CSS variables: `--color-brand`, `--color-surface-primary`, etc.

2. **21st.dev Components Only** — Pull Button, Input, etc. from 21st.dev. Don't hand-roll primitives.

3. **RLS Must Be Restrictive** — All demo isolation policies use `AS RESTRICTIVE`. This is non-negotiable for data safety.

4. **No Hardcoded Secrets** — If you see one, STOP. Report to Sameer. Never commit credentials.

5. **Build Must Be Clean** — Before committing code: `npm run build` must succeed. Type errors are build failures.

---

## Common Commands

```bash
# Start dev server
npm run dev

# Check for type errors (before committing)
npx tsc --noEmit

# Run all tests
npm test

# Run specific E2E test
npx playwright test tests/e2e/phase2-waitlist.spec.ts

# Check uncommitted changes
git status

# View current commits on main
git log --oneline -10

# Create feature branch
git checkout -b feature/phase2-waitlist-design

# Create PR (after push)
gh pr create --title "Phase 2: waitlist landing page design" --body "..."

# Merge PR
gh pr merge <PR-number> --squash
```

---

## Questions / Blockers?

1. **Technical**: Check WARP.md (rules) and code comments
2. **Design**: Check DECISIONS.md (color tokens, component guidance)
3. **Workflow**: Check EXECUTION.md (what phase, what's next)
4. **Credentials**: Ask Sameer directly (never from docs/chat)

---

## Your First Task

1. Read WARP.md, EXECUTION.md, DECISIONS.md
2. Review Phase 2 status in EXECUTION.md
3. Test the current waitlist page locally: `npm run dev` → visit `/waitlist`
4. Identify design refinements needed (hero, form, success state)
5. Create feature branch: `feature/phase2-waitlist-design`
6. Update EXECUTION.md with design work in progress
7. Work on design polish per Phase 2 spec
8. Screenshot before/after
9. Create PR with evidence per §20
10. Report progress

---

**Latest Commit**: `0956ea6` (2026-07-20)  
**Phase**: 1 complete, 2 infrastructure ready, 3–6 waiting  
**Go**: You're up. Welcome aboard.
