-- 039: Close the properties / saved_contractors SELECT leak.
--
-- FOUND: 2026-07-27 feature-inventory audit (FEATURE_INVENTORY.md, Security Finding 1).
--
-- Migration 020 created:
--     USING (owner_id = auth.uid() OR is_demo = false)
-- The `OR is_demo = false` grants EVERY caller -- including anon -- read
-- access to every non-demo property row, which carries street_address, city,
-- and state. Migration 021 repeats the pattern on saved_contractors.
--
-- Currently unexploited ONLY because the table holds a single demo row:
-- verified live 2026-07-27, anon SELECT returns 0 rows while service role
-- sees 1 (is_demo = true). The first genuine homeowner property makes street
-- addresses world-readable.
--
-- This also contradicts the product's own binding rule: "No address sharing
-- anywhere in-product; ZIP/general-area only" (PRODUCT.md, BUSINESS_MODEL.md).
--
-- NON-DESTRUCTIVE: policies are dropped and immediately recreated in the same
-- transaction. No DROP TABLE, no TRUNCATE, no DELETE. Demo isolation is
-- preserved -- demo rows remain readable by their own owner, which is what
-- is_demo was for; it was never meant to grant public read to real rows.

BEGIN;

-- ---------- properties ----------
DROP POLICY IF EXISTS "properties_own_access" ON properties;

CREATE POLICY "properties_own_access" ON properties
  FOR SELECT
  USING (owner_id = auth.uid());

-- 020 shipped SELECT + UPDATE but no INSERT policy, so onboarding's insert
-- (app/(auth)/onboarding/page.tsx) fails silently and the missing row later
-- surfaces as "No ZIP code found. Complete onboarding first." in Communities.
DROP POLICY IF EXISTS "properties_insert_own" ON properties;

CREATE POLICY "properties_insert_own" ON properties
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- ---------- saved_contractors ----------
DROP POLICY IF EXISTS "saved_contractors_own_access" ON saved_contractors;

CREATE POLICY "saved_contractors_own_access" ON saved_contractors
  FOR SELECT
  USING (user_id = auth.uid());

COMMIT;

-- VERIFY AFTER APPLYING (run as an anon client, not in the SQL editor, which
-- runs as a superuser and bypasses RLS):
--   1. Insert a non-demo property owned by user A.
--   2. Query properties with the ANON key -> must return 0 rows.
--   3. Query properties as user A -> must return that row.
--   4. Complete homeowner onboarding -> the property row is created, and
--      /homeowner/communities no longer reports "No ZIP code found".
