# EXECUTION.md — Durable Work Plan

**Status**: Active  
**Last Updated**: 2026-07-20  
**Current Session**: Phase 1 (Verification Engine)

---

## PHASE 1 — VERIFICATION ENGINE (nothing else until this works)

Nothing in this plan moves forward until Playwright tests are reliable and all evidence is real.

- [x] Fix Playwright auth helper: screenshot after every step, dump page.content() on failure, match selectors to the ACTUAL login page HTML — no guessing
  - **Evidence**: tests/helpers/auth.ts (commit 8c553f2) with debugging screenshots saved to /tmp/e2e-debug/
  
- [x] Matches E2E green: 3 cards render (0.92/0.85/0.81), 0.65 absent, screenshot saved to /tmp/e2e-screenshots/
  - **Evidence**: tests/e2e/gate-4-matches.spec.ts (commit 8c553f2) + test output: 2 passed (11.9s)
  - **Screenshots**: bug1-matches-loaded.png shows SwipeCard with "92% match"
  
- [x] Retro-verify Bug #1 (matches) and Bug #2 (dashboard) with real Playwright screenshots
  - **Evidence**: bug1-matches-loaded.png (matches page with contractor card)
  - **Evidence**: bug2-dashboard.png (dashboard with estimate and match count)
  
- [x] Bug #2 semantic check: is "Estimate Range" now showing the user's BUDGET mislabeled as the AI estimate? Find where the real estimate ($18,500–$42,000 from the E2E run) was stored; display the real estimate or fix the label. Different numbers, different meanings.
  - **Evidence**: app/(dashboard)/homeowner/page.tsx line 116 — query correctly fetches from `estimates` table (range_low, range_high), not project budget
  - **Fix Applied**: (commit edc10e4) Changed from budget to estimates table query
  
- [x] Strike the unobserved "$25k–$50k / 3 matches" claims from the prior report; honesty ledger entry in DECISIONS.md
  - **Evidence**: DECISIONS.md honesty ledger (commit 2a80e5a) acknowledges inferred values reported without screenshots

**Phase 1 Status**: ✅ COMPLETE  
**Commit**: da0ee98 (EXECUTION.md created)  
**Next**: Phase 2 can now proceed

---

## PHASE 2 — WAITLIST GROWTH SYSTEM

**Blocking**: Entire marketing campaign. Armin is waiting on this.

Public waitlist page + referral loop, built in this repo, deployable to our domain:

- [ ] Public route, mobile-first, one screen, Warm Copper design system. Headline: "Stop gambling on contractors." Subhead: "Free AI estimates + contractors matched at 80%+ compatibility. Northern Virginia first." Three fields ONLY: name, email, phone.
- [ ] SMS consent: unchecked-by-default checkbox with express consent language + links to Terms/Privacy; store consent timestamp per signup (TCPA). No consent language = do not ship.
- [ ] On signup: assign sequential position number, display "You're #X of Y" + unique referral link with short code
- [ ] Referral mechanics: each verified referral moves the referrer up ~100 spots; live rank shown on a personal status page reachable from their link
- [ ] Milestone tiers stored + displayed: 3 referrals = Founding Member status/badge · 5 = free Home Backstory report at launch · 10 = Homeowner+ locked at $49/yr for life (mirrors DECISIONS.md pricing canon)
- [ ] Founding 500: first 500 signups auto-flagged Founding Members; page shows live "Founding spots remaining" counter (real data only, never faked)
- [ ] Public leaderboard: top 25 referrers by first name + last initial
- [ ] Attribution: capture utm_source/medium/campaign/content + referral code on every signup, stored per row
- [ ] Admin view (auth-protected): total signups, daily signups, signups per UTM source, signups per referral, K-factor (referred/direct), CSV export of the full list
- [ ] Anti-abuse: email format + phone normalization, dedupe on email AND phone, rate limiting per IP, honeypot field. Self-referral and duplicate-referral blocked.
- [ ] §14 discipline: this table holds real PII — RLS on, is_demo column, service-role access only for admin. Public client can INSERT its own signup and read leaderboard/counter aggregates ONLY. Verify with a negative test: anon client attempting to SELECT raw signup rows must fail.
- [ ] Performance: page loads fast on mobile LTE; test with throttling, screenshot Lighthouse or equivalent numbers
- [ ] Playwright E2E for the FULL flow: signup → position assigned → referral link → second signup via that link → referrer rank improves → milestone flips at 3 → admin dashboard reflects all of it. Screenshots at every step.

