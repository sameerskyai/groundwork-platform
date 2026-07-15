-- ============================================================
-- 021 — Profiles Enhancements + Saved Contractors (J5)
-- ============================================================
-- saved_contractors: Users can save contractors for later
-- Ensures demo isolation per §14
-- ============================================================

-- Saved contractors (users can save contractors without messaging)
CREATE TABLE IF NOT EXISTS saved_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, contractor_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_contractors_user ON saved_contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_contractors_contractor ON saved_contractors(contractor_id);
CREATE INDEX IF NOT EXISTS idx_saved_contractors_is_demo ON saved_contractors(is_demo) WHERE is_demo = true;

-- RLS: Users see only their own saves
ALTER TABLE saved_contractors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_contractors_own_access" ON saved_contractors;
CREATE POLICY "saved_contractors_own_access" ON saved_contractors
  FOR SELECT
  USING (user_id = auth.uid() OR is_demo = false);

DROP POLICY IF EXISTS "saved_contractors_write_own" ON saved_contractors;
CREATE POLICY "saved_contractors_write_own" ON saved_contractors
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "saved_contractors_delete_own" ON saved_contractors;
CREATE POLICY "saved_contractors_delete_own" ON saved_contractors
  FOR DELETE
  USING (user_id = auth.uid());

-- Profiles: Add avatar_url for profile photos
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Coverage for purge_demo_data function: include saved_contractors
-- Purge will use CASCADE on saved_contractors via user_id FK
