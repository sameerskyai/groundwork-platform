-- 018 — Demo Isolation: Write Restrictions (UPDATE/DELETE)
-- Adds explicit RESTRICTIVE policies for UPDATE/DELETE to prevent demo admin
-- from modifying real data, even with direct row IDs

-- Profiles: Block UPDATE/DELETE on is_demo=true rows
DROP POLICY IF EXISTS "demo_isolation_profiles_update" ON profiles;
CREATE POLICY "demo_isolation_profiles_update" ON profiles
  AS RESTRICTIVE
  FOR UPDATE
  USING (is_demo = false);

DROP POLICY IF EXISTS "demo_isolation_profiles_delete" ON profiles;
CREATE POLICY "demo_isolation_profiles_delete" ON profiles
  AS RESTRICTIVE
  FOR DELETE
  USING (is_demo = false);

-- Contractor Profiles: Block UPDATE/DELETE on is_demo=true rows
DROP POLICY IF EXISTS "demo_isolation_contractors_update" ON contractor_profiles;
CREATE POLICY "demo_isolation_contractors_update" ON contractor_profiles
  AS RESTRICTIVE
  FOR UPDATE
  USING (is_demo = false);

DROP POLICY IF EXISTS "demo_isolation_contractors_delete" ON contractor_profiles;
CREATE POLICY "demo_isolation_contractors_delete" ON contractor_profiles
  AS RESTRICTIVE
  FOR DELETE
  USING (is_demo = false);

-- Projects: Block UPDATE/DELETE on is_demo=true rows
DROP POLICY IF EXISTS "demo_isolation_projects_update" ON projects;
CREATE POLICY "demo_isolation_projects_update" ON projects
  AS RESTRICTIVE
  FOR UPDATE
  USING (is_demo = false);

DROP POLICY IF EXISTS "demo_isolation_projects_delete" ON projects;
CREATE POLICY "demo_isolation_projects_delete" ON projects
  AS RESTRICTIVE
  FOR DELETE
  USING (is_demo = false);

-- Matches: Block UPDATE/DELETE on is_demo=true rows
DROP POLICY IF EXISTS "demo_isolation_matches_update" ON matches;
CREATE POLICY "demo_isolation_matches_update" ON matches
  AS RESTRICTIVE
  FOR UPDATE
  USING (is_demo = false);

DROP POLICY IF EXISTS "demo_isolation_matches_delete" ON matches;
CREATE POLICY "demo_isolation_matches_delete" ON matches
  AS RESTRICTIVE
  FOR DELETE
  USING (is_demo = false);

-- Reviews: Block UPDATE/DELETE on is_demo=true rows
DROP POLICY IF EXISTS "demo_isolation_reviews_update" ON reviews;
CREATE POLICY "demo_isolation_reviews_update" ON reviews
  AS RESTRICTIVE
  FOR UPDATE
  USING (is_demo = false);

DROP POLICY IF EXISTS "demo_isolation_reviews_delete" ON reviews;
CREATE POLICY "demo_isolation_reviews_delete" ON reviews
  AS RESTRICTIVE
  FOR DELETE
  USING (is_demo = false);

-- Referrals: Block UPDATE/DELETE on is_demo=true rows
DROP POLICY IF EXISTS "demo_isolation_referrals_update" ON referrals;
CREATE POLICY "demo_isolation_referrals_update" ON referrals
  AS RESTRICTIVE
  FOR UPDATE
  USING (is_demo = false);

DROP POLICY IF EXISTS "demo_isolation_referrals_delete" ON referrals;
CREATE POLICY "demo_isolation_referrals_delete" ON referrals
  AS RESTRICTIVE
  FOR DELETE
  USING (is_demo = false);
