-- ============================================================
-- 006 — Neighborhood-level Communities with Primary Enrollment
-- Additive migration. Uses IF NOT EXISTS since the DB is already live.
-- ============================================================

-- Add neighborhood column to communities table
ALTER TABLE communities ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Add is_primary flag to community_members (marks user's primary neighborhood)
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Index for finding primary neighborhoods
CREATE INDEX IF NOT EXISTS idx_community_members_primary ON community_members(user_id, is_primary) WHERE is_primary = true;

-- Index for finding communities by neighborhood
CREATE INDEX IF NOT EXISTS idx_communities_neighborhood ON communities(neighborhood, zip_code);
