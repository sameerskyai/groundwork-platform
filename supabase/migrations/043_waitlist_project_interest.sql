-- 043: store the one optional post-signup question for email segmentation.
--
-- Section 5 of the 2026-07-28 founder directive: the signup form stays two
-- fields. A single optional "What project are you planning?" is asked AFTER
-- the success reveal, skippable in one tap, never required.
--
-- NON-DESTRUCTIVE: additive column only. No DROP, no TRUNCATE, no DELETE.
-- Nullable by design -- skipping is a first-class answer.

ALTER TABLE waitlist
  ADD COLUMN IF NOT EXISTS project_interest TEXT;

COMMENT ON COLUMN waitlist.project_interest IS
  'Optional post-signup segmentation answer. NULL means skipped or not asked.';

-- VERIFY:
--   SELECT column_name, is_nullable FROM information_schema.columns
--    WHERE table_name = 'waitlist' AND column_name = 'project_interest';
