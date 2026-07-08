-- ============================================================
-- 003 — Swipes, Estimates, Completed Jobs, Trust Score, Swipe Cap
-- Additive migration. Uses IF NOT EXISTS since the DB is already live.
-- ============================================================

-- Separate swipes table (was merged into matches before)
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('pass', 'yes')),
  swiped_by TEXT NOT NULL CHECK (swiped_by IN ('homeowner', 'contractor')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, contractor_id, swiped_by)
);

-- Separate estimates table (was stored inline on projects before)
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  range_low DECIMAL(10,2),
  range_high DECIMAL(10,2),
  labor_low DECIMAL(10,2),
  labor_high DECIMAL(10,2),
  materials_low DECIMAL(10,2),
  materials_high DECIMAL(10,2),
  permits_low DECIMAL(10,2),
  permits_high DECIMAL(10,2),
  reasoning TEXT,
  paid BOOLEAN DEFAULT false,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Completed jobs
CREATE TABLE IF NOT EXISTS completed_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  final_cost DECIMAL(10,2),
  duration_days INTEGER,
  receipt_url TEXT,
  verified BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Trust score components on contractor_profiles
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS trust_accuracy INTEGER;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS trust_on_time INTEGER;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS trust_dispute_free INTEGER;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS verified_job_count INTEGER DEFAULT 0;

-- Monthly swipe cap tracking
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS monthly_swipe_count INTEGER DEFAULT 0;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS monthly_swipe_reset_at DATE DEFAULT CURRENT_DATE;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_swipes_project ON swipes(project_id);
CREATE INDEX IF NOT EXISTS idx_swipes_contractor ON swipes(contractor_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project ON estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_completed_jobs_match ON completed_jobs(match_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_jobs ENABLE ROW LEVEL SECURITY;

-- Note: Postgres CREATE POLICY has no IF NOT EXISTS form; DROP first for idempotency.
DROP POLICY IF EXISTS "swipes_parties" ON swipes;
CREATE POLICY "swipes_parties" ON swipes FOR ALL USING (
  auth.uid() = (SELECT user_id FROM projects WHERE id = project_id) OR
  auth.uid() = (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
);

DROP POLICY IF EXISTS "estimates_owner" ON estimates;
CREATE POLICY "estimates_owner" ON estimates FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM projects WHERE id = project_id)
);

DROP POLICY IF EXISTS "completed_jobs_parties" ON completed_jobs;
CREATE POLICY "completed_jobs_parties" ON completed_jobs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM matches m
    JOIN projects p ON p.id = m.project_id
    JOIN contractor_profiles cp ON cp.id = m.contractor_id
    WHERE m.id = match_id
    AND (auth.uid() = p.user_id OR auth.uid() = cp.user_id)
  )
);
