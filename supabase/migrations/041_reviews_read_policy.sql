-- ============================================================
-- 041 — reviews are unreadable by every user (RLS on, zero PERMISSIVE policies)
-- Found by the feature-inventory audit (FEATURE_INVENTORY.md, Security Finding 3).
-- NOT APPLIED. Founder pastes this into the Supabase SQL editor.
-- ============================================================
--
-- Root cause, traced through migration history:
--   001_initial.sql:284  ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
--                        ...and then never creates a policy for reviews. The
--                        policy block right below it covers profiles,
--                        contractor_profiles, projects, matches and messages,
--                        and skips reviews entirely.
--   012:85               "demo_isolation_reviews" AS RESTRICTIVE FOR SELECT
--   018:59,65            "demo_isolation_reviews_update/_delete" AS RESTRICTIVE
--   019:47               replaces the RESTRICTIVE SELECT with a wider one
--
-- RESTRICTIVE policies are ANDed with the PERMISSIVE set; they narrow, they
-- never grant. With RLS enabled and the PERMISSIVE set empty, Postgres denies
-- every row to every non-superuser role. Writes still work because
-- `createAdminClient()` uses the service role, which bypasses RLS -- which is
-- exactly why this went unnoticed: reviews are being written and can never be
-- read back.
--
-- Verified live 2026-07-27 with the anon key: `select * from reviews` returns
-- 0 rows and no error, while the service role counts 20 rows in the table.
-- On a product whose entire premise is contractor trust, the review surface
-- has been dark since day one.
--
-- ------------------------------------------------------------
-- Choice: PUBLIC READ of non-demo reviews (not contractor-scoped)
-- ------------------------------------------------------------
-- Justification:
--   * Contractor profiles are already a public surface --
--     `app/contractors/[id]/page.tsx` renders server-side for logged-out
--     visitors, and `app/contractor/[id]/page.tsx:83` reads reviews from the
--     browser. Contractor-scoped read (only the reviewed contractor sees their
--     reviews) would leave both pages empty and would not restore anything the
--     product markets.
--   * Reviews are the trust signal a homeowner uses to decide BEFORE they have
--     any relationship with the contractor. Gating them behind a match makes
--     them useless for the decision they exist to inform.
--   * `is_demo = false` is written into the USING clause rather than left to
--     the RESTRICTIVE layer from 012/019. Migration 038 is the cautionary
--     tale: a PERMISSIVE USING (true) that depended on a RESTRICTIVE policy
--     elsewhere leaked every demo row the moment that policy was replaced.
--
-- Known limitation, NOT fixed here: RLS is row-level, so public read exposes
-- every column of a non-demo review, including `final_price` (the confirmed
-- job cost) and `reviewer_id`. Column-level GRANTs would fix it precisely but
-- would break `app/contractor/[id]/page.tsx:83`, which selects `*`. The
-- correct follow-up is to narrow that client select to
-- (id, contractor_id, rating, content, created_at) and then revoke the
-- remaining columns from anon. Flagged for the founder rather than silently
-- shipped, because it needs an app change and a migration together.

BEGIN;

-- ---- SELECT: public read of non-demo reviews ----------------------------
DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
CREATE POLICY "reviews_public_read" ON reviews
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (is_demo = false);

-- ---- SELECT: a user always reaches their own rows -----------------------
-- Mirrors the RESTRICTIVE policy from 019 so the two layers agree: the
-- reviewer who wrote it, and the contractor it is about. Without this a demo
-- account cannot read the demo reviews attached to its own demo contractor.
DROP POLICY IF EXISTS "reviews_own_read" ON reviews;
CREATE POLICY "reviews_own_read" ON reviews
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    reviewer_id = auth.uid()
    OR contractor_id IN (SELECT id FROM contractor_profiles WHERE user_id = auth.uid())
  );

-- ---- INSERT: the reviewer, on a match that is theirs and completed ------
-- The write path today runs through the service role
-- (`app/api/matches/complete/route.ts`), which bypasses RLS. This policy is
-- what lets the write happen under the user's own session without granting a
-- blanket insert: the row must name the caller as reviewer, must not claim to
-- be demo data, and must attach to a match on a project the caller owns that
-- actually reached 'matched'. UPDATE and DELETE stay ungranted on purpose --
-- reviews are immutable once written, and 018 already blocks both.
DROP POLICY IF EXISTS "reviews_reviewer_insert" ON reviews;
CREATE POLICY "reviews_reviewer_insert" ON reviews
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND is_demo = false
    AND EXISTS (
      SELECT 1
      FROM matches m
      JOIN projects p ON p.id = m.project_id
      WHERE m.id = reviews.match_id
        AND p.user_id = auth.uid()
        AND m.status = 'matched'
    )
  );

COMMIT;

-- Verification (run manually after applying, not part of the migration):
--   set role anon;
--   select count(*) from reviews;                 -- expect > 0
--   select count(*) from reviews where is_demo;   -- expect 0
--   reset role;
