-- ============================================================
-- 042 — homeowner_preferences (the table three call sites already read)
-- NOT APPLIED. Founder pastes this into the Supabase SQL editor.
-- ============================================================
--
-- `public.homeowner_preferences` has never existed in any migration, but the
-- application reads and writes it in three places:
--   app/api/homeowner/preferences/route.ts:15  (GET  -> always null)
--   app/api/homeowner/preferences/route.ts:47  (POST -> 500)
--   app/api/projects/[id]/score/route.ts:37    (deleted in this change set)
--
-- Verified live 2026-07-27 via PostgREST:
--   PGRST205 Could not find the table 'public.homeowner_preferences' in the
--   schema cache
--
-- The personality quiz therefore discards its own output. Creating the table
-- makes the preferences route work and gives the match ranker the signal it
-- already asks for -- `GET /api/projects/[id]/candidates` selects from this
-- table and degrades to `null` while it is absent, so applying this migration
-- is additive and safe in either order.

BEGIN;

CREATE TABLE IF NOT EXISTS homeowner_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_budget DECIMAL(10,2),
  preferred_timeline TEXT,
  preferred_style TEXT,
  experience_level_preference TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_homeowner_preferences_user ON homeowner_preferences(user_id);

-- Reuses the trigger function defined in 001_initial.sql.
DROP TRIGGER IF EXISTS homeowner_preferences_updated_at ON homeowner_preferences;
CREATE TRIGGER homeowner_preferences_updated_at
  BEFORE UPDATE ON homeowner_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Owner-only, and a PERMISSIVE policy is written at the same time RLS is
-- enabled. Enabling RLS without one is what left `reviews` dark for the whole
-- life of the product (see 041).
ALTER TABLE homeowner_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "homeowner_preferences_owner" ON homeowner_preferences;
CREATE POLICY "homeowner_preferences_owner" ON homeowner_preferences
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Demo isolation, matching the pattern established in 012/019.
DROP POLICY IF EXISTS "demo_isolation_homeowner_preferences" ON homeowner_preferences;
CREATE POLICY "demo_isolation_homeowner_preferences" ON homeowner_preferences
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false OR user_id = auth.uid());

COMMIT;
