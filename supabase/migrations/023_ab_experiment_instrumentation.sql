-- ============================================================
-- 023 — A/B Experiment Instrumentation (Compatibility Experiment)
-- ============================================================
-- Tracks which arm each match is assigned to (compatibility-ranked vs random)
-- Records satisfaction and dispute metrics for analysis
-- No verdict logic yet — pure instrumentation for future analysis
-- ============================================================

-- Add experiment fields to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS experiment_arm TEXT CHECK (experiment_arm IN ('compatibility_ranked', 'random', NULL));
ALTER TABLE matches ADD COLUMN IF NOT EXISTS experiment_assigned_at TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5 OR satisfaction_score IS NULL);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS satisfaction_recorded_at TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS dispute_flag BOOLEAN DEFAULT false;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS dispute_recorded_at TIMESTAMPTZ;

-- Create indexes for experiment analysis
CREATE INDEX IF NOT EXISTS idx_matches_experiment_arm ON matches(experiment_arm);
CREATE INDEX IF NOT EXISTS idx_matches_experiment_assigned_at ON matches(experiment_assigned_at);
CREATE INDEX IF NOT EXISTS idx_matches_satisfaction_score ON matches(satisfaction_score) WHERE satisfaction_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_dispute_flag ON matches(dispute_flag) WHERE dispute_flag = true;

-- View for experiment reporting (read-only)
DROP VIEW IF EXISTS experiment_arm_stats;
CREATE VIEW experiment_arm_stats AS
SELECT
  experiment_arm,
  COUNT(*) as total_matches,
  COUNT(satisfaction_score) as satisfaction_recorded,
  AVG(satisfaction_score) as avg_satisfaction,
  COUNT(CASE WHEN dispute_flag = true THEN 1 END) as disputes,
  COUNT(CASE WHEN dispute_flag = true THEN 1 END)::FLOAT / COUNT(*) as dispute_rate
FROM matches
WHERE experiment_assigned_at IS NOT NULL
GROUP BY experiment_arm;

-- Comment for clarity
COMMENT ON COLUMN matches.experiment_arm IS 'Experiment arm: compatibility_ranked (uses trait vector matching) vs random (shows random contractor)';
COMMENT ON COLUMN matches.satisfaction_score IS 'Post-project satisfaction: 1-5 scale, recorded after project completion';
COMMENT ON COLUMN matches.dispute_flag IS 'Did this match result in a reported dispute? (true/false)';
