-- ============================================================
-- CRAFTMATCH — ZIP CODE PROOF-OF-WORK FEED
-- Depends on: projects, contractor_profiles, trades tables from 001_initial.sql
-- All entries are auto-generated from verified project completions.
-- No user ever writes a post manually.
-- ============================================================

-- Add verified-completion fields to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS receipt_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS days_to_complete INTEGER,
  ADD COLUMN IF NOT EXISTS final_cost_low DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS final_cost_high DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS homeowner_opted_into_feed BOOLEAN DEFAULT false;

-- Add feed-suppression flag to contractor_profiles (default off — only used for disputes)
ALTER TABLE contractor_profiles
  ADD COLUMN IF NOT EXISTS feed_suppressed BOOLEAN DEFAULT false;

-- Feed config (single-row, config-driven — change min_jobs_per_zip without a deploy)
CREATE TABLE IF NOT EXISTS feed_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforce single row
  min_jobs_per_zip INTEGER NOT NULL DEFAULT 3,      -- below this, show empty state
  zip_radius_fallback_miles INTEGER NOT NULL DEFAULT 10, -- expand to nearby ZIPs if below threshold
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO feed_config (id, min_jobs_per_zip, zip_radius_fallback_miles)
VALUES (1, 3, 10)
ON CONFLICT (id) DO NOTHING;

-- Feed entries — one per verified completed project
-- Privacy rules enforced here:
--   neighborhood_label: always populated (ZIP or neighborhood name, never full address)
--   street_label: only populated when homeowner explicitly opts in
--   contractor shown unless feed_suppressed = true on their profile
CREATE TABLE IF NOT EXISTS feed_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE SET NULL,
  zip_code TEXT NOT NULL,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  trade_category TEXT NOT NULL,          -- human-readable, e.g. "Kitchen Remodeling"
  project_type_label TEXT NOT NULL,      -- e.g. "bathroom remodel" — not internal slug
  cost_range_label TEXT NOT NULL,        -- bucketed, e.g. "$8K–$12K" — never exact
  completion_date DATE NOT NULL,
  days_to_complete INTEGER,
  -- Privacy
  homeowner_opted_in BOOLEAN DEFAULT false,
  street_label TEXT,                     -- only set if homeowner_opted_in = true
  neighborhood_label TEXT NOT NULL,      -- always set (ZIP-level minimum)
  -- AI-generated copy
  copy_line TEXT NOT NULL,               -- e.g. "A homeowner near Oak Park completed a bathroom remodel..."
  -- Visibility
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_entries_zip ON feed_entries(zip_code);
CREATE INDEX IF NOT EXISTS idx_feed_entries_completion ON feed_entries(completion_date DESC);
CREATE INDEX IF NOT EXISTS idx_feed_entries_zip_date ON feed_entries(zip_code, completion_date DESC);
CREATE INDEX IF NOT EXISTS idx_feed_entries_contractor ON feed_entries(contractor_id);

-- Feed entries are public-readable (powers the unauthenticated public page)
ALTER TABLE feed_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_entries_public_read" ON feed_entries FOR SELECT USING (published = true);
-- Only service role can insert/update (triggered server-side, never from client)
CREATE POLICY "feed_entries_service_write" ON feed_entries FOR ALL USING (
  auth.role() = 'service_role'
);
