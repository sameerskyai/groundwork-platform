-- ============================================================
-- 005 — Communities Feature ($20/mo Homeowner Plus)
-- Additive migration. Uses IF NOT EXISTS since the DB is already live.
-- ============================================================

-- Communities table — neighborhood-level groups
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  zip_code TEXT,
  type TEXT CHECK (type IN ('homeowner', 'realtor')) DEFAULT 'homeowner',
  realtor_user_id UUID REFERENCES profiles(id), -- for realtor-owned communities
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Community membership tracking
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (community_id, user_id)
);

-- Posts within a community
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  photo_urls TEXT[],
  project_type TEXT, -- e.g. "Kitchen Remodel", "Bathroom Tile"
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comments on posts
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_communities_zip ON communities(zip_code);
CREATE INDEX IF NOT EXISTS idx_communities_creator ON communities(creator_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user ON community_comments(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Communities: only members and creator can see/manage
DROP POLICY IF EXISTS "communities_view" ON communities;
CREATE POLICY "communities_view" ON communities FOR SELECT USING (
  auth.uid() = creator_id OR
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = id AND user_id = auth.uid()
  ) OR
  published = true
);

DROP POLICY IF EXISTS "communities_insert" ON communities;
CREATE POLICY "communities_insert" ON communities FOR INSERT WITH CHECK (
  auth.uid() = creator_id
);

DROP POLICY IF EXISTS "communities_update" ON communities;
CREATE POLICY "communities_update" ON communities FOR UPDATE USING (
  auth.uid() = creator_id
) WITH CHECK (
  auth.uid() = creator_id
);

-- Community membership: members can view, creator can manage
DROP POLICY IF EXISTS "community_members_view" ON community_members;
CREATE POLICY "community_members_view" ON community_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM communities
    WHERE id = community_id AND (
      auth.uid() = creator_id OR
      EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = community_id AND cm.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "community_members_insert" ON community_members;
CREATE POLICY "community_members_insert" ON community_members FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM communities WHERE id = community_id AND auth.uid() = creator_id
  )
);

-- Community posts: only homeowners (non-contractors) can see/create
-- Contractors cannot see any community posts (this is the anti-poaching mechanism)
DROP POLICY IF EXISTS "community_posts_view" ON community_posts;
CREATE POLICY "community_posts_view" ON community_posts FOR SELECT USING (
  -- User must be a member of the community AND not be a contractor
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_posts.community_id AND cm.user_id = auth.uid()
  ) AND
  -- Exclude contractors (role = 'contractor' in profiles table)
  NOT EXISTS (
    SELECT 1 FROM contractor_profiles
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "community_posts_insert" ON community_posts;
CREATE POLICY "community_posts_insert" ON community_posts FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  -- Only homeowners (non-contractors) can post
  NOT EXISTS (
    SELECT 1 FROM contractor_profiles WHERE user_id = auth.uid()
  ) AND
  -- User must be a member of the community
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = community_posts.community_id AND user_id = auth.uid()
  )
);

-- Community comments: same rules as posts
DROP POLICY IF EXISTS "community_comments_view" ON community_comments;
CREATE POLICY "community_comments_view" ON community_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM community_posts cp
    WHERE cp.id = post_id AND
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = cp.community_id AND cm.user_id = auth.uid()
    )
  ) AND
  NOT EXISTS (
    SELECT 1 FROM contractor_profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "community_comments_insert" ON community_comments;
CREATE POLICY "community_comments_insert" ON community_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  NOT EXISTS (
    SELECT 1 FROM contractor_profiles WHERE user_id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM community_posts cp
    JOIN community_members cm ON cm.community_id = cp.community_id
    WHERE cp.id = post_id AND cm.user_id = auth.uid()
  )
);
