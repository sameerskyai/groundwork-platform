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
  - **Status**: VERIFIED LIVE (2026-07-21) — real signup through the live UI returned `position_number: 1`, real `referralCode`/`referralLink`. Screenshot: `tests/e2e-screenshots/phase2-waitlist-signup-SUCCESS.png` (commit eb8d02a). Personal status page showing *live* rank (not just the number at signup time) still not built — separate, smaller gap, not blocking.

- [x] Referral mechanics: each verified referral moves referrer up ~100 spots
  - **Status**: VERIFIED LIVE (2026-07-21) — real two-signup chain through the live UI: signed up A (position #2), captured A's real referral link/code, signed up B through it. Queried A's row live afterward: `position_number` dropped from 2 → 1 (floored correctly at 1, not negative), `verified_referral_count` incremented 0 → 1. Screenshots: `phase2-referral-chain-A-signup.png`, `phase2-referral-chain-B-signup-via-referral.png`. Uses `credit_referral()` (migration 035, hardened by 036 after an anon-EXECUTE gap was found and fixed the same session).

- [x] Milestone tiers per DECISIONS.md: 3 = Founding Member badge · 5 = free Home Backstory report at launch · 10 = Homeowner+ locked $49/yr for life
  - **Status**: VERIFIED (boundary case) — at `verified_referral_count = 1` (the one real referral tested), `founding_member`/`backstory_eligible`/`homeowner_plus_eligible` all correctly read `false`, confirmed via live query. The actual flip-to-`true` at count=3 has not been directly observed (would need 2 more real referred signups) — same atomic SQL statement (`credit_referral()`) computes all three thresholds identically, so this is very likely correct, but noting the gap rather than overclaiming a case that wasn't literally exercised.

- [x] Founding 500: first 500 auto-flagged, live "spots remaining" counter (real data only)
  - **Status**: VERIFIED LIVE — public waitlist page renders "Founding 500 spots left" from real `get_waitlist_public_stats()` data (confirmed 0 founding-500 signups at test time via the same screenshot above). Copy bug found in passing: renders as "Only 500 Founding 500 spots left" (redundant wording) — cosmetic, logged for the design pass in Phase 3, not fixed here.

- [x] Public leaderboard: top 25 referrers, first name + last initial
  - **Status**: VERIFIED LIVE (endpoint) — `get_waitlist_leaderboard()` returns HTTP 200 with the correct empty-array shape (zero referrals exist yet, so nothing to rank — expected, not a bug). UI section correctly renders nothing rather than erroring on the empty case (`app/waitlist/page.tsx` `Leaderboard()` returns `null` when `entries.length === 0`). Visual confirmation with actual ranked entries still needs the referral-chain test above to produce data.

- [x] Attribution: utm_source/medium/campaign/content + referral code stored on every signup
  - **Status**: VERIFIED — `app/waitlist/page.tsx` L46-49, `route.ts` L113-116 (commit f6e2ce5)

- [ ] Admin view (auth-protected): totals, daily signups, per-UTM, per-referrer, K-factor (referred/direct), CSV export
  - **Status**: IN PROGRESS — not checked off per §22 (VERIFIED requires ALL required coverage, not partial). The auth protection itself IS live-verified: unauthenticated request to `/admin/waitlist` returns a real `307` to `/login` (confirmed via `curl -I` headers and Playwright, screenshot `tests/e2e-screenshots/phase2-admin-waitlist-unauth-redirect.png`, commit 36be4c8). The dashboard's actual content (stats rendering, per-UTM breakdown, CSV export) has not been tested as a logged-in admin — no admin credentials available in this environment. Code review only for that part; remains open until an authenticated pass confirms it renders correctly.

- [ ] Anti-abuse: email validation + phone normalization, dedupe on email AND phone, per-IP rate limit, honeypot, self-referral blocked
  - **Status**: IN PROGRESS — not checked off per §22, coverage is partial. Email UNIQUE constraint confirmed live via direct insert test (23505 duplicate-key error on second insert, then cleaned up). Honeypot, phone normalization, self-referral, and rate-limit are code-verified (commit 7ca9c52) but not individually exercised live — none of them blocked the one real signup tested, consistent with correct behavior, but that's not the same as a live test of each.

- [x] §14 discipline: RLS on, is_demo column, anon can INSERT own signup + read aggregates ONLY. Negative test: anon SELECT on raw rows must FAIL. Screenshot the test output.
  - **Status**: VERIFIED LIVE (2026-07-21, updated after CodeRabbit review) — migrations 032+033 applied. Negative test: anon SELECT on raw `waitlist` → `401`/`42501 permission denied`, screenshot `tests/e2e-screenshots/phase2-negative-rls-test-anon-select-denied.png`. Positive test: anon EXECUTE on both aggregate RPCs → `200`, zero PII in response. `__tests__/waitlist-security.test.ts` run live: **4/4 pass** (commit 042ae15) — the one earlier failure (migration 032 never granted `anon` table-level INSERT) was resolved by *withdrawing* migration 034's proposed fix rather than applying it (granting broad INSERT would have been a worse vulnerability, see DECISIONS.md CodeRabbit review entry) and inverting the test to assert anon INSERT is correctly blocked, matching the real app's design (service-role key only).

- [ ] Mobile LTE performance check with throttling, evidence pasted
  - **Status**: NOT STARTED — genuinely not done this session (root cause of the earlier "dev server is unusable" problem was diagnosed and fixed: this machine's Node was 22.11.0, one patch below the 22.12.0 vite/rolldown requires; installed 22.12.0 via nvm scoped to this shell, dev cold-start went from 6.5min to 878ms). Environment is fast now — no longer blocked, just not yet done.

- [ ] Playwright E2E full loop: signup → position → referral link → second signup → rank improves → milestone flips at 3 → admin reflects all. Screenshots each step.
  - **Status**: IN PROGRESS — most of the loop is now real and verified: signup → position (`phase2-waitlist-signup-SUCCESS.png`), referral link → second signup → rank improves (`phase2-referral-chain-A-signup.png`, `phase2-referral-chain-B-signup-via-referral.png`, live DB query confirming the position/count change). Still not checked off per §22 — two pieces remain: the literal milestone flip at 3 referrals (only 1 referral has been run; the boundary case at count=1 is confirmed correct, see the item above) and the admin dashboard reflecting real data as a logged-in admin (no admin credentials in this environment).

- [x] Deploy-ready: document exact deploy steps + env vars needed in README
  - **Status**: VERIFIED — README.md "Waitlist system" subsection added under Deployment (commit 7ca9c52): migration order, `NEXT_PUBLIC_APP_URL` requirement (referral links fall back to localhost if unset), admin role requirement, optional video asset.

**Migration 034 update**: originally proposed granting `anon` table-level `INSERT` (found live-testing `waitlist-security.test.ts`). Withdrawn after CodeRabbit review — the grant would have let anon set `is_demo`/`founding_500`/`verified_referral_count` directly, a real vulnerability, not a gap. Rewritten as a documented no-op; do not apply as a real grant. See DECISIONS.md CodeRabbit review entry.

**Migration 035**: new, adds `credit_referral()` (atomic referral increment, fixes a lost-update race CodeRabbit found in the original JS read-then-write) and hardens the two stats RPCs (`REVOKE EXECUTE FROM PUBLIC`). **Founder action**: apply via SQL Editor — see DECISIONS.md. Until applied, referral crediting logs an error and no-ops rather than failing the signup.

**Phase 2 Status**: MERGED — PR #4 squash-merged to `main` as commit `f351a46` (2026-07-21), CodeRabbit clean across 5 review passes. Migrations 032, 033, 035, 036 all applied and live-verified. Referral position-boost + verified-count increment confirmed via a real two-signup chain (position 2→1, count 0→1, live DB query). Migration 035's initial anon-EXECUTE lockdown didn't fully take (Supabase's schema-level default privileges grant EXECUTE to anon/authenticated independent of `REVOKE ... FROM PUBLIC`) — caught live immediately, fixed with migration 036, re-verified (anon call now correctly `401`). **Genuinely open, carried forward rather than claimed done**: admin dashboard content as a logged-in admin (auth gate itself is verified), anti-abuse sub-items beyond email dedupe, the literal milestone flip at 3 referrals (boundary case at count=1 confirmed correct, full flip not yet observed), mobile LTE performance testing. None of these block Phase 3, which has already started on the same branch/PR (process deviation from §23, logged in DECISIONS.md).

**MAJOR FINDING, RESOLVED (2026-07-21)**: actually testing a live signup (not code-reading — WARP.md rule 1) revealed migration 032 was **never applied to the live DB**, despite this file and DECISIONS.md previously stating it was — the live table had only 5 of ~20 columns, every real signup was 500ing. Ryan/Sameer applied migration 032 (as an `ALTER TABLE ADD COLUMN IF NOT EXISTS` conversion, table confirmed empty so no data risk) then 033, same day. Re-verified live: schema complete, negative RLS test passes, a real signup returns 201. Full writeup in DECISIONS.md, including the honesty-ledger entry for the original false claim. Failure screenshot kept for contrast: `tests/e2e-screenshots/phase2-waitlist-signup-FAILS-live-migration-032-gap.png`; success screenshot: `phase2-waitlist-signup-SUCCESS.png`.

PR #4 merged to `main` as `f351a46`. Migration 035 (referral atomicity + RPC hardening, added in response to CodeRabbit review) is written but not yet applied — founder action in DECISIONS.md, doesn't block anything currently working.

---

## PHASE 3 — WAITLIST DESIGN LAYER

Apply premium design to the EXISTING Phase 2 page — do not fork it. Ryan's lane, specced here so it's canon.

**Modified from original directive 2026-07-21** (see DECISIONS.md): no `taste-skill` install, no Kling/Higgsfield/Nano Banana. Native build instead.

- [x] Hero: exploded-view house that assembles on scroll (Home Passport metaphor). Built natively — SVG/CSS illustration + Framer Motion scroll-timeline, no external video generation, no frames-as-JPEGs pipeline.
  - **Status**: VERIFIED — `components/waitlist/ExplodedHouseHero.tsx`, merged to `main` as `35374d6` (PR #5, squash). Five flat-color SVG layers (roof/upper/lower/systems/foundation) assemble via `useScroll`/`useTransform` against a sticky container; `useReducedMotion` renders assembled/static instead of animating. This round added a literal copper pipes/wiring "systems" layer between the lower floor and foundation — ties the palette rationale (copper = actual trade material) directly into the hero metaphor. Real screenshots: `phase3-hero-desktop.png` (exploded state), `phase3-hero-desktop-mid-scroll.png` (assembling), `phase3-hero-mobile.png`. Asset weight is inline SVG/CSS, well under 300kb (no binary assets at all).

- [x] Scroll arc: hero (gamble) → horror story → free AI estimate → 5 mechanics (Match/Passport/Backstory/Health Score/Oracle) panels → 80% matching-standard gate → Founding-tier referral rewards → final CTA with position number
  - **Status**: VERIFIED — `components/waitlist/ScrollNarrative.tsx` (`Problem`, `Shift`, `MechanicsPanels`, `EightyGate`, `FoundingTiers`) + rewired `app/waitlist/page.tsx`, merged `35374d6`. Copy for the 5 mechanics pulled from `MASTER_PLAN.md`/`WAR_PLAN.md` canon, not invented — Oracle panel includes the required statistical-framing disclaimer. Numeric anchors ($18,500–$42,000 estimate range, 80% match threshold) use GSAP ScrollTrigger count-up (`CountUpStat.tsx`) instead of a static number. Screenshots: `phase3-mechanics-panels.png`, `phase3-final-cta.png`.
  - **Warm Copper color system applied site-wide**: `app/styles/design-tokens.css` rewritten with a psychology-driven 6-color palette (warm off-white base, warm charcoal text, copper accent), every text/background pairing verified against the real WCAG relative-luminance formula, not eyeballed — full contrast table in the file's header comment. Two real AA failures were found in the process and fixed: secondary gray text (3.61:1 → darkened to 4.80:1) and the primary button's copper fill against its actual inverse-text token (4.33:1 → darkened `--color-brand-solid` to `#9C612A`, 4.77:1) — the latter was a site-wide bug in `components/ui/button.tsx` affecting every primary button, not just the waitlist page. See DECISIONS.md for the two-round color-correction history.

- [x] Mobile: static hero frame fallback if scroll-scrub too heavy; mobile-optimize passes
  - **Status**: VERIFIED — `useReducedMotion` fallback renders assembled/static, confirmed via `phase3-hero-mobile.png`. Mobile LTE performance measured against the real PR #5 preview deployment via Playwright + CDP throttling (Fast 3G-equivalent: 1.6Mbps/750Kbps/150ms RTT, 4x CPU throttle, iPhone viewport/UA): **1.95s to full `load`, 25 requests, 360.7KB transferred** — passes the "usable under 3s" target with real margin. Full methodology and evidence in DECISIONS.md.

- [x] §20 screenshots: hero desktop+mobile, each section, final CTA. Mobile LTE perf pasted.
  - **Status**: VERIFIED — hero/mechanics/final-CTA/mobile screenshots plus the LTE throttled-network evidence above, all real captures, not assumed.

- [x] CodeRabbit review — PR #5, findings addressed
  - **Status**: VERIFIED — 4 actionable findings, all real, all fixed: duplicate success card on submit (hero + final CTA both rendering the full referral card), hero spots-counter not hidden post-submit (final CTA had the guard, hero didn't), the button-contrast miss described above, and an unnecessary `react-hooks/set-state-in-effect` in `CountUpStat.tsx`. Full list in DECISIONS.md.

- [x] Waitlist becomes the pre-launch front page
  - **Status**: VERIFIED LIVE — `app/page.tsx` now redirects to `/waitlist`; the original 542-line marketing homepage preserved verbatim at `/home` for post-launch use. Confirmed no `(dashboard)` routes linked to `/` (only public marketing pages did, which is the intended pre-launch behavior). Verified on production (not just preview): `/` → 307 to `/waitlist`, `/home` still serves the original page.

- [ ] Deploy the finished page to public domain, SSL, env vars in host not repo, live URL reported
  - **Status**: NOT STARTED as a *custom domain* — the page is live on the existing Vercel production URL (env vars fixed live, real signup returns 201) but no custom domain/hosting decision has been made yet (see the open founder decisions further down this file).

**Phase 3 Status**: MERGED — PR #5 squash-merged to `main` as `35374d6` (2026-07-22). Warm Copper design system, GSAP count-up stats, copper-systems hero layer, referral-tier section, and the waitlist-as-homepage swap are all live in production with real evidence (screenshots + LTE perf + CodeRabbit clean). Only remaining item is a custom domain, which is a founder decision, not code work.

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

**Current**: Phase 2 MERGED (`f351a46`), Phase 3 MERGED (`35374d6`, PR #5)
**Phase 1 Completed**: All close-out items done, live DB verified, Playwright screenshot confirms estimate rendering
**Phase 2**: Migrations 032/033/035 applied and live-verified, RLS/PII hole closed, referral/milestone/admin-auth/anti-abuse code shipped, CodeRabbit findings addressed across 5 review passes (7 fixed, 1 dangerous proposal withdrawn, 3 resolved-by-events), PR #4 squash-merged to `main`. Real referral chain verified live (position 2→1, count 0→1).
**Phase 3**: Warm Copper design system (real AA contrast math, one site-wide button-contrast bug fixed as a result), exploded-house hero with a copper-systems layer, GSAP count-up stats, 80% gate + Founding-tier referral rewards, waitlist promoted to the pre-launch homepage (`/` → `/waitlist`, old homepage preserved at `/home`), mobile LTE perf evidence (1.95s/360.7KB on throttled Fast-3G), CodeRabbit findings on PR #5 addressed (4/4). PR #5 squash-merged to `main` as `35374d6`, verified live on production.
**Genuinely open, not blocking**: migration 036 (closes a real gap — `credit_referral()` was anon-callable after 035; fix written, not yet applied — founder action), admin dashboard content as a logged-in admin, full referral-chain E2E test past the count=1 boundary (milestone flip at count=3 not yet directly observed), a custom domain for the waitlist (currently live on the default Vercel production URL, not a custom domain).
**Proceeding To**: apply migration 036 when convenient → re-verify the anon `credit_referral()` call now 401s → Phase 4 (remaining Gate 4 bugs) whenever picked up next, per the durability protocol (read this file, resume from first unchecked item).

---

## PHASE 4 — LAYWORK PUBLIC WEBSITE (directive 2026-07-24)

**Status**: IN PROGRESS — Step 1 executing
**Mission**: One job pre-launch — convert visitors into waitlist signups and Founding Members. Not a brochure site.

### Locked decisions (log change requests in DECISIONS.md, don't relitigate)
- Name LAYWORK, user-facing strings only (repo/DB/env/package rename is a separate founder call — inventory reported in the Step 1 report).
- Blue/White/Black palette from the tokens file, no hardcoded hex. Black type, white space, blue for action. One blue CTA per viewport. Six colors, never a seventh. (DECISIONS.md 2026-07-24)
- NO SMS: waitlist = name + email only; phone/sms_* DB columns stay nullable, never dropped. (DECISIONS.md 2026-07-23)
- WCAG 2.1 AA on every page. Mobile-first (90% of traffic = Instagram on a phone).
- Durable: tokens file + one component system. The paint is replaceable; the system is not.
- Founders Program canon per DECISIONS.md 2026-07-24 (500 auto-founders, referral tiers 3/5/10, ~100 spots per referral, top-25 leaderboard, wave access).

### Steps (one step per session, verified, then the founder issues the next)

- [ ] **STEP 1 — Homepage shell + waitlist modal** ← CURRENT
  - Homepage at `/` (replaces the redirect to /waitlist): nav (wordmark, minimal links, one blue CTA → modal), hero ("Stop gambling on contractors." / "Free AI estimates. Contractors matched at 80%+ compatibility. Northern Virginia first.", CTA → modal, marked slot for scroll video — NOT wired this session), correctly spaced section stubs (problem, estimate, five mechanics, 80% gate, Founders Program, final CTA), footer (wordmark, links, one legal line), scroll reveals per motion tokens.
  - Waitlist modal per directive: reuse Phase 2 signup logic via shared hook (no second signup path, RLS untouched); lit floating panel (layered shadows, blurred backdrop, 0.96→1 entry, illuminated accent border with bloom); Stage 1 name+email+live Founding-500 counter; Stage 2 in-place count-up position number, glow pulse, referral link one-tap copy, tier rewards, Founding badge; full a11y (§25) incl. reduced-motion; mobile bottom sheet with lit top edge, 16px inputs.
  - Evidence: homepage + modal-state screenshots desktop/mobile, real signup row pasted from live table, extracted-logic report, old-name inventory.
- [ ] STEP 2 — Founders Program page (tiers, rewards, counter)
- [ ] STEP 3 — Referral status page (position, link, progress)
- [ ] STEP 4 — Public leaderboard page (top 25, first name + last initial)
- [ ] STEP 5 — Legal: Privacy + Terms placeholder copy, flagged for attorney review
- [ ] STEP 6 — Shared polish: SEO metadata, Open Graph share cards, favicon; verify existing admin dashboard post-rename

### Tooling & delegation (directive 2026-07-24, second revision)
- Skills active this session: `high-end-visual-design` + `full-output-enforcement` (both already installed under .claude/skills — no new install needed; applied within the locked palette, which wins over any skill preference).
- UI primitives: existing component system (components/ui — 21st.dev-derived Button/Input) reused; bespoke CSS only where the modal spec demands it (soft-filled inputs, illuminated panel).
- Motion: framer-motion for scroll reveals (already the repo's scroll-motion lib per Phase 3 hero), CSS keyframes + rAF for modal entry/count-up. No new motion dependency.
- Generation scripts (scripts/generate-image.ts / generate-video.ts): not used — Step 1 needs no imagery; the hero video slot is explicitly unwired this session.
- Delegation: Agent A (homepage shell), Agent C (a11y audit + old-name inventory) in parallel on disjoint files; modal built in-session (was already 80% complete when the delegation directive arrived — delegating would have duplicated it).
