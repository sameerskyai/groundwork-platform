-- ============================================================
-- 006 — Contractor location on contractor_profiles
-- Fixes: candidate matching and density checks previously joined
-- to profiles(lat,lng), which RLS locks to the owning user only —
-- silently returning null location for every contractor when
-- queried by anyone else. contractor_profiles is already
-- public-read, so location belongs here instead.
-- ============================================================

ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS lat DECIMAL(9,6);
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS lng DECIMAL(9,6);
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;

CREATE INDEX IF NOT EXISTS idx_contractor_profiles_lat_lng ON contractor_profiles(lat, lng);

-- Backfill existing contractor_profiles from their linked profiles row
UPDATE contractor_profiles cp
SET lat = p.lat, lng = p.lng, zip_code = p.zip_code
FROM profiles p
WHERE cp.user_id = p.id
  AND cp.lat IS NULL;
