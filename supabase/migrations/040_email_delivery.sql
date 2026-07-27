-- Migration 040: email delivery status + event log
--
-- Why this exists: the waitlist modal has been telling every signup "check
-- your email" while no email was ever sent, because no email provider existed
-- anywhere in the codebase (FEATURE_INVENTORY.md, "Notifications = NOT BUILT").
-- lib/email/ closes that gap. This migration makes the result of each send
-- CHECKABLE rather than assumed: a send that fails writes a status and a
-- reason, so "4,000 people got the welcome email" stops being a guess.
--
-- NON-DESTRUCTIVE. No DROP TABLE, no TRUNCATE, no DELETE, no column drops.
-- Everything here is ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS,
-- so re-running it is safe.
--
-- RLS: this migration does NOT touch any existing policy on `waitlist` or any
-- other table. `email_events` is a new table and ships locked: RLS enabled,
-- zero policies, grants to service_role only. Delivery data includes provider
-- message ids and error strings and has no business being readable by anon or
-- authenticated. The columns added to `waitlist` inherit that table's existing
-- policies untouched (migrations 032/033/034/035 still govern it).
--
-- NOT APPLIED by the agent that wrote it. This environment has no DDL path:
-- no psql, no database password, no linked Supabase project, no exec_sql RPC.
-- The service-role key speaks PostgREST, which is the data plane, not DDL.
-- FOUNDER ACTION: paste this file into the Supabase SQL editor and run it.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Per-signup welcome email status on the waitlist row.
--
-- Denormalised onto `waitlist` deliberately, alongside the fuller event log
-- below. The single most common operational question is "did THIS person get
-- their welcome email", and answering it should be one column read on a row
-- the admin export already selects, not a join.
-- ---------------------------------------------------------------------------

ALTER TABLE waitlist
  ADD COLUMN IF NOT EXISTS welcome_email_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS welcome_email_provider_id TEXT,
  ADD COLUMN IF NOT EXISTS welcome_email_error TEXT,
  ADD COLUMN IF NOT EXISTS email_unsubscribed_at TIMESTAMP WITH TIME ZONE;

-- 'pending'  row inserted, send not yet attempted or still in flight
-- 'sent'     provider accepted it and returned a message id
-- 'failed'   provider rejected it, or we never reached the provider
-- 'skipped'  deliberately not sent (unsubscribed, demo row, backfill)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'waitlist_welcome_email_status_check'
  ) THEN
    ALTER TABLE waitlist
      ADD CONSTRAINT waitlist_welcome_email_status_check
      CHECK (welcome_email_status IN ('pending', 'sent', 'failed', 'skipped'));
  END IF;
END $$;

-- Every row that existed before email was built was never going to receive a
-- welcome message. Marking them 'skipped' rather than leaving them 'pending'
-- keeps the failure queue below honest: 'pending' should mean "owed an email",
-- and these people are not owed one retroactively.
UPDATE waitlist
SET welcome_email_status = 'skipped'
WHERE welcome_email_status = 'pending'
  AND created_at < now();

-- Partial index: the operational query is "who is stuck", never "who is fine".
-- Indexing only the non-terminal states keeps this small as the list grows.
CREATE INDEX IF NOT EXISTS idx_waitlist_welcome_email_unsent
  ON waitlist (created_at DESC)
  WHERE welcome_email_status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_waitlist_email_unsubscribed
  ON waitlist (email_unsubscribed_at)
  WHERE email_unsubscribed_at IS NOT NULL;

COMMENT ON COLUMN waitlist.welcome_email_status IS
  'pending | sent | failed | skipped. Written by lib/email/delivery.ts.';
COMMENT ON COLUMN waitlist.welcome_email_provider_id IS
  'Resend id / Postmark MessageID. The handle for tracing a bounce.';
COMMENT ON COLUMN waitlist.email_unsubscribed_at IS
  'Set by POST /api/unsubscribe. Non-null means send nothing, ever.';

-- ---------------------------------------------------------------------------
-- 2. email_events: one row per send attempt, every kind, success or failure.
--
-- The waitlist columns above cover the welcome email only. Milestone emails
-- (3 / 5 / 10 verified referrals) need the same visibility without adding
-- three more column triples to `waitlist` every time a new email is written.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id UUID NOT NULL REFERENCES waitlist(id) ON DELETE CASCADE,
  -- Mirrors EmailKind in lib/email/types.ts.
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  -- 'resend' | 'postmark' | 'none'. 'none' means we never reached a provider
  -- (missing API key, bad recipient, render error) which is a different
  -- failure from a provider rejection and is worth telling apart.
  provider TEXT NOT NULL,
  provider_message_id TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT email_events_kind_check
    CHECK (kind IN ('welcome', 'milestone_3', 'milestone_5', 'milestone_10')),
  CONSTRAINT email_events_status_check
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  CONSTRAINT email_events_provider_check
    CHECK (provider IN ('resend', 'postmark', 'none'))
);

CREATE INDEX IF NOT EXISTS idx_email_events_waitlist
  ON email_events (waitlist_id, kind);

CREATE INDEX IF NOT EXISTS idx_email_events_created_at
  ON email_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_events_failures
  ON email_events (created_at DESC)
  WHERE status = 'failed';

-- Idempotency for milestone emails. A referrer's verified count crossing 3
-- should produce exactly one "you're a Founding Member" email, forever. This
-- index is the guarantee: a second SUCCESSFUL send of the same kind to the
-- same person cannot be recorded. Failures are deliberately NOT covered by
-- the uniqueness, because retrying a failure is the whole point.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_events_one_success_per_kind
  ON email_events (waitlist_id, kind)
  WHERE status = 'sent';

-- Locked down. RLS on, zero policies, service_role only. Under RLS a table
-- with no policies denies everything to anon/authenticated; service_role
-- bypasses RLS, which is what lib/email/delivery.ts uses.
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON email_events FROM PUBLIC;
-- Supabase applies ALTER DEFAULT PRIVILEGES ... TO anon, authenticated on the
-- public schema at project creation. That is a separate, named-role grant and
-- is completely independent of the PUBLIC pseudo-role, so revoking PUBLIC is
-- not enough on its own. Migration 036 learned this the hard way with
-- credit_referral(); the explicit named revokes below are that lesson applied.
REVOKE ALL ON email_events FROM anon;
REVOKE ALL ON email_events FROM authenticated;
GRANT ALL ON email_events TO service_role;

COMMENT ON TABLE email_events IS
  'One row per email send attempt. Written by lib/email/delivery.ts with the service role. Not readable by anon or authenticated.';

COMMIT;

-- ---------------------------------------------------------------------------
-- VERIFICATION after applying (run in the SQL editor, expect the noted result)
--
--   -- 1. columns exist
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'waitlist' AND column_name LIKE '%email%';
--   -- expect: email, welcome_email_status, welcome_email_sent_at,
--   --         welcome_email_provider_id, welcome_email_error,
--   --         email_unsubscribed_at
--
--   -- 2. nothing is left owed an email from before this migration
--   SELECT welcome_email_status, count(*) FROM waitlist GROUP BY 1;
--   -- expect: every pre-existing row 'skipped', zero 'pending'
--
--   -- 3. email_events is locked
--   SELECT relrowsecurity FROM pg_class WHERE relname = 'email_events';
--   -- expect: true
--
--   -- 4. the failure queue, which is the whole point
--   SELECT id, email, welcome_email_status, welcome_email_error
--   FROM waitlist WHERE welcome_email_status = 'failed'
--   ORDER BY created_at DESC;
-- ---------------------------------------------------------------------------
