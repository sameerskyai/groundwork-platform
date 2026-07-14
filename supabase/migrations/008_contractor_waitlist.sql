-- ============================================================
-- 007 — Contractor waitlist (pre-launch recruitment pipeline)
-- Lightweight capture form: no password, no account, no onboarding.
-- Writes happen only through the API route using the service role;
-- RLS is enabled with no policies so anon/authed clients can't
-- read or write the list directly.
-- ============================================================

CREATE TABLE IF NOT EXISTS contractor_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  trade TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  converted_to_signup BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contractor_waitlist_zip ON contractor_waitlist(zip_code);

ALTER TABLE contractor_waitlist ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: service-role only.

DROP TRIGGER IF EXISTS contractor_waitlist_updated_at ON contractor_waitlist;
CREATE TRIGGER contractor_waitlist_updated_at
  BEFORE UPDATE ON contractor_waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
