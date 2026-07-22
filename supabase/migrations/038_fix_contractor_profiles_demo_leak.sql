-- ============================================================
-- 038 — SECURITY FIX: contractor_profiles publicly leaks demo rows
-- Found live during Gate 4 walkthrough prep (2026-07-22).
-- ============================================================

-- Root cause, traced through migration history:
-- 001 created "contractor_profiles_public_read" AS PERMISSIVE USING (true) --
--   readable by literally anyone, anon included, no is_demo awareness yet.
-- 012 added a RESTRICTIVE "demo_isolation_contractors" (is_demo = false) on
--   top of it -- correct at the time: PERMISSIVE(true) AND RESTRICTIVE(is_demo=false)
--   = is_demo=false effectively enforced.
-- 029 dropped "demo_isolation_contractors" and replaced it with a smarter
--   RESTRICTIVE policy allowing a user's own demo-matched contractors too,
--   but hit RLS subquery access issues (per its own follow-up's comment).
-- 030 dropped 029's policy and added a PERMISSIVE "authenticated read"
--   policy instead, reasoning "access control is enforced at the
--   matches/projects level" -- but never restored ANY is_demo RESTRICTIVE
--   policy, and never dropped 001's original PERMISSIVE USING (true).
--
-- Net effect, verified live: an anonymous (anon-key) client can currently
-- SELECT * FROM contractor_profiles and gets real AND is_demo=true rows
-- back with zero filtering -- e.g. "General Contractor - Demo 1" alongside
-- real contractor listings. PERMISSIVE(true) alone makes any RESTRICTIVE
-- policy elsewhere irrelevant, and PERMISSIVE(authenticated) added nothing
-- since PERMISSIVE policies OR together and (true) already covers everyone.
--
-- Fix: drop the original 001 permissive-true policy (the actual leak),
-- keep 030's authenticated-read policy, and add a RESTRICTIVE is_demo
-- filter using a SECURITY DEFINER helper (same pattern as migration 037)
-- so the "user's own demo-matched contractors" exception doesn't hit the
-- same nested-RLS-subquery problem that broke migration 029.

DROP POLICY IF EXISTS "contractor_profiles_public_read" ON contractor_profiles;

CREATE OR REPLACE FUNCTION is_contractor_matched_to_own_project(p_contractor_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM matches m
    JOIN projects p ON p.id = m.project_id
    WHERE m.contractor_id = p_contractor_id AND p.user_id = p_user_id
  );
$$;

DROP POLICY IF EXISTS "demo_isolation_contractors" ON contractor_profiles;
DROP POLICY IF EXISTS "contractor_profiles_access" ON contractor_profiles;
CREATE POLICY "demo_isolation_contractors" ON contractor_profiles
  AS RESTRICTIVE
  FOR SELECT
  USING (
    is_demo = false
    OR is_contractor_matched_to_own_project(id, auth.uid())
  );

-- Verification query (run manually after applying, not part of the migration):
--   set role anon;
--   select id, business_name, is_demo from contractor_profiles;
--   -- should return zero is_demo = true rows.
--   reset role;
