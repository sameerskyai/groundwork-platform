-- ============================================================
-- 022 — Personality Responses (J2 - Homeowner Trait Vectors)
-- ============================================================
-- personality_responses: Stores homeowner answers to 5-question personality flow
-- Generates trait vectors (autonomy, communication, delegation, flexibility, conflict)
-- Ensures §14 demo isolation + RLS + purge coverage
-- ============================================================

CREATE TABLE IF NOT EXISTS personality_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  trait_vector JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_demo BOOLEAN NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_personality_responses_user ON personality_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_responses_project ON personality_responses(project_id);
CREATE INDEX IF NOT EXISTS idx_personality_responses_is_demo ON personality_responses(is_demo) WHERE is_demo = true;

-- RLS: Users can only view and modify their own responses
ALTER TABLE personality_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "personality_responses_select_own" ON personality_responses;
CREATE POLICY "personality_responses_select_own" ON personality_responses
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "personality_responses_insert_own" ON personality_responses;
CREATE POLICY "personality_responses_insert_own" ON personality_responses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "personality_responses_update_own" ON personality_responses;
CREATE POLICY "personality_responses_update_own" ON personality_responses
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "personality_responses_delete_own" ON personality_responses;
CREATE POLICY "personality_responses_delete_own" ON personality_responses
  FOR DELETE
  USING (user_id = auth.uid());

-- Purge coverage: personality_responses will be cleaned up via CASCADE on projects -> user_id
-- No additional purge logic needed (FK delete cascade handles it)
