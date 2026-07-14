-- ============================================================
-- 012 — Demo Isolation Layer (RESTRICTIVE RLS)
-- Adds is_demo flag to isolate demo data from real users
-- CRITICAL: RLS policies use RESTRICTIVE mode (not permissive)
-- Service-role bypasses RLS entirely
-- ============================================================

-- Add is_demo column to all tables (default false)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE contractor_profiles
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE referral_abuse_checks
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- INDEXES: partial indexes on is_demo=true for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo ON profiles(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_is_demo ON contractor_profiles(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_projects_is_demo ON projects(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_matches_is_demo ON matches(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_reviews_is_demo ON reviews(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_community_posts_is_demo ON community_posts(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_messages_is_demo ON messages(is_demo) WHERE is_demo = true;

-- ============================================================
-- RLS POLICIES: RESTRICTIVE ONLY (deny is_demo=true rows to non-service roles)
-- Service-role client bypasses RLS entirely (no exception clause needed)
-- ============================================================

-- Profiles: RESTRICTIVE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_isolation_profiles" ON profiles;
CREATE POLICY "demo_isolation_profiles" ON profiles
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false);

-- Contractor Profiles: RESTRICTIVE
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_isolation_contractors" ON contractor_profiles;
CREATE POLICY "demo_isolation_contractors" ON contractor_profiles
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false);

-- Projects: RESTRICTIVE
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_isolation_projects" ON projects;
CREATE POLICY "demo_isolation_projects" ON projects
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false);

-- Matches: RESTRICTIVE
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_isolation_matches" ON matches;
CREATE POLICY "demo_isolation_matches" ON matches
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false);

-- Reviews: RESTRICTIVE
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_isolation_reviews" ON reviews;
CREATE POLICY "demo_isolation_reviews" ON reviews
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false);

-- Community Posts: RESTRICTIVE
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_isolation_community_posts" ON community_posts;
CREATE POLICY "demo_isolation_community_posts" ON community_posts
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false);

-- Referrals: RESTRICTIVE
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_isolation_referrals" ON referrals;
CREATE POLICY "demo_isolation_referrals" ON referrals
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false);

-- Messages: RESTRICTIVE
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_isolation_messages" ON messages;
CREATE POLICY "demo_isolation_messages" ON messages
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false);

-- Referral Abuse Checks: RESTRICTIVE
ALTER TABLE referral_abuse_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_isolation_referral_abuse_checks" ON referral_abuse_checks;
CREATE POLICY "demo_isolation_referral_abuse_checks" ON referral_abuse_checks
  AS RESTRICTIVE
  FOR SELECT
  USING (is_demo = false);

-- ============================================================
-- PURGE FUNCTION: Delete all demo data (service_role only)
-- ============================================================

CREATE OR REPLACE FUNCTION purge_demo_data(confirm_token TEXT DEFAULT NULL)
RETURNS TABLE (
  success BOOLEAN,
  purged_records INT,
  orphaned_records INT,
  details JSONB,
  purged_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  confirm_required TEXT := 'PURGE_DEMO_DATA';
  p_count INT := 0;
  c_count INT := 0;
  pr_count INT := 0;
  m_count INT := 0;
  r_count INT := 0;
  po_count INT := 0;
  re_count INT := 0;
  msg_count INT := 0;
  abusecheck_count INT := 0;
  auth_count INT := 0;
  orphan_count INT := 0;
  total_purged INT := 0;
BEGIN
  -- Security: require confirmation token
  IF confirm_token IS NULL OR confirm_token != confirm_required THEN
    RAISE EXCEPTION 'Purge requires confirmation. Pass confirm_token = ''PURGE_DEMO_DATA''';
  END IF;

  -- BEGIN TRANSACTION
  BEGIN
    -- Delete messages
    DELETE FROM messages WHERE is_demo = true;
    GET DIAGNOSTICS msg_count = ROW_COUNT;

    -- Delete referral abuse checks
    DELETE FROM referral_abuse_checks WHERE is_demo = true;
    GET DIAGNOSTICS abusecheck_count = ROW_COUNT;

    -- Delete referrals
    DELETE FROM referrals WHERE is_demo = true;
    GET DIAGNOSTICS re_count = ROW_COUNT;

    -- Delete reviews
    DELETE FROM reviews WHERE is_demo = true;
    GET DIAGNOSTICS r_count = ROW_COUNT;

    -- Delete community posts
    DELETE FROM community_posts WHERE is_demo = true;
    GET DIAGNOSTICS po_count = ROW_COUNT;

    -- Delete matches
    DELETE FROM matches WHERE is_demo = true;
    GET DIAGNOSTICS m_count = ROW_COUNT;

    -- Delete projects
    DELETE FROM projects WHERE is_demo = true;
    GET DIAGNOSTICS pr_count = ROW_COUNT;

    -- Delete contractor profiles
    DELETE FROM contractor_profiles WHERE is_demo = true;
    GET DIAGNOSTICS c_count = ROW_COUNT;

    -- Delete homeowner profiles
    DELETE FROM profiles WHERE is_demo = true;
    GET DIAGNOSTICS p_count = ROW_COUNT;

    -- Delete demo auth users (by is_demo metadata flag, never by email pattern)
    DELETE FROM auth.users
    WHERE raw_user_meta_data->>'is_demo' = 'true';
    GET DIAGNOSTICS auth_count = ROW_COUNT;

    -- ORPHAN CHECK: Find any remaining refs to deleted demo users
    SELECT COUNT(*) INTO orphan_count
    FROM (
      SELECT id FROM projects WHERE user_id NOT IN (SELECT id FROM profiles)
      UNION ALL
      SELECT id FROM matches WHERE homeowner_id NOT IN (SELECT id FROM profiles)
        OR contractor_id NOT IN (SELECT id FROM contractor_profiles)
    ) orphans;

    -- Calculate total
    total_purged := p_count + c_count + pr_count + m_count + r_count + po_count + re_count + msg_count + abusecheck_count + auth_count;

    RETURN QUERY SELECT
      true AS success,
      total_purged AS purged_records,
      orphan_count AS orphaned_records,
      jsonb_build_object(
        'profiles', p_count,
        'contractors', c_count,
        'projects', pr_count,
        'matches', m_count,
        'reviews', r_count,
        'posts', po_count,
        'referrals', re_count,
        'messages', msg_count,
        'referral_abuse_checks', abusecheck_count,
        'auth_users', auth_count
      ) AS details,
      now() AS purged_at;

  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Purge transaction failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Grant only to service_role (never to authenticated or public)
REVOKE EXECUTE ON FUNCTION purge_demo_data FROM authenticated;
REVOKE EXECUTE ON FUNCTION purge_demo_data FROM public;
GRANT EXECUTE ON FUNCTION purge_demo_data TO service_role;

-- Helper RPC: Find a project with sub-80% candidates (for testing)
CREATE OR REPLACE FUNCTION find_project_with_sub_80_candidates()
RETURNS TABLE (project_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT m.project_id
  FROM matches m
  WHERE m.compatibility_percentage < 80
    AND m.is_demo = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION find_project_with_sub_80_candidates TO service_role;
