-- Migration 033: Lock down waitlist PII exposure
--
-- Migration 032 granted `SELECT ON waitlist TO anon` with a RESTRICTIVE policy
-- that only excluded demo rows -- meaning any unauthenticated client could
-- SELECT every real signup's name, email, and phone number via the Supabase
-- REST API. Per WARP.md/EXECUTION.md SS14, PII tables must be anon
-- INSERT-only + aggregate reads, nothing more. This migration removes raw
-- read access and replaces it with two SECURITY DEFINER functions that only
-- return non-PII aggregate/leaderboard data.

-- 1. Remove anon's ability to read raw rows.
DROP POLICY IF EXISTS "Can read public data" ON waitlist;
REVOKE SELECT ON waitlist FROM anon;

-- authenticated keeps SELECT for now (admin page reads via service role
-- instead, see below) -- revoke here too since no authenticated-role UI
-- reads the raw table directly.
REVOKE SELECT ON waitlist FROM authenticated;

-- INSERT policy from migration 032 (anon can sign up) is unchanged.

-- 2. Public aggregate stats: total signups, founding-500 count, spots remaining.
-- No PII in the return type.
CREATE OR REPLACE FUNCTION get_waitlist_public_stats()
RETURNS TABLE (
  total_signups BIGINT,
  founding_500_count BIGINT,
  spots_remaining BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    COUNT(*) FILTER (WHERE is_demo = false) AS total_signups,
    COUNT(*) FILTER (WHERE is_demo = false AND founding_500 = true) AS founding_500_count,
    GREATEST(0, 500 - COUNT(*) FILTER (WHERE is_demo = false AND founding_500 = true)) AS spots_remaining
  FROM waitlist;
$$;

GRANT EXECUTE ON FUNCTION get_waitlist_public_stats() TO anon, authenticated;

-- 3. Public leaderboard: top N referrers by verified_referral_count.
-- Returns first name + last-initial only, never email/phone/full name.
CREATE OR REPLACE FUNCTION get_waitlist_leaderboard(limit_count INT DEFAULT 25)
RETURNS TABLE (
  display_name TEXT,
  verified_referral_count INT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    TRIM(SPLIT_PART(name, ' ', 1)) || CASE
      WHEN POSITION(' ' IN TRIM(name)) > 0
        THEN ' ' || UPPER(LEFT(TRIM(SPLIT_PART(name, ' ', 2)), 1)) || '.'
      ELSE ''
    END AS display_name,
    verified_referral_count
  FROM waitlist
  WHERE is_demo = false
    AND verified_referral_count > 0
  ORDER BY verified_referral_count DESC, created_at ASC
  LIMIT LEAST(GREATEST(limit_count, 1), 100);
$$;

GRANT EXECUTE ON FUNCTION get_waitlist_leaderboard(INT) TO anon, authenticated;
