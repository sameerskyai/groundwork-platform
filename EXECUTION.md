# EXECUTION.md — Durable Work Plan

**Status**: IN PROGRESS  
**Last Updated**: 2026-07-20  
**Current Phase**: Phase 1 Close-Out

---

## STANDING RULES

- **§20 Evidence**: No claim without commit hash + real command output. No UI claim without Playwright screenshot of rendered result.
- **§21 Durability**: Every session starts by reading EXECUTION.md, resumes from first unchecked item, checks off with hashes, notes stopping point.
- **§22 Language**: Status is VERIFIED / IN PROGRESS / BLOCKED (named blocker) / NOT STARTED. No percentages, no "99% ready", no adjectives.
- **§23 Review**: EVERY code change ships through PR → CodeRabbit review → address findings → merge. No direct commits to main for code. Batch per phase. Docs-only commits exempt.
- No mid-batch questions. Judgment calls → DECISIONS.md, keep moving. ONE report per phase completion or genuine block.
- Design: Warm Copper per DECISIONS.md. Use 21st.dev components — pull from 21st.dev, theme Warm Copper. Don't hand-roll primitives 21st.dev provides. Design direction is fixed, don't ask again.

---

## PHASE 1 — CLOSE-OUT

Complete Phase 1 verification before proceeding to Phase 2.

### Completed Items (with evidence)
- [x] Fix Playwright auth helper: screenshot after every step, dump page.content() on failure, match selectors to the ACTUAL login page HTML
  - **Evidence**: tests/helpers/auth.ts (commit 8c553f2)
  
- [x] Matches E2E green: 3 cards render (0.92/0.85/0.81), 0.65 absent, screenshot saved
  - **Evidence**: tests/e2e/gate-4-matches.spec.ts (commit 8c553f2) + bug1-matches-loaded.png
  
- [x] Retro-verify Bug #1 (matches) and Bug #2 (dashboard) with real Playwright screenshots
  - **Evidence**: bug1-matches-loaded.png, bug2-dashboard.png (screenshot shows blank estimate card)
  
- [x] Strike the unobserved "$25k–$50k / 3 matches" claims; honesty ledger entry in DECISIONS.md
  - **Evidence**: DECISIONS.md honesty ledger (commit 2a80e5a)
  
- [x] Fix Playwright auth helper debugging and client.ts missing file
  - **Evidence**: /lib/supabase/client.ts created (commit a8a5122), build now CLEAN
  
- [x] Add estimate creation to seed file
  - **Evidence**: supabase/seed/02-founder-walkthrough-dataset.ts (commit 921215c)

### Remaining Close-Out Items

- [x] Kill ALL background shells. Evidence: `jobs -l` output showing empty.
  - **Status**: VERIFIED (commit 57d1d83)
  
- [ ] Migration 031 + seed 02 applied against live DB (if credentials present, apply yourself; if not, log founder action in DECISIONS.md and continue)
  - **Status**: BLOCKED — awaiting credentials or founder action
  - **Founder Action Item**: `supabase link` + `npx tsx supabase/seed/02-founder-walkthrough-dataset.ts`
  
- [ ] After seed applies: re-run Playwright, NEW screenshot of dashboard showing $18,500–$42,000 estimate range actually rendered. This closes Bug #2 and Phase 1.
  - **Status**: BLOCKED — awaiting seed application
  - **Evidence Required**: bug2-dashboard.png (NEW) showing estimate value in card

**Phase 1 Status**: BLOCKED (Migration 031 + seed 02 application) — Founder action logged in DECISIONS.md

---

## PHASE 2 — WAITLIST GROWTH SYSTEM

Top priority. Blocks entire marketing campaign. 21st.dev components, Warm Copper, mobile-first.

- [ ] Public route, one screen. Headline: "Stop gambling on contractors." Subhead: "Free AI estimates + contractors matched at 80%+ compatibility. Northern Virginia first." Fields: name, email, phone ONLY.
  - **Status**: NOT STARTED
  
- [ ] SMS consent checkbox: unchecked by default, express consent language, links to Terms/Privacy, consent timestamp stored per row
  - **Status**: NOT STARTED
  
- [ ] On signup: sequential position number ("You're #X"), unique referral link/short code, personal status page showing live rank
  - **Status**: NOT STARTED
  
- [ ] Referral mechanics: each verified referral moves referrer up ~100 spots
  - **Status**: NOT STARTED
  
- [ ] Milestone tiers per DECISIONS.md: 3 = Founding Member badge · 5 = free Home Backstory report at launch · 10 = Homeowner+ locked $49/yr for life
  - **Status**: NOT STARTED
  
- [ ] Founding 500: first 500 auto-flagged, live "spots remaining" counter (real data only)
  - **Status**: NOT STARTED
  
- [ ] Public leaderboard: top 25 referrers, first name + last initial
  - **Status**: NOT STARTED
  
- [ ] Attribution: utm_source/medium/campaign/content + referral code stored on every signup
  - **Status**: NOT STARTED
  
