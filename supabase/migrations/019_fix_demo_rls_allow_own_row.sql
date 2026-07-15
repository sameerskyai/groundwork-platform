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
