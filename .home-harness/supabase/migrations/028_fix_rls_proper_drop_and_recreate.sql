-- ============================================================
-- 028 — SECURITY FIX: Proper RLS DROP + RECREATE
-- ============================================================
-- Migration 027 didn't fully remove old policies before adding new ones.
-- Result: old permissive policies still in place, allowing cross-user access.
-- This migration: DROP ALL policies for each table, then CREATE ONLY the
-- restrictive ones. No permissive fallback.
-- ============================================================

-- CONVERSATIONS
DROP POLICY IF EXISTS conversations_own_row ON conversations CASCADE;
DROP POLICY IF EXISTS conversations_insert ON conversations CASCADE;
DROP POLICY IF EXISTS conversations_update ON conversations CASCADE;
DROP POLICY IF EXISTS conversations_demo_access ON conversations CASCADE;

CREATE POLICY conversations_select_participants ON conversations
  FOR SELECT USING (
    auth.uid() = homeowner_id OR
    auth.uid() IN (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
  );

CREATE POLICY conversations_insert_participants ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = homeowner_id OR
    auth.uid() IN (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
  );

-- MESSAGES
DROP POLICY IF EXISTS messages_in_conversation ON messages CASCADE;
DROP POLICY IF EXISTS messages_insert ON messages CASCADE;
DROP POLICY IF EXISTS messages_demo_access ON messages CASCADE;
DROP POLICY IF EXISTS messages_conversation_participant ON messages CASCADE;

CREATE POLICY messages_select_participants ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE
        auth.uid() = homeowner_id OR
        auth.uid() IN (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
    )
  );

CREATE POLICY messages_insert_as_participant ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations WHERE
        auth.uid() = homeowner_id OR
        auth.uid() IN (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
    )
  );

-- PROJECT_STEPS
DROP POLICY IF EXISTS project_steps_own_project ON project_steps CASCADE;
DROP POLICY IF EXISTS project_steps_update ON project_steps CASCADE;
DROP POLICY IF EXISTS project_steps_insert ON project_steps CASCADE;
DROP POLICY IF EXISTS project_steps_delete ON project_steps CASCADE;
DROP POLICY IF EXISTS project_steps_demo_access ON project_steps CASCADE;

CREATE POLICY project_steps_select_owner ON project_steps
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY project_steps_update_owner ON project_steps
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY project_steps_insert_owner ON project_steps
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- MATCHES
DROP POLICY IF EXISTS matches_own_project ON matches CASCADE;
DROP POLICY IF EXISTS matches_contractor_view ON matches CASCADE;
DROP POLICY IF EXISTS matches_insert ON matches CASCADE;
DROP POLICY IF EXISTS matches_update ON matches CASCADE;

CREATE POLICY matches_select_owner_or_contractor ON matches
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    ) OR
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY matches_insert_owner ON matches
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- SAVED_CONTRACTORS
DROP POLICY IF EXISTS saved_contractors_own ON saved_contractors CASCADE;
DROP POLICY IF EXISTS saved_contractors_insert ON saved_contractors CASCADE;
DROP POLICY IF EXISTS saved_contractors_update ON saved_contractors CASCADE;
DROP POLICY IF EXISTS saved_contractors_delete ON saved_contractors CASCADE;

CREATE POLICY saved_contractors_select_owner ON saved_contractors
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY saved_contractors_insert_owner ON saved_contractors
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY saved_contractors_delete_owner ON saved_contractors
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- ============================================================
-- VERIFICATION: This migration enforces strict ownership.
-- - No is_demo=true fallback policies
-- - No permissive allow-all policies
-- - Only owner/participant access allowed
-- - Cross-user queries will return 0 rows
-- ============================================================

COMMENT ON TABLE conversations IS 'J4 messaging. RLS: participant access only (no fallback).';
COMMENT ON TABLE messages IS 'J4 messages. RLS: conversation participant only.';
COMMENT ON TABLE project_steps IS 'J7 checklist. RLS: project owner only.';
COMMENT ON TABLE matches IS 'J3 matches. RLS: project owner or contractor only.';
COMMENT ON TABLE saved_contractors IS 'J8 saves. RLS: owner only.';
