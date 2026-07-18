-- ============================================================
-- 027 — SECURITY REVERT: Restore RLS Ownership Checks
-- ============================================================
-- INCIDENT: Migration 026 replaced ownership-based RLS with bare
-- is_demo=true, creating critical security hole where ANY authenticated
-- user can read/write any is_demo=true row. Reverting to proper pattern:
--   is_demo = false OR <real ownership check>
--
-- This ensures demo data is ONLY visible to its owner, and real-user
-- data requires ownership. Pattern: never use is_demo=true alone.
-- ============================================================

-- ============================================================
-- CONVERSATIONS: Homeowner or contractor can see own conversation
-- ============================================================
DROP POLICY IF EXISTS conversations_own_row ON conversations CASCADE;
CREATE POLICY conversations_own_row ON conversations
  FOR SELECT USING (
    auth.uid() = homeowner_id OR
    auth.uid() IN (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
  );

DROP POLICY IF EXISTS conversations_insert ON conversations CASCADE;
CREATE POLICY conversations_insert ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = homeowner_id OR
    auth.uid() IN (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
  );

DROP POLICY IF EXISTS conversations_update ON conversations CASCADE;
CREATE POLICY conversations_update ON conversations
  FOR UPDATE USING (
    auth.uid() = homeowner_id OR
    auth.uid() IN (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
  );

-- ============================================================
-- MESSAGES: Only conversation participants can see/send
-- ============================================================
DROP POLICY IF EXISTS messages_in_conversation ON messages CASCADE;
CREATE POLICY messages_in_conversation ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE
        auth.uid() = homeowner_id OR
        auth.uid() IN (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
    ) OR
    sender_id = auth.uid()
  );

DROP POLICY IF EXISTS messages_insert ON messages CASCADE;
CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations WHERE
        auth.uid() = homeowner_id OR
        auth.uid() IN (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
    )
  );

-- ============================================================
-- PROJECT_STEPS: Only project owner can see/modify
-- ============================================================
DROP POLICY IF EXISTS project_steps_own_project ON project_steps CASCADE;
CREATE POLICY project_steps_own_project ON project_steps
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE
        user_id = auth.uid() OR
        property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS project_steps_update ON project_steps CASCADE;
CREATE POLICY project_steps_update ON project_steps
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE
        user_id = auth.uid() OR
        property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS project_steps_insert ON project_steps CASCADE;
CREATE POLICY project_steps_insert ON project_steps
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE
        user_id = auth.uid() OR
        property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS project_steps_delete ON project_steps CASCADE;
CREATE POLICY project_steps_delete ON project_steps
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE
        user_id = auth.uid() OR
        property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    )
  );

-- ============================================================
-- MATCHES: Project owner or contractor can see
-- ============================================================
DROP POLICY IF EXISTS matches_own_project ON matches CASCADE;
CREATE POLICY matches_own_project ON matches
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE
        user_id = auth.uid() OR
        property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    ) OR
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS matches_contractor_view ON matches CASCADE;
DROP POLICY IF EXISTS matches_insert ON matches CASCADE;
CREATE POLICY matches_insert ON matches
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE
        user_id = auth.uid() OR
        property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS matches_update ON matches CASCADE;
CREATE POLICY matches_update ON matches
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE
        user_id = auth.uid() OR
        property_id IN (
          SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    ) OR
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- SAVED_CONTRACTORS: User can only see/manage own saves
-- ============================================================
DROP POLICY IF EXISTS saved_contractors_own ON saved_contractors CASCADE;
CREATE POLICY saved_contractors_own ON saved_contractors
  FOR SELECT USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS saved_contractors_insert ON saved_contractors CASCADE;
CREATE POLICY saved_contractors_insert ON saved_contractors
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS saved_contractors_update ON saved_contractors CASCADE;
CREATE POLICY saved_contractors_update ON saved_contractors
  FOR UPDATE USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS saved_contractors_delete ON saved_contractors CASCADE;
CREATE POLICY saved_contractors_delete ON saved_contractors
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- ============================================================
-- VERIFY PROPER PATTERN
-- ============================================================
-- All policies now use: <real ownership check> (NO bare is_demo=true)
-- Demo data (is_demo=true) is visible ONLY to its owner
-- Real data (is_demo=false) requires ownership check
-- This prevents all-authenticated-users-see-all-demo-data hole
COMMENT ON TABLE conversations IS 'J4 messaging. RLS: participant access only';
COMMENT ON TABLE messages IS 'J4 messages. RLS: conversation participant access only';
COMMENT ON TABLE project_steps IS 'J7 checklist. RLS: project owner access only';
COMMENT ON TABLE matches IS 'J3 matches. RLS: project owner or contractor access';
COMMENT ON TABLE saved_contractors IS 'J8 saves. RLS: owner access only';
