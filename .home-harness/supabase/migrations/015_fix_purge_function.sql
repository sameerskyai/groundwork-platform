-- Migration 015: Fix purge_demo_data() function
-- Status: NEW
-- Fixes: Schema references in purge function orphan check

-- Recreate purge_demo_data with corrected schema references
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
    -- Corrected: matches.project_id (not homeowner_id), check project exists
    SELECT COUNT(*) INTO orphan_count
    FROM (
      SELECT id FROM projects WHERE user_id NOT IN (SELECT id FROM profiles)
      UNION ALL
      SELECT id FROM matches WHERE project_id NOT IN (SELECT id FROM projects)
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
