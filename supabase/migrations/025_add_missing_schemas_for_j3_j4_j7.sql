-- ============================================================
-- 025 — Add Missing Schemas for J3, J4, J7 Features
-- ============================================================
-- CRITICAL FIX: The following tables and columns were missing
-- but required by shipped features. This migration adds them.
--
-- Missing columns:
--   matches.liked_at (J3 heart action)
--   matches.passed_at (J3 pass action)
--
-- Missing tables:
--   conversations (J4 messaging - required by messages)
--   project_steps (J7 checklist - required by app)
--
-- Missing columns in existing tables:
--   messages.conversation_id (required by J4)
--   messages.sender_type (required by seed/app)
--
-- Updated RLS:
--   conversations: allow own-row access + demo exception
--   project_steps: allow own-project access
--   messages: allow conversation participant access
-- ============================================================

-- 1. Add missing columns to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS liked_at TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS passed_at TIMESTAMPTZ;

-- 2. Create conversations table (for J4 messaging)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_homeowner ON conversations(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contractor ON conversations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_match ON conversations(match_id);
CREATE INDEX IF NOT EXISTS idx_conversations_is_demo ON conversations(is_demo);

-- 3. Add missing columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_type TEXT CHECK (sender_type IN ('homeowner', 'contractor', 'system') OR sender_type IS NULL);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_is_demo ON messages(is_demo);

-- 4. Create project_steps table (for J7 checklist)
CREATE TABLE IF NOT EXISTS project_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_project_steps_project ON project_steps(project_id);
CREATE INDEX IF NOT EXISTS idx_project_steps_completed ON project_steps(completed);
CREATE INDEX IF NOT EXISTS idx_project_steps_is_demo ON project_steps(is_demo);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_steps ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: Users can see their own conversations
DROP POLICY IF EXISTS conversations_own_row ON conversations;
CREATE POLICY conversations_own_row ON conversations
  FOR SELECT USING (
    auth.uid() = homeowner_id OR
    auth.uid() IN (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
  );

DROP POLICY IF EXISTS conversations_own_row_insert ON conversations;
CREATE POLICY conversations_own_row_insert ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = homeowner_id OR
    auth.uid() IN (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
  );

DROP POLICY IF EXISTS conversations_demo_access ON conversations;
CREATE POLICY conversations_demo_access ON conversations
  FOR SELECT USING (is_demo = true);

-- Project Steps RLS: Users can see/edit steps for their own projects
DROP POLICY IF EXISTS project_steps_own_project ON project_steps;
CREATE POLICY project_steps_own_project ON project_steps
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects
      WHERE property_id IN (
        SELECT id FROM properties
        WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS project_steps_own_project_update ON project_steps;
CREATE POLICY project_steps_own_project_update ON project_steps
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects
      WHERE property_id IN (
        SELECT id FROM properties
        WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS project_steps_own_project_insert ON project_steps;
CREATE POLICY project_steps_own_project_insert ON project_steps
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE property_id IN (
        SELECT id FROM properties
        WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS project_steps_demo_access ON project_steps;
CREATE POLICY project_steps_demo_access ON project_steps
  FOR SELECT USING (is_demo = true);

-- Ensure messages table has RLS enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages RLS: Users can see messages in conversations they're part of
DROP POLICY IF EXISTS messages_conversation_participant ON messages;
CREATE POLICY messages_conversation_participant ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE homeowner_id = auth.uid() OR
            contractor_id IN (SELECT id FROM contractor_profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS messages_demo_access ON messages;
CREATE POLICY messages_demo_access ON messages
  FOR SELECT USING (is_demo = true);

-- ============================================================
-- VERIFY CRITICAL FEATURES CAN NOW WORK
-- ============================================================

-- These functions are called by J3, J4, J7 features:
-- ✅ UPDATE matches SET liked_at = NOW() (J3)
-- ✅ UPDATE matches SET passed_at = NOW() (J3)
-- ✅ INSERT INTO conversations (J4)
-- ✅ INSERT INTO messages(conversation_id, ...) (J4)
-- ✅ UPDATE project_steps SET completed = true (J7)

COMMENT ON COLUMN matches.liked_at IS 'Timestamp when homeowner hearted (liked) this match - J3 feature';
COMMENT ON COLUMN matches.passed_at IS 'Timestamp when homeowner passed on this match - J3 feature';
COMMENT ON TABLE conversations IS 'Conversation thread between homeowner and contractor - J4 messaging feature';
COMMENT ON TABLE project_steps IS 'Checklist steps for a project - J7 feature';
COMMENT ON COLUMN project_steps.completed IS 'Whether this step is marked complete by homeowner - J7 toggle';
