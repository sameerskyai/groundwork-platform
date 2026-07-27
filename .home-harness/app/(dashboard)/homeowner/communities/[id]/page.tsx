'use client'

/**
 * BUG #3 (FEATURE_INVENTORY.md, "Communities"): this page used to select
 * `member_count`, `post_count` and a `posts(...)` relation off `communities`,
 * and insert into a table called `posts`. None of those exist. The real schema
 * (supabase/migrations/005_communities.sql) is:
 *
 *   communities(id, name, description, zip_code, creator_id, ...)
 *   community_members(community_id, user_id, role, joined_at)
 *   community_posts(id, community_id, user_id, title, description, photo_urls,
 *                   project_type, budget_min, budget_max, created_at)
 *   community_comments(id, post_id, user_id, content, created_at)
 *
 * Counts are computed with count queries, not read off a column that was never
 * created. Post authorship shows "You" for your own rows: `profiles` is
 * owner-only under RLS, so a neighbour's name genuinely is not readable here
 * and we say what is true rather than rendering "Anonymous" as if it were data.
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Plus, Users } from 'lucide-react'
import { Notice, EmptyState, Loading, Avatar, PageHeader, relativeTime } from '../../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../../_lib/errors'

interface CommunityPost {
  id: string
  user_id: string
  title: string
  description: string | null
  project_type: string | null
  created_at: string
  comment_count: number
}

interface CommunityDetail {
  id: string
  name: string
  description: string | null
  zip_code: string | null
  member_count: number
}

function CommunityDetailContent() {
  const router = useRouter()
  const params = useParams()
  const communityId = params.id as string

  const [community, setCommunity] = useState<CommunityDetail | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [postError, setPostError] = useState<FriendlyError | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [showNewPost, setShowNewPost] = useState(false)

  const loadCommunity = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      // Real columns only.
      const { data: commData, error: commError } = await supabase
        .from('communities')
        .select('id, name, description, zip_code')
        .eq('id', communityId)
        .single()

      if (commError) throw commError

      const [{ count: memberCount }, { data: postRows, error: postsError }] = await Promise.all([
        supabase
          .from('community_members')
          .select('id', { count: 'exact', head: true })
          .eq('community_id', communityId),
        supabase
          .from('community_posts')
          .select('id, user_id, title, description, project_type, created_at')
          .eq('community_id', communityId)
          .order('created_at', { ascending: false })
      ])

      if (postsError) throw postsError

      // community_comments has no denormalised counter either -- count them.
      const ids = (postRows ?? []).map(p => p.id)
      let counts: Record<string, number> = {}
      if (ids.length) {
        const { data: commentRows } = await supabase
          .from('community_comments')
          .select('post_id')
          .in('post_id', ids)
        counts = (commentRows ?? []).reduce<Record<string, number>>((acc, c) => {
          acc[c.post_id] = (acc[c.post_id] ?? 0) + 1
          return acc
        }, {})
      }

      setCommunity({
        id: commData.id,
        name: commData.name,
        description: commData.description,
        zip_code: commData.zip_code,
        member_count: memberCount ?? 0
      })
      setPosts((postRows ?? []).map(p => ({ ...p, comment_count: counts[p.id] ?? 0 })))
      setError(null)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not open this neighbourhood',
          detail: 'It may not exist any more, or you may not be a member yet. Go back to your neighbourhood and open it from there.'
        })
      )
    } finally {
      setLoading(false)
    }
  }, [communityId, router])

  useEffect(() => {
    loadCommunity()
  }, [loadCommunity])

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !community) return

    setPosting(true)
    setPostError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Real table, real columns. `title` is NOT NULL in 005.
      const { error: insertError } = await supabase
        .from('community_posts')
        .insert({
          community_id: community.id,
          user_id: user.id,
          title: newTitle.trim(),
          description: newBody.trim() || null
        })

      if (insertError) throw insertError

      setNewTitle('')
      setNewBody('')
      setShowNewPost(false)
      await loadCommunity()
    } catch (err) {
      setPostError(
        friendlyError(err, {
          title: 'Your post did not go up',
          detail: 'Nothing you typed was lost — it is still in the box. Try posting again in a moment.'
        })
      )
    } finally {
      setPosting(false)
    }
  }

  if (loading) return <Loading what="Loading your neighbourhood" />

  if (!community) {
    return (
      <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
        <PageHeader back={{ href: '/homeowner/communities', label: 'Neighbourhood' }} title="Neighbourhood" />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>
          {error && <Notice error={error} />}
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Link href="/homeowner/communities" className="btn-primary" style={{ textDecoration: 'none' }}>
              Back to your neighbourhood
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <PageHeader
        back={{ href: '/homeowner/communities', label: 'Neighbourhood' }}
        title={community.name}
        trailing={
          <button
            onClick={() => setShowNewPost(v => !v)}
            className="btn-primary"
            style={{ padding: '0 var(--space-2)', minHeight: 36, border: 'none', cursor: 'pointer' }}
          >
            <Plus style={{ width: 14, height: 14, marginRight: 6 }} aria-hidden="true" />
            Post
          </button>
        }
      />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>
        <p
          className="annotation"
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-3)' }}
        >
          <Users style={{ width: 13, height: 13 }} aria-hidden="true" />
          ZIP {community.zip_code ?? '—'} · {community.member_count}{' '}
          {community.member_count === 1 ? 'neighbour' : 'neighbours'} · {posts.length}{' '}
          {posts.length === 1 ? 'discussion' : 'discussions'}
        </p>

        {error && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <Notice error={error} />
          </div>
        )}

        {showNewPost && (
          <div
            style={{
              background: 'var(--color-base-alt)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-card)',
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-3)'
            }}
          >
            <label
              htmlFor="post-title"
              className="annotation"
              style={{ display: 'block', marginBottom: 6 }}
            >
              Title
            </label>
            <input
              id="post-title"
              className="drawing-input"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Anyone used a good tile installer?"
              maxLength={140}
              style={{ marginBottom: 'var(--space-2)' }}
            />

            <label
              htmlFor="post-body"
              className="annotation"
              style={{ display: 'block', marginBottom: 6 }}
            >
              Details (optional)
            </label>
            <textarea
              id="post-body"
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              placeholder="What are you planning, and what would help you decide?"
              rows={4}
              className="drawing-input"
              style={{
                paddingTop: 'var(--space-1)',
                paddingBottom: 'var(--space-1)',
                resize: 'vertical',
                marginBottom: 'var(--space-2)'
              }}
            />

            {postError && (
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <Notice error={postError} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              <button
                onClick={handleCreatePost}
                disabled={!newTitle.trim() || posting}
                className="btn-primary"
                style={{ border: 'none', cursor: 'pointer', opacity: !newTitle.trim() || posting ? 0.5 : 1 }}
              >
                {posting ? 'Posting…' : 'Post to the neighbourhood'}
              </button>
              <button
                onClick={() => { setShowNewPost(false); setPostError(null) }}
                className="btn-secondary"
                style={{ cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {posts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {posts.map(post => {
              const mine = post.user_id === userId
              return (
                <article
                  key={post.id}
                  style={{
                    background: 'var(--color-base)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 'var(--radius-card)',
                    padding: 'var(--space-3)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-1)' }}>
                    <Avatar name={mine ? 'You' : 'Neighbour'} size={32} />
                    <div>
                      <p style={{ margin: 0, fontSize: 'var(--type-2)', fontWeight: 600, color: 'var(--color-ink)' }}>
                        {mine ? 'You' : 'A neighbour in this ZIP'}
                      </p>
                      <p className="annotation" style={{ margin: 0 }}>
                        {relativeTime(post.created_at)}
                        {post.project_type ? ` · ${post.project_type}` : ''}
                      </p>
                    </div>
                  </div>

                  <h3
                    style={{
                      margin: '0 0 var(--space-1) 0',
                      fontSize: 'var(--type-4)',
                      fontWeight: 600,
                      color: 'var(--color-ink)',
                      letterSpacing: 'var(--tracking-display)'
                    }}
                  >
                    {post.title}
                  </h3>

                  {post.description && (
                    <p
                      style={{
                        margin: '0 0 var(--space-2) 0',
                        fontSize: 'var(--type-3)',
                        lineHeight: 'var(--leading-body)',
                        color: 'var(--color-ink-2)',
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'break-word'
                      }}
                    >
                      {post.description}
                    </p>
                  )}

                  <p
                    className="annotation"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}
                  >
                    <MessageSquare style={{ width: 12, height: 12 }} aria-hidden="true" />
                    {post.comment_count} {post.comment_count === 1 ? 'reply' : 'replies'}
                  </p>
                </article>
              )
            })}
          </div>
        ) : (
          <EmptyState
            glyph={<MessageSquare style={{ width: 22, height: 22 }} />}
            title="No discussions here yet"
            why={`Nobody in ZIP ${community.zip_code ?? 'your area'} has posted yet — this neighbourhood was only just created. The first question is usually the most useful one: which pro someone actually hired, and whether it went well.`}
            action={{ label: 'Start the first discussion', onClick: () => setShowNewPost(true) }}
            secondary={{ label: 'Back to your neighbourhood', href: '/homeowner/communities' }}
          />
        )}
      </div>
    </div>
  )
}

export default function CommunityDetailPage() {
  return (
    <Suspense fallback={<Loading what="Loading your neighbourhood" />}>
      <CommunityDetailContent />
    </Suspense>
  )
}
