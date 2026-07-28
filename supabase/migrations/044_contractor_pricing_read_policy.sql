-- 044: contractor_pricing has RLS enabled and ZERO policies.
--
-- Same defect class as reviews (see 041). With RLS on and no PERMISSIVE
-- policy, Postgres denies every row to every non-service-role caller.
--
-- Why it is worse than it looks: the table has 0 rows today, so nothing
-- visibly breaks. But any join to it silently returns [] -- which the UI
-- renders as "no pricing on file" rather than as a permission failure. The
-- moment real pricing is entered it stays invisible, and the bug reads as
-- missing data rather than a policy gap.
--
-- NON-DESTRUCTIVE: additive policies only. No DROP TABLE, no TRUNCATE, no
-- DELETE. The DROP POLICY guards are IF EXISTS and each is immediately
-- followed by its CREATE.

BEGIN;

-- contractor_pricing was created in 001 WITHOUT an is_demo column, which also
-- violates WARP.md §14 ("every table gets is_demo + RLS"). Verified against the
-- live schema before writing this: referencing is_demo without adding it would
-- have made the policy below fail on apply. Additive and defaulted, so existing
-- rows (currently zero) become non-demo.
ALTER TABLE contractor_pricing
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- Public read: contractor pricing is part of the public contractor surface,
-- the same reasoning applied to reviews in 041. is_demo is filtered in the
-- USING clause rather than trusted to a RESTRICTIVE layer -- migration 038 is
-- the cautionary tale for relying on that.
DROP POLICY IF EXISTS "contractor_pricing_public_read" ON contractor_pricing;

CREATE POLICY "contractor_pricing_public_read" ON contractor_pricing
  FOR SELECT
  USING (is_demo = false);

-- Owning contractor manages its own rows.
DROP POLICY IF EXISTS "contractor_pricing_owner_all" ON contractor_pricing;

CREATE POLICY "contractor_pricing_owner_all" ON contractor_pricing
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = contractor_pricing.contractor_id
        AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = contractor_pricing.contractor_id
        AND cp.user_id = auth.uid()
    )
  );

COMMIT;

-- VERIFY (run with an ANON client, not the SQL editor, which is superuser and
-- bypasses RLS):
--   SELECT count(*) FROM contractor_pricing;   -- must not error
-- And confirm policies exist:
--   SELECT policyname, cmd FROM pg_policies
--    WHERE schemaname='public' AND tablename='contractor_pricing';
