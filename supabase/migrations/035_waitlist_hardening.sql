-- Migration 035: harden migration 033's RPCs + fix a referral-credit race
--
-- Two CodeRabbit findings from PR #4 review of migrations 032-034:
--
-- 1. PostgreSQL grants EXECUTE on new functions to PUBLIC by default.
--    Migration 033's GRANT EXECUTE ... TO anon, authenticated never
--    revoked the default PUBLIC grant first, so it stayed wider than
--    intended alongside the explicit grants.
--
-- 2. app/api/waitlist/route.ts credited a referral with a JS
--    read-then-write (SELECT position_number/verified_referral_count,
--    compute new values, UPDATE) -- two concurrent referral signups for
--    the same referrer can read the same starting count and the second
--    write clobbers the first, silently losing a referral credit. This
--    function makes the increment atomic: a single UPDATE statement with
--    the arithmetic done in SQL, so Postgres serializes concurrent calls
--    on the same row instead of racing in application code.

REVOKE EXECUTE ON FUNCTION get_waitlist_public_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_waitlist_leaderboard(INT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION credit_referral(p_referrer_id UUID)
RETURNS TABLE (
  new_verified_referral_count INT,
  new_position_number BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE waitlist
  SET
    verified_referral_count = verified_referral_count + 1,
    position_number = GREATEST(1, position_number - 100),
    founding_member = (verified_referral_count + 1) >= 3,
    backstory_eligible = (verified_referral_count + 1) >= 5,
    homeowner_plus_eligible = (verified_referral_count + 1) >= 10,
    updated_at = now()
  WHERE id = p_referrer_id
  RETURNING verified_referral_count, position_number;
$$;

-- Only the service role calls this (app/api/waitlist/route.ts uses the
-- service-role key) -- no anon/authenticated grant needed or wanted here,
-- unlike the two read-only stats RPCs above.
REVOKE EXECUTE ON FUNCTION credit_referral(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION credit_referral(UUID) TO service_role;
