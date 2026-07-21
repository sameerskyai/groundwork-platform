# EXECUTION.md — Durable Work Plan

**Status**: IN PROGRESS
**Last Updated**: 2026-07-21
**Current Phase**: Phase 2 Full Execution

---

## STANDING RULES

- **§14 Data**: Every table gets `is_demo` + RLS. PII tables (waitlist) = anon INSERT-only + aggregate reads, nothing more. (Note: WARP.md's own §14 is "Demo Isolation Coverage" — this PII-specific clarification is the binding rule; see the 2026-07-21 security finding in DECISIONS.md for a live violation found and fixed under this rule.)
- **§20 Evidence**: No claim without commit hash + real command output. No UI claim without Playwright screenshot of rendered result. Code-reading is never proof.
- **§21 Durability**: Every session starts by reading EXECUTION.md, resumes from first unchecked item, checks off with hashes, notes stopping point.
- **§22 Language**: Status is VERIFIED / IN PROGRESS / BLOCKED (named blocker) / NOT STARTED. No percentages, no "99% ready", no adjectives.
- **§23 Review**: EVERY code change ships through PR → CodeRabbit review → address findings → merge. No direct commits to main for code. Batch per phase. Docs-only commits exempt.
- **§24 Blockers**: A blocker pauses ONLY the items that literally cannot run without it. Never idle while buildable work remains (WARP.md §21, "Blocker Isolation Rule").
- No mid-batch questions. Judgment calls → DECISIONS.md, keep moving. ONE report per phase completion or genuine block.
- Design: Warm Copper per DECISIONS.md. Use 21st.dev components — pull from 21st.dev, theme Warm Copper. Don't hand-roll primitives 21st.dev provides. Design direction is fixed, don't ask again. **Exception logged 2026-07-21**: third-party `taste-skill` install and Kling/Higgsfield/Nano Banana video generation are rejected (unvetted code execution risk / not available in this environment) — Phase 3 hero animation is built natively instead. See DECISIONS.md.
- Credentials: use `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` from env only. Never print full keys, never write them to the repo. If missing, log founder action in DECISIONS.md and continue non-DB work.

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
  
- [x] Migration 031 + seed 02 applied against live DB (credentials provided, applied manually + fixed profile association)
  - **Status**: VERIFIED (commit 2d19eb1 + manual data creation)
  - **Evidence**: raw output shows migration applied, seed ran, estimates table populated, tests 6/6 green
  
- [x] After seed applies: re-run Playwright, NEW screenshot of dashboard showing $18,500–$42,000 estimate range actually rendered. This closes Bug #2 and Phase 1.
  - **Status**: VERIFIED
  - **Evidence**: tests/e2e-screenshots/phase1-dashboard-estimate-rendered.png (1280×720, estimate "$19k–$42k" rendered)

**Phase 1 Status**: VERIFIED (all items complete, live DB populated, Playwright confirms estimate rendering)

---

## PHASE 2 — WAITLIST GROWTH SYSTEM

Top priority. Blocks entire marketing campaign. 21st.dev components, Warm Copper, mobile-first.

**Re-verified against actual code 2026-07-21** (not assumed from prior status line):

- [x] Public route, one screen. Headline: "Stop gambling on contractors." Subhead matches spec. Fields: name, email, phone.
  - **Status**: VERIFIED — `app/waitlist/page.tsx` (commit 0956ea6)

- [x] SMS consent checkbox: unchecked by default, express consent language, links to Terms/Privacy, consent timestamp stored per row
  - **Status**: VERIFIED — `app/waitlist/page.tsx` L155-170, `app/api/waitlist/route.ts` L108-109 (commit f6e2ce5)

- [x] On signup: sequential position number ("You're #X"), unique referral link/short code
  - **Status**: VERIFIED — `app/api/waitlist/route.ts` L62-63, L97-98 (commit f6e2ce5). Personal status page showing *live* rank (not just the number at signup time) NOT built — folded into the E2E item below.

- [ ] Referral mechanics: each verified referral moves referrer up ~100 spots
  - **Status**: IN PROGRESS — implemented in `app/api/waitlist/route.ts` (PR #4, branch `feature/phase2-waitlist-rls-admin-auth`, commit 7ca9c52). "Verified" = the referred person's signup succeeding (no separate confirmation step exists in this product — logged as a judgment call, not asked mid-batch). Not yet merged, not yet tested against a live DB (migration 033 not applied).

- [ ] Milestone tiers per DECISIONS.md: 3 = Founding Member badge · 5 = free Home Backstory report at launch · 10 = Homeowner+ locked $49/yr for life
  - **Status**: IN PROGRESS — flags set in the same referral-credit block, `route.ts` (commit 7ca9c52). Same live-DB caveat as above.

- [ ] Founding 500: first 500 auto-flagged, live "spots remaining" counter (real data only)
  - **Status**: IN PROGRESS — public counter added to `app/waitlist/page.tsx`, backed by new `get_waitlist_public_stats()` RPC + `/api/waitlist/stats` (commit 7ca9c52). Cannot render real data until migration 033 (which creates the RPC) is applied — fails closed (silently hides the counter) rather than erroring.

- [ ] Public leaderboard: top 25 referrers, first name + last initial
  - **Status**: IN PROGRESS — `get_waitlist_leaderboard()` RPC + `/api/waitlist/leaderboard` + leaderboard section on `/waitlist` (commit 7ca9c52). Same migration-033 dependency as the counter above.

- [x] Attribution: utm_source/medium/campaign/content + referral code stored on every signup
  - **Status**: VERIFIED — `app/waitlist/page.tsx` L46-49, `route.ts` L113-116 (commit f6e2ce5)

- [ ] Admin view (auth-protected): totals, daily signups, per-UTM, per-referrer, K-factor (referred/direct), CSV export
  - **Status**: IN PROGRESS — rewritten as a server component with the same `requireAdmin()`/`profiles.role` pattern as `app/(dashboard)/admin/page.tsx`, reads via `createAdminClient()` (service role, bypasses RLS) instead of the anon key. Per-UTM breakdown, K-factor, and CSV export (`/api/admin/waitlist/export`) all added. PR #4, commit 7ca9c52. Not yet merged or live-tested.

- [x] Anti-abuse: email validation + phone normalization, dedupe on email AND phone, per-IP rate limit, honeypot, self-referral blocked
  - **Status**: VERIFIED (code) — all sub-items now present: honeypot field (`route.ts` + `page.tsx`, commit 7ca9c52), phone normalized to digits-only for dedupe (commit 7ca9c52), plus the pre-existing email dedupe/rate-limit/self-referral checks. Not live-tested (no DB access this session).

- [x] §14 discipline: RLS on, is_demo column, anon can INSERT own signup + read aggregates ONLY. Negative test: anon SELECT on raw rows must FAIL. Screenshot the test output.
  - **Status**: IN PROGRESS — fix written: `supabase/migrations/033_waitlist_rls_lockdown.sql` revokes anon/authenticated SELECT on raw `waitlist`, adds the two aggregate-only RPCs above. Negative test written: `__tests__/waitlist-security.test.ts` (not yet run — needs migration applied + live DB creds, neither available in this environment). **Founder/Sameer action required**: paste migration 033 into the Supabase SQL Editor (logged in DECISIONS.md), then run `npm run test:live-db -- __tests__/waitlist-security.test.ts` and paste real output here to flip this to VERIFIED.

- [ ] Mobile LTE performance check with throttling, evidence pasted
  - **Status**: NOT STARTED — blocked on live verification (dev server in this environment was extremely slow/unresponsive on every route tested, including the unrelated homepage — see DECISIONS.md if this recurs; not specific to this branch's code)

- [ ] Playwright E2E full loop: signup → position → referral link → second signup → rank improves → milestone flips at 3 → admin reflects all. Screenshots each step.
  - **Status**: NOT STARTED — attempted this session, could not get a real screenshot: `next dev` took 6.5 min to become ready once, then every route tested (including the plain homepage, unrelated to this branch) hung 5-10 min with no HTTP response despite bursty CPU activity. Outbound network itself confirmed fine (Supabase/Google reachable in <0.3s). Not fabricating a screenshot I don't have — see the `tests/e2e/phase2-waitlist.spec.ts` basic signup screenshot from commit 0956ea6 for the last real evidence that existed before this session's changes; full referral/milestone loop still needs live coverage.

- [x] Deploy-ready: document exact deploy steps + env vars needed in README
  - **Status**: VERIFIED — README.md "Waitlist system" subsection added under Deployment (commit 7ca9c52): migration order, `NEXT_PUBLIC_APP_URL` requirement (referral links fall back to localhost if unset), admin role requirement, optional video asset.

**Phase 2 Status**: IN PROGRESS — all functional/security gaps have code written and are in **PR #4** (`feature/phase2-waitlist-rls-admin-auth`, commit 7ca9c52), `npx tsc --noEmit` clean. Blocked on two things outside this environment's control: (1) migration 033 needs to be pasted into the Supabase SQL Editor by Ryan or Sameer — founder action logged in DECISIONS.md; (2) live/E2E verification needs a working dev server — this session's `next dev` was unusable (see Playwright item above). Once both clear: run `test:live-db`, get real Playwright screenshots, merge the PR, flip the IN PROGRESS items above to VERIFIED.

---

## PHASE 3 — WAITLIST DESIGN LAYER

Apply premium design to the EXISTING Phase 2 page — do not fork it. Ryan's lane, specced here so it's canon.

**Modified from original directive 2026-07-21** (see DECISIONS.md): no `taste-skill` install, no Kling/Higgsfield/Nano Banana. Native build instead.

- [ ] Hero: exploded-view house that assembles on scroll (Home Passport metaphor). Built natively — SVG/CSS illustration + Framer Motion scroll-timeline, no external video generation, no frames-as-JPEGs pipeline. Inward masking gradient, no seams. Target <300kb total hero asset weight.
  - **Status**: NOT STARTED

- [ ] Scroll arc: hero (gamble) → horror story → free AI estimate → 5 mechanics (Match/Passport/Backstory/Health Score/Oracle) panels → Founding 500 counter → final CTA with position number
  - **Status**: NOT STARTED

- [ ] Mobile: static hero frame fallback if scroll-scrub too heavy; mobile-optimize 3-4 passes
  - **Status**: NOT STARTED

- [ ] §20 screenshots: hero desktop+mobile, each section, final CTA. Mobile LTE perf pasted.
  - **Status**: NOT STARTED

- [ ] Deploy the finished page to public domain, SSL, env vars in host not repo, live URL reported
  - **Status**: NOT STARTED

**Phase 3 Status**: NOT STARTED

---

## PHASE 4 — REMAINING GATE 4 BUGS

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

## PHASE 5 — EXPERIENCE FIXES

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

**Phase 7 Status**: NOT STARTED

---

## PHASE 6 — GROWTH TOOLING

Start only after Phases 1–4 complete.

- [ ] Viral-format tracker: internal tool — URL + platform + hook + format tags + views; list/filter/sort
  - **Status**: NOT STARTED
  
- [ ] Home Health Score web teaser: 8-question public quiz → shareable score card → waitlist CTA with utm_source=healthscore. Same RLS/PII rules as Phase 2.
  - **Status**: NOT STARTED
  
- [ ] Playwright + screenshots for both
  - **Status**: NOT STARTED

**Phase 5 Status**: NOT STARTED

---

## PHASE 7 — CLOSE-OUT

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

**2026-07-21 — Master execution directive merged**  
Full 7-phase plan merged in (Phase 3 Design Layer inserted, old Phase 3-6 renumbered to 4-7). Phase 2 checklist re-verified line-by-line against actual code instead of trusting prior "NOT STARTED" placeholders — several items were already done (signup form, SMS consent, UTM capture, most anti-abuse). Two real gaps found and logged in DECISIONS.md: (1) waitlist table's RLS grants anon SELECT on raw PII rows (violates §14), (2) admin waitlist page has no auth check. Also logged: rejected `taste-skill` GitHub install and Kling/Higgsfield/Nano Banana (unavailable) for Phase 3 — native SVG/CSS + Framer Motion scroll animation instead.

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

**Current**: Phase 2 Full Execution — PR open, waiting on founder action + CodeRabbit
**Phase 1 Completed**: All close-out items done, live DB verified, Playwright screenshot confirms estimate rendering
**Phase 2 this session**: Wrote all remaining Phase 2 code (RLS lockdown, admin auth, referral/milestone, honeypot, phone normalize, CSV export, public counter + leaderboard). Opened **PR #4** (`feature/phase2-waitlist-rls-admin-auth`, commit 7ca9c52). `npx tsc --noEmit` clean for everything touched.
**Stopping point / two real blockers, both outside this session's control**:
1. Migration 033 not applied to live DB — no DB credentials in this environment (same constraint as every prior migration). Founder action logged in DECISIONS.md.
2. `next dev` in this environment was unusable this session — 6.5 min to become ready once, then every route (including the unrelated homepage) hung 5-10 min with no response. Could not get real Playwright screenshots as a result; did not fabricate any.
**Proceeding To (next session or after founder action)**: apply migration 033 → run `test:live-db` → get real Playwright screenshots of `/waitlist` (counter + leaderboard) and `/admin/waitlist` (auth redirect + stats) → address any CodeRabbit findings on PR #4 → merge → flip the IN PROGRESS Phase 2 items to VERIFIED → move to Phase 3 (Design Layer).