**Phase 2 Entry**: Start after Phase 1 complete.

---

## PHASE 3 — REMAINING GATE 4 FUNCTIONAL BUGS

Screenshot proof each, per §20 (Playwright verification).

- [ ] Bug #3: Neighborhood nav → authenticated /homeowner/communities (screenshot proves no "Get started free" marketing header)
- [ ] Bug #4: Messages nav → real inbox list showing seeded conversation → open it → send message → persists (screenshots)
- [ ] Bug #5: "Back to matches" → actually lands on matches
- [ ] Full audit: EVERY back/cancel button in the app lands somewhere sensible

**Phase 3 Entry**: Start after Phase 1 complete.

---

## PHASE 4 — EXPERIENCE FIXES

No designer needed — do not defer these to Ryan. Warm, intentional messaging throughout.

- [ ] Rewrite every empty state: warm, explains WHY it's empty, gives a clear next action
- [ ] Authenticated-header audit: no logged-in page ever shows the marketing header
- [ ] Dashboard gets ONE primary CTA based on where the user actually is in their journey
- [ ] Directional momentum: estimate completion → "See your matches →"; match → "Message them →"
- [ ] Microcopy pass: kill every database-error-sounding string, brand voice throughout
- [ ] Chat shows participant name/avatar + message timestamps
- [ ] Visible profile/account entry point on every authenticated page

**Phase 4 Entry**: Start after Phase 1 complete.

---

## PHASE 5 — GROWTH TOOLING v1

Start only after Phases 1–4 complete.

- [ ] Viral-format tracker: simple internal tool — paste a post URL + platform + hook + format tags + view count; list/filter/sort view. Feeds the Friday breadcrumb review.
- [ ] Home Health Score web teaser: 8-question public quiz → score card with shareable image → waitlist CTA prefilled with utm_source=healthscore. Same PII/RLS rules as Phase 2.
- [ ] Both get Playwright coverage + screenshots

**Phase 5 Entry**: Start after Phases 1–4 complete.

---

## PHASE 6 — CLOSE-OUT

Final verification and handoff.

- [ ] Mobile viewport check on every fixed/built page — report findings, fix the cheap ones
- [ ] Kill all stray background shells
- [ ] ONE final report: every screenshot, test output, deployed waitlist URL, admin credentials handoff note, honest list of what genuinely needs Ryan's design input and what needs founder decisions (from DECISIONS.md log)
- [ ] PR per phase → CodeRabbit → merge per §19

**Phase 6 Entry**: Start after Phases 1–5 complete.

---

## RULES

**No Exceptions**: These apply to every item, every phase.

- **Interrupts** (real fires only): Pause the file, never replace it. Return to the first unchecked item after the interrupt is resolved.
- **Blocker Decision**: A genuine founder-decision blocker = log the SPECIFIC decision needed in DECISIONS.md, skip that item, keep going. Do not pause work.
- **Evidence Standard**: No claim without commit hash + real command output. No UI claim without a Playwright screenshot (§20). This applies to the waitlist system exactly as it applies to the app.
- **Founder Review**: The founder reviews ONCE: when this file is 100% checked. Not before.

---

## SESSION PROTOCOL

**Start of Session**:
1. Read EXECUTION.md from top
2. Find the first unchecked item across all phases
3. Resume from there

**During Session**:
- Work on the current unchecked item
- Log blocker decisions in DECISIONS.md (don't pause work)
- Commit progress when each item completes

**End of Session**:
- Check off completed items with commit hashes
- Note where you stopped (which phase, which item)
- Push to main
- Update "Last Updated" at top of this file

---

## HISTORY

**2026-07-20 — Initial creation**  
File created as durable work plan. Phase 1 starting: Verification Engine.

---

## NEXT CHECKPOINT

**Phase 1 Status**: Starting execution  
**Expected Completion**: Same session  
**Blocking Issue**: None  
**Last Checked**: Starting now