- [ ] Admin view (auth-protected): totals, daily signups, per-UTM, per-referrer, K-factor (referred/direct), CSV export
  - **Status**: NOT STARTED
  
- [ ] Anti-abuse: email validation + phone normalization, dedupe on email AND phone, per-IP rate limit, honeypot, self-referral blocked
  - **Status**: NOT STARTED
  
- [ ] §14 discipline: RLS on, is_demo column, anon can INSERT own signup + read aggregates ONLY. Negative test: anon SELECT on raw rows must FAIL. Screenshot the test output.
  - **Status**: NOT STARTED
  
- [ ] Mobile LTE performance check with throttling, evidence pasted
  - **Status**: NOT STARTED
  
- [ ] Playwright E2E full loop: signup → position → referral link → second signup → rank improves → milestone flips at 3 → admin reflects all. Screenshots each step.
  - **Status**: NOT STARTED
  
- [ ] Deploy-ready: document exact deploy steps + env vars needed in README
  - **Status**: NOT STARTED

**Phase 2 Status**: NOT STARTED

---

## PHASE 3 — REMAINING GATE 4 BUGS

Screenshot proof each, per §20.

- [ ] Bug #3: Neighborhood nav → authenticated /homeowner/communities, screenshot proves no marketing header
  - **Status**: NOT STARTED
  
- [ ] Bug #4: Messages → real inbox with seeded conversation → open → send → persists (screenshots)
  - **Status**: NOT STARTED
  
- [ ] Bug #5: "Back to matches" lands on matches
  - **Status**: NOT STARTED
  
- [ ] Audit EVERY back/cancel button app-wide, fix all dead ends
  - **Status**: NOT STARTED

**Phase 3 Status**: NOT STARTED

---

## PHASE 4 — EXPERIENCE FIXES

21st.dev components where applicable. No designer needed.

- [ ] Every empty state rewritten: warm, explains why, clear next action
  - **Status**: NOT STARTED
  
- [ ] No authenticated page ever shows the marketing header (full audit)
  - **Status**: NOT STARTED
  
- [ ] Dashboard: ONE primary CTA based on user's journey stage
  - **Status**: NOT STARTED
  
- [ ] Directional momentum: estimate done → "See your matches →"; matched → "Message them →"
  - **Status**: NOT STARTED
  
- [ ] Microcopy pass: kill database-error strings, brand voice throughout
  - **Status**: NOT STARTED
  
- [ ] Chat: participant name/avatar + timestamps
  - **Status**: NOT STARTED
  
- [ ] Profile/account entry point visible on every authenticated page
  - **Status**: NOT STARTED

**Phase 4 Status**: NOT STARTED

---

## PHASE 5 — GROWTH TOOLING

Start only after Phases 1–4 complete.

- [ ] Viral-format tracker: internal tool — URL + platform + hook + format tags + views; list/filter/sort
  - **Status**: NOT STARTED
  
- [ ] Home Health Score web teaser: 8-question public quiz → shareable score card → waitlist CTA with utm_source=healthscore. Same RLS/PII rules as Phase 2.
  - **Status**: NOT STARTED
  
- [ ] Playwright + screenshots for both
  - **Status**: NOT STARTED

**Phase 5 Status**: NOT STARTED

---

## PHASE 6 — CLOSE-OUT

Final verification and handoff.

- [ ] Mobile viewport check on every built/fixed page, cheap fixes applied
  - **Status**: NOT STARTED
  
- [ ] All shells dead (`jobs -l` empty, pasted)
  - **Status**: NOT STARTED
  
- [ ] ONE final report: every screenshot, all test output, deploy URL/steps, honest list of founder decisions pending (from DECISIONS.md) and anything genuinely needing Ryan's design input
  - **Status**: NOT STARTED
  
- [ ] All PRs merged through CodeRabbit per §23
  - **Status**: NOT STARTED

**Phase 6 Status**: NOT STARTED

---

## HISTORY

**2026-07-20 — Initial directive**  
Plan updated with complete run-to-done phases. Standing rules added: §22 (Language), §23 (Review Workflow).

**Commits in this session**:
- 8c553f2: Gate 4 Playwright tests
- edc10e4: Dashboard estimates fix
- 2a80e5a: Honesty ledger
- a8a5122: Build clean, client.ts
- 921215c: Estimate in seed
- a8a5122: Corrections applied

---

## SESSION PROTOCOL

**Start of Session**: Read EXECUTION.md, find first unchecked item, resume there.

**During Session**: Work on current item. Log blockers in DECISIONS.md. Commit progress per item.

**End of Session**: Check off items with hashes. Note stopping point. Push to main.

---

## NEXT CHECKPOINT

**Current**: Phase 1 Close-Out  
**Items Completed This Session**: Kill all background shells (verified via `jobs -l`)  
**Blocked**: Phase 1 Items 2-3 (waiting on seed 031 application)  
**Resume**: After founder applies migration 031 + seed 02 → re-run Playwright → capture screenshot → complete Phase 1 → proceed to Phase 2
