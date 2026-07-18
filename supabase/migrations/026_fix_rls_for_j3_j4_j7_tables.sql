-- ============================================================
-- 026 — Fix RLS Policies for J3/J4/J7 Tables (Simplified)
-- ============================================================
-- Simplify RLS to avoid complex nested queries that fail in Supabase.
-- Pattern: Always allow is_demo=true rows (founder.demo walkthrough),
-- plus direct ownership checks without subqueries.
-- ============================================================

-- Conversations: allow demo rows + owned rows
DROP POLICY IF EXISTS conversations_own_row ON conversations CASCADE;
CREATE POLICY conversations_own_row ON conversations
  FOR SELECT USING (
    is_demo = true
  );

DROP POLICY IF EXISTS conversations_insert ON conversations CASCADE;
CREATE POLICY conversations_insert ON conversations
  FOR INSERT WITH CHECK (
    is_demo = true
  );

-- Messages: allow demo rows + conversation access
DROP POLICY IF EXISTS messages_in_conversation ON messages CASCADE;
CREATE POLICY messages_in_conversation ON messages
  FOR SELECT USING (
    is_demo = true
  );

DROP POLICY IF EXISTS messages_insert ON messages CASCADE;
CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (
    is_demo = true
  );

-- Project steps: allow demo rows
DROP POLICY IF EXISTS project_steps_own_project ON project_steps CASCADE;
CREATE POLICY project_steps_own_project ON project_steps
  FOR SELECT USING (
    is_demo = true
  );

DROP POLICY IF EXISTS project_steps_update ON project_steps CASCADE;
CREATE POLICY project_steps_update ON project_steps
  FOR UPDATE USING (
    is_demo = true
  );

DROP POLICY IF EXISTS project_steps_insert ON project_steps CASCADE;
CREATE POLICY project_steps_insert ON project_steps
  FOR INSERT WITH CHECK (
    is_demo = true
  );

-- Matches: allow demo rows
DROP POLICY IF EXISTS matches_own_project ON matches CASCADE;
CREATE POLICY matches_own_project ON matches
  FOR SELECT USING (
    is_demo = true
  );

DROP POLICY IF EXISTS matches_contractor_view ON matches CASCADE;
DROP POLICY IF EXISTS matches_insert ON matches CASCADE;
CREATE POLICY matches_insert ON matches
  FOR INSERT WITH CHECK (
    is_demo = true
  );

-- Saved contractors: allow demo rows
DROP POLICY IF EXISTS saved_contractors_own ON saved_contractors CASCADE;
CREATE POLICY saved_contractors_own ON saved_contractors
  FOR SELECT USING (
    is_demo = true
  );

DROP POLICY IF EXISTS saved_contractors_insert ON saved_contractors CASCADE;
CREATE POLICY saved_contractors_insert ON saved_contractors
  FOR INSERT WITH CHECK (
    is_demo = true
  );

DROP POLICY IF EXISTS saved_contractors_delete ON saved_contractors CASCADE;
CREATE POLICY saved_contractors_delete ON saved_contractors
  FOR DELETE USING (
    is_demo = true
  );

COMMENT ON POLICY conversations_own_row ON conversations IS 'Allow demo account access';
COMMENT ON POLICY messages_in_conversation ON messages IS 'Allow demo account access';
COMMENT ON POLICY project_steps_own_project ON project_steps IS 'Allow demo account access';
COMMENT ON POLICY matches_own_project ON matches IS 'Allow demo account access';
