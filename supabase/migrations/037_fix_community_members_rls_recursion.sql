-- ============================================================
-- 037 — Fix infinite recursion in community_members RLS policy
-- Additive/corrective. Found live during Gate 4 walkthrough prep
-- (2026-07-22): visiting /homeowner/communities throws
-- "infinite recursion detected in policy for relation community_members".
-- ============================================================

-- Root cause: community_members_view's own policy subquery re-selects
-- FROM community_members (the same table the policy protects) to check
-- membership. Since RLS re-applies to that inner subquery, it re-evaluates
-- the same policy again, recursing forever. communities_view's policy also
-- subqueries community_members, so it hits the same recursion indirectly.
--
-- Standard fix: a SECURITY DEFINER helper function. Functions run with the
-- privileges of their owner (the migration role, which has BYPASSRLS),
-- so the inner membership check no longer re-triggers RLS on
-- community_members, breaking the recursion.

CREATE OR REPLACE FUNCTION is_community_member(p_community_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id AND user_id = p_user_id
  );
$$;

DROP POLICY IF EXISTS "community_members_view" ON community_members;
CREATE POLICY "community_members_view" ON community_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM communities
    WHERE id = community_id AND (
      auth.uid() = creator_id OR
      is_community_member(community_id, auth.uid())
    )
  )
);

-- communities_view also subqueries community_members directly -- same fix
-- applied there so it doesn't recurse via the same path.
DROP POLICY IF EXISTS "communities_view" ON communities;
CREATE POLICY "communities_view" ON communities FOR SELECT USING (
  auth.uid() = creator_id OR
  is_community_member(id, auth.uid()) OR
  published = true
);

-- community_members_insert's own WITH CHECK doesn't self-reference
-- community_members (only communities), so it's untouched -- not part of
-- the recursion.
