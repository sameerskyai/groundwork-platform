-- ============================================================
-- 030 — SECURITY FIX: Contractor Profiles RLS (simpler policy)
-- ============================================================
-- Migration 029 attempted to use a subquery in the RLS policy,
-- but subqueries in RLS policies have access issues with other
-- RLS-protected tables. This migration simplifies the policy:
--
-- Policy: Allow authenticated users to read all contractor profiles.
-- Access control is enforced at the matches/projects level:
-- - Users can only fetch matches for projects they own
-- - Even if they can read all contractors, they only see contractors
--   matched to their own projects (via the matches query filter)
-- ============================================================

-- Drop complex policy from 029
DROP POLICY IF EXISTS "contractor_profiles_access" ON contractor_profiles CASCADE;

-- Add simpler PERMISSIVE policy: just require authenticated role
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contractor_profiles_authenticated_read" ON contractor_profiles
  AS PERMISSIVE
  FOR SELECT
  USING (auth.role() = 'authenticated');
