# Founder Login Fix — Three-Part Solution

**Status:** 🔴 BLOCKING — Founder walkthrough hangs at login  
**Root Cause:** RESTRICTIVE RLS policy blocks demo admin from reading own profile  
**Diagnosis Date:** 2026-07-15  

---

## The Problem

When founder logs in as `founder.demo@example.com`:
1. ✓ Authentication succeeds
2. ✓ Auth redirect to `/onboarding` works
3. ❌ Onboarding page tries to fetch profile
4. ❌ RLS policy (`is_demo = false`) blocks ALL is_demo=true rows, including own
5. ❌ Profile fetch returns empty set
6. ❌ UI hangs on "Loading..." indefinitely

**RLS Issue Diagnosed:**
```
Test: Can founder read own profile?
Sign in as: founder.demo@example.com
Query: SELECT * FROM profiles WHERE id = auth.uid()
Result: ❌ PGRST116 — Cannot coerce to single JSON object (RLS blocked all rows)
```

---

## The Solution — Three Parts

### PART 1: Fix RLS Policy (Migration 019)

**What:** Allow users to read their own is_demo=true rows while blocking others  
**Benefit:** Unblocks profile fetch for demo admin  
**Safety:** Other users still cannot see demo rows (demo wall intact)  
**Status:** ⏳ Awaiting manual application

**How to apply:**
1. Go to: https://app.supabase.com/project/dhmxxywdsdxzzcuezztv/sql/new
2. Copy the entire contents of: `supabase/migrations/019_fix_demo_rls_allow_own_row.sql`
3. Paste into the SQL editor and click "Run"
4. Verify: No errors

**Alternative (if using CLI):**
```bash
supabase db push --linked
```

**Changed Policies:**
- `profiles`: `is_demo = false OR id = auth.uid()`
- `contractor_profiles`: `is_demo = false OR user_id = auth.uid()`
- `projects`: `is_demo = false OR homeowner_id = auth.uid()`
- `matches`: `is_demo = false OR (project_id IN (...) OR contractor_id = auth.uid())`
- `reviews`: `is_demo = false OR (reviewer_id = auth.uid() OR reviewee_id = auth.uid())`
- `community_posts`: `is_demo = false OR author_id = auth.uid()`
- `referrals`: `is_demo = false OR (referrer_id = auth.uid() OR referree_id = auth.uid())`

**Test to verify RLS works:**
```bash
npm run test:live-db
# Should still pass all 6 tests, especially Test 2: "demo rows blocked from OTHER users"
```

---

### PART 2: Mark Founder as Onboarded

**What:** Set `onboarding_complete: true` for founder account  
**Benefit:** After RLS fix, founder will auto-redirect to dashboard instead of onboarding  
**Status:** ⏳ Ready — two options

**Option A: Re-seed from scratch (recommended)**
```bash
# This will purge all demo data and reseed fresh with founder already onboarded
npx tsx supabase/seed/01-marketplace-demo.ts
```

**Option B: Update existing founder account**
```bash
# If you want to keep existing demo data and just update the founder
npx tsx scripts/update-founder-onboarded.ts
```

**What changed in seed:**
- `seed/01-marketplace-demo.ts` now includes `onboarding_complete: true` when creating founder profile

---

### PART 3: Loading Timeout & Error Handling (DONE)

**What:** Added 5-second timeout + error UI to onboarding page  
**Benefit:** If RLS or profile fetch fails, shows error instead of hanging  
**Status:** ✅ COMPLETE

**Changes:**
- `app/(auth)/onboarding/page.tsx`:
  - Added 5-second timeout for profile fetch
  - Added error state UI with refresh button
  - Added check for `onboarding_complete` flag
  - If already onboarded, auto-redirects to dashboard
  - Better loading indicator with helpful message

---

## Verification Checklist

After applying all three parts:

- [ ] **Part 1 Applied:** Migration 019 applied to live database
- [ ] **Part 2 Applied:** Founder account marked as onboarded (via seed or update script)
- [ ] **Tests Pass:** `npm run test:live-db` — all 6 tests passing
- [ ] **Login Test:** Log in as `founder.demo@example.com / FounderDemo123!`
  - Should redirect to `/homeowner` dashboard (not `/onboarding`)
  - Should see demo data (projects, matches, etc.)
  - Should see demo watermark at top
- [ ] **Build Clean:** `npm run build` — no errors
- [ ] **Demo Data Visible:** Founder can see all 40+ homeowners, 25+ contractors, demo matches

---

## Execution Order

1. **Apply Migration 019** (Supabase SQL Editor)
2. **Re-seed or update founder** (`npx tsx supabase/seed/01-marketplace-demo.ts` OR `npx tsx scripts/update-founder-onboarded.ts`)
3. **Verify tests pass** (`npm run test:live-db`)
4. **Test login** in browser
5. **Commit changes** (migration, seed update, onboarding timeout)

---

## Files Changed

- `supabase/migrations/019_fix_demo_rls_allow_own_row.sql` — New migration
- `supabase/seed/01-marketplace-demo.ts` — Added `onboarding_complete: true` to founder
- `app/(auth)/onboarding/page.tsx` — Added timeout, error handling, auto-redirect
- `scripts/update-founder-onboarded.ts` — New utility script for one-off updates

---

## If Something Goes Wrong

**If founder still hangs on onboarding after Part 1 & 2:**
- Check RLS policies are actually applied: Query `SELECT rowsecurity FROM information_schema.tables WHERE table_name='profiles'`
- Check founder account exists: Query `SELECT * FROM profiles WHERE email='founder.demo@example.com'`
- Check onboarding_complete flag: Query same + look for `onboarding_complete` column

**If tests fail after Part 1:**
- Test 2 ("demo rows blocked from OTHER users") should still PASS
- Test 3 ("demo admin can read own row") may be added in future
- If other tests fail, RLS policy has unexpected side effect — check the USING clause

---

## Notes

- ✅ RLS policy change is SAFE — only affects demo isolation, doesn't weaken real security
- ✅ All changes are idempotent (can be re-applied safely)
- ✅ Migration 019 is NOT applied yet — awaiting manual SQL editor action
- ⏳ After all three parts, founder walkthrough should complete end-to-end
