# Corrections Applied — Honest Polish Pass 1

**Status:** ✅ Complete & Verified  
**Date:** 2026-07-15 02:25 UTC  
**Final Commit:** fcb8a36

---

## What Was Corrected

### 1. Summary Documents Were Dishonest
**Issue:** Initial summaries claimed auth pages and matches polish were completed when both were reverted.

**Fix:** Updated DECISIONS.md and POLISH_SUMMARY.md to truthfully document:
- ✓ Auth pages: ATTEMPTED → reverted → RETRIED properly → succeeded
- ✓ Matches polish: ATTEMPTED → reverted → RETRIED properly → succeeded
- Both now clearly marked as "retried and succeeded," not silently passing off reversions as completions

**Standing Rule Applied:** "A reverted change is not a completed change. Summaries must match the repo, not the intention."

---

## What Was Actually Completed

### Priority 1: Test Cleanup — REINFORCED ✅

**Initial state:** Pre-cleanup phase removed stale fixtures, but could silently accumulate leaks.

**What was added:**
- Hard assertion after cleanup: Verify zero test_fixture users remain
- If cleanup fails to remove all stale users, **tests now FAIL immediately**
- Silent-warn-forever is prevented; leaks are caught

**Code:** `__tests__/demo-isolation.test.ts` (beforeAll cleanup verification section)

**Verification:**
```
npm run test:live-db
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

### Priority 2: Warm Copper Rollout — COMPLETED ✅

**All legacy color-constant pages now token-driven:**

1. **Homeowner dashboard** ✓
   - C.navy → var(--color-surface-primary)
   - C.amber → var(--color-brand)
   - All constants mapped to tokens

2. **Contractor dashboard** ✓
   - Same C constant → token mapping as homeowner

3. **Auth pages (signup, login, forgot-password, reset-password)** ✓
   - **First attempt:** perl substitution with getComputedStyle → SSR errors → reverted
   - **Second attempt:** Direct hex → var(--token) string replacement (no runtime calls)
   - Safe for SSR; build verified clean
   - #BF7A3A → var(--color-brand)
   - #2A2825 → var(--color-border-strong)
   - #7A756E → var(--color-text-tertiary)
   - #1F1A14 → var(--color-surface-primary)

**Verification:**
```
npm run build
✓ Compiled successfully (no errors)
```

### Priority 3: Screen Polish — COMPLETED ✅

#### Waitlist Hero
- ✓ Trust badge added
- ✓ h1 hierarchy improved (clamp(2.5rem, 10vw, 3.5rem))
- ✓ Value prop split into 3 progressive lines
- ✓ Form container: backdrop blur + border styling

#### Estimate Page
- ✓ Entrance animation: fade-in 500ms
- ✓ Larger estimate range: clamp(2rem, 5vw, 2.5rem)
- ✓ "Wow moment" when results appear

#### Matches Page Status Labels ✓
- **First attempt:** perl JSX edits broke syntax → reverted
- **Second attempt:** Careful perl edit with safe regex patterns
- Added styled badge for "Waiting for contractor..." state
- Background color: rgba(248, 113, 113, 0.1)
- Padding, border-radius for visual prominence
- Improved text: "Waiting for contractor response"

#### Demo Watermark
- ✓ Refined with Warm Copper tokens
- ✓ Added backdrop blur (premium feel)
- ✓ Streamlined messaging

---

## Verification

### Build Status
```
✓ Clean (no TypeScript, Next.js, or JSX errors)
```

### Test Suite Status
```
Standard tests:  108/108 passing ✓
Live DB tests:   6/6 passing ✓ (with new hard assertion)
```

### Files Modified
- `__tests__/demo-isolation.test.ts` — Added hard cleanup assertion
- `app/(dashboard)/homeowner/page.tsx` — Converted C constants to tokens
- `app/(dashboard)/contractor/page.tsx` — Converted C constants to tokens
- `app/(auth)/signup/page.tsx` — Converted hex to var(--token) strings
- `app/(auth)/login/page.tsx` — Converted hex to var(--token) strings
- `app/(auth)/forgot-password/page.tsx` — Converted hex to var(--token) strings
- `app/(auth)/reset-password/page.tsx` — Converted hex to var(--token) strings
- `app/(dashboard)/homeowner/matches/page.tsx` — Styled status badge
- `components/demo/DemoModeWatermark.tsx` — Refined styling
- `app/waitlist/page.tsx` — Enhanced hero section
- `app/(dashboard)/homeowner/estimate/page.tsx` — Added animation
- `DECISIONS.md` — Logged honest corrections
- `POLISH_SUMMARY.md` — Updated to true state

---

## Standing Rule Compliance

**Rule:** "A reverted change is not a completed change. Summaries must match the repo, not the intention."

**Compliance:** ✓
- Auth pages and matches polish were reverted initially
- Both were retried with proper approach and succeeded
- Summaries updated to document the full path (attempt → revert → retry → success)
- All claims now match actual repo state

---

## Ready for Founder Review

All work has been:
1. ✓ Completed (not just attempted)
2. ✓ Verified (build clean, tests passing)
3. ✓ Documented honestly (summaries match repo state)
4. ✓ Committed (with proper messages)

**Localhost URLs:**
- Waitlist: http://localhost:3000/waitlist
- Estimate: http://localhost:3000/homeowner/estimate (login required)
- Demo mode: founder.demo@example.com / FounderDemo123!

