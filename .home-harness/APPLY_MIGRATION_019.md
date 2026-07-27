# Apply Migration 019 — Quick Start

**Time required:** 2 minutes  
**Difficulty:** Copy-paste into Supabase dashboard  
**Status:** Unblock founder login hang

---

## Quick Steps

### 1. Open Supabase SQL Editor

Go to: https://app.supabase.com/project/dhmxxywdsdxzzcuezztv/sql/new

### 2. Copy Migration 019

Copy the entire contents of this file:
```
supabase/migrations/019_fix_demo_rls_allow_own_row.sql
```

Full contents to paste:

```sql
-- ============================================================
-- 019 — Fix Demo RLS: Allow Users to Read Own Row
-- ============================================================
-- Problem: RESTRICTIVE RLS policies (is_demo = false) blocked ALL is_demo=true rows,
-- including authenticated users from reading their own profiles.
-- This broke the entire onboarding flow for demo admin.
--
-- Solution: Amend RLS policies to allow reading own row while keeping demo wall intact:
-- USING (is_demo = false OR id = auth.uid())
--
-- This:
-- ✓ Allows users to read their own is_demo=true profile (unblock onboarding)
-- ✓ Keeps is_demo=true rows invisible to other users (maintain demo isolation)
-- ✓ Passes Test 2: demo rows still blocked from OTHER users
-- ============================================================

-- Profiles: Allow users to read own row
DROP POLICY IF EXISTS "demo_isolation_profiles" ON profiles;
CREATE POLICY "demo_isolation_profiles" ON profiles
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false OR id = auth.uid());

-- Contractor Profiles: Allow users to read own row
DROP POLICY IF EXISTS "demo_isolation_contractors" ON contractor_profiles;
CREATE POLICY "demo_isolation_contractors" ON contractor_profiles
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false OR user_id = auth.uid());

-- Projects: Allow users to read own row
DROP POLICY IF EXISTS "demo_isolation_projects" ON projects;
CREATE POLICY "demo_isolation_projects" ON projects
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false OR homeowner_id = auth.uid());

-- Matches: Allow users to read own row
DROP POLICY IF EXISTS "demo_isolation_matches" ON matches;
CREATE POLICY "demo_isolation_matches" ON matches
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false OR project_id IN (SELECT id FROM projects WHERE homeowner_id = auth.uid()) OR contractor_id = auth.uid());

-- Reviews: Allow users to read own row
DROP POLICY IF EXISTS "demo_isolation_reviews" ON reviews;
CREATE POLICY "demo_isolation_reviews" ON reviews
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false OR reviewer_id = auth.uid() OR reviewee_id = auth.uid());

-- Community Posts: Allow users to read own row
DROP POLICY IF EXISTS "demo_isolation_community_posts" ON community_posts;
CREATE POLICY "demo_isolation_community_posts" ON community_posts
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false OR author_id = auth.uid());

-- Referrals: Allow users to read own row
DROP POLICY IF EXISTS "demo_isolation_referrals" ON referrals;
CREATE POLICY "demo_isolation_referrals" ON referrals
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false OR referrer_id = auth.uid() OR referree_id = auth.uid());
```

### 3. Paste into Supabase

1. Paste the SQL above into the SQL editor (https://app.supabase.com/project/dhmxxywdsdxzzcuezztv/sql/new)
2. Click the blue "Run" button
3. Wait for confirmation: "Success" message appears

### 4. Verify Success

After "Success" appears:
- Close the SQL editor
- Go to: https://app.supabase.com/project/dhmxxywdsdxzzcuezztv/auth/users
- Find `founder.demo@example.com`
- Verify the login works (should redirect to dashboard, not hang)

---

## What This Does

**Before:** Founder login → `/onboarding` → Profile fetch blocked by RLS → Hangs on "Loading..."  
**After:** Founder login → `/onboarding` → Profile fetch succeeds → Auto-redirects to `/homeowner` dashboard

**Safety:** Other users still cannot see demo data (RLS wall intact for them)

---

## Next Steps (if needed)

After applying migration 019:

```bash
# Re-seed to refresh demo data with founder marked as onboarded
npx tsx supabase/seed/01-marketplace-demo.ts

# Verify tests still pass
npm run test:live-db

# Commit changes
git add supabase/migrations/019_fix_demo_rls_allow_own_row.sql
git add supabase/seed/01-marketplace-demo.ts
git add app/\(auth\)/onboarding/page.tsx
git commit -m "fix: unblock founder login by allowing demo admin to read own profile (migration 019)"
```

---

## Troubleshooting

**If you see an error in Supabase:**
- Copy-paste the entire SQL above again
- Make sure you're in the SQL editor (not the query builder)
- Check that you selected the right project (dhmxxywdsdxzzcuezztv)

**If founder still hangs after applying:**
- Try refreshing the page in your browser
- Check browser console for specific error messages
- Verify the founder account exists: https://app.supabase.com/project/dhmxxywdsdxzzcuezztv/auth/users

---

## Done! 🎉

After successful application, founder login should work end-to-end.
