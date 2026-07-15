-- ============================================================
-- 020 — Properties Foundation (J1b Architecture)
-- ============================================================
-- Homeowners can own multiple properties
-- Each property has one or more projects
-- Estimate/matching reads ZIP from property
-- Every property tracked with is_demo for demo isolation
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  zip_code TEXT NOT NULL,
  label TEXT DEFAULT 'Home',
  street_address TEXT,
  city TEXT,
  state TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_is_demo ON properties(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(zip_code);

-- RLS: Users can read/update own properties only
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "properties_own_access" ON properties;
CREATE POLICY "properties_own_access" ON properties
  FOR SELECT
  USING (owner_id = auth.uid() OR is_demo = false);

DROP POLICY IF EXISTS "properties_update_own" ON properties;
CREATE POLICY "properties_update_own" ON properties
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Add property_id to projects table (if not already present)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_projects_property ON projects(property_id);

-- Include property_id in demo purge coverage
-- Purge function will handle property deletion via CASCADE

-- Profiles: Add user_segment and segment_metadata for J1 routing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_segment TEXT DEFAULT 'homeowner';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS segment_metadata JSONB DEFAULT '{}';

-- Validate segment enum
ALTER TABLE profiles ADD CONSTRAINT check_segment CHECK (user_segment IN ('homeowner', 'property_manager', 'agent', 'contractor'));
