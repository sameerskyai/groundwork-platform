-- ============================================================
-- 004 — Review Details (on_time, dispute_flagged)
-- Additive migration. Uses IF NOT EXISTS since the DB is already live.
-- ============================================================

-- Add fields to reviews table for tracking job quality metrics
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS on_time BOOLEAN;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS dispute_flagged BOOLEAN DEFAULT false;

-- Create index for dispute tracking
CREATE INDEX IF NOT EXISTS idx_reviews_dispute ON reviews(dispute_flagged) WHERE dispute_flagged = true;
