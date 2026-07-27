-- ============================================================
-- 029 — SECURITY FIX: Contractor Profiles RLS (allow demo access)
-- ============================================================
-- Migration 012 created RESTRICTIVE RLS on contractor_profiles that blocks
-- all is_demo=true records. This prevents demo users from reading demo
-- contractor profiles matched to their projects.
--
-- Fix: Add PERMISSIVE policy allowing users to read contractor profiles
-- that are matched to projects they own (demo or real).
-- ============================================================

-- Drop the overly-restrictive demo isolation policy
DROP POLICY IF EXISTS "demo_isolation_contractors" ON contractor_profiles CASCADE;

-- Add RESTRICTIVE policy: Allow real contractors + demo contractors matched to user's projects
-- RESTRICTIVE policies enforce BOTH conditions with AND logic
-- So this allows: (non-demo data) OR (demo data user is matched with)
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contractor_profiles_access" ON contractor_profiles
  AS RESTRICTIVE
  FOR SELECT
  USING (
    is_demo = false  -- always allow real contractors
    OR
    (  -- OR allow demo contractors matched to user's projects
      is_demo = true
      AND
      id IN (
        SELECT DISTINCT m.contractor_id
        FROM matches m
        WHERE m.project_id IN (
          SELECT p.id FROM projects p WHERE p.user_id = auth.uid()
        )
      )
    )
  );
