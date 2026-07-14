-- ============================================================
-- 010 — 72-Hour Match Expiry Job
-- Matches auto-expire if not activated within 72 hours
-- ============================================================

-- Add expires_at column to matches (if not present)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Function: set match expiry on creation (72 hours)
CREATE OR REPLACE FUNCTION set_match_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('pending', 'contractor_review') AND NEW.expires_at IS NULL THEN
    NEW.expires_at = now() + interval '72 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on matches.created_at
DROP TRIGGER IF EXISTS match_expiry_trigger ON matches;
CREATE TRIGGER match_expiry_trigger
BEFORE INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION set_match_expiry();

-- Function: expire old matches (background job)
CREATE OR REPLACE FUNCTION expire_old_matches()
RETURNS TABLE (expired_count INT) AS $$
DECLARE
  count INT;
BEGIN
  UPDATE matches
  SET status = 'expired'
  WHERE status IN ('pending', 'contractor_review')
    AND expires_at < now()
    AND is_demo = false; -- Don't expire demo data

  GET DIAGNOSTICS count = ROW_COUNT;

  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

-- RPC: call this hourly from a background job scheduler
-- Example cron job (Supabase Postgres extension):
-- SELECT cron.schedule('expire-old-matches', '0 * * * *', 'SELECT expire_old_matches()');

-- INDEX for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_matches_expires_at
ON matches(expires_at)
WHERE status IN ('pending', 'contractor_review');
