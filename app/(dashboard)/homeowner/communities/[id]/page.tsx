'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Plus } from 'lucide-react'

interface Post {
  id: string
  author_id: string
  content: string
  created_at: string
  reply_count: number
  author: {
    id: string
    display_name: string | null
  }
}

interface CommunityDetail {
  id: string
  zip_code: string
  member_count: number
  post_count: number
  posts: Post[]
}

function CommunityDetailContent() {
  const router = useRouter()
  const params = useParams()
  const communityId = params.id as string

  const [community, setCommunity] = useState<CommunityDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newPostText, setNewPostText] = useState('')
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

      const { data: commData, error: commError } = await supabase
        .from('communities')
        .select(`
          id,
          zip_code,
          member_count,
          post_count,
          posts(
            id,
            author_id,
            content,
            created_at,
            reply_count,
            author:author_id(id, display_name)
          )
        `)
        .eq('id', communityId)
        .order('created_at', { ascending: false, foreignTable: 'posts' })
        .single()

      if (commError) throw commError
      setCommunity(commData as unknown as CommunityDetail)
    } catch (err: any) {
      setError(err.message || 'Failed to load community')
    } finally {
      setLoading(false)
    }
  }, [communityId, router])

  useEffect(() => {
    loadCommunity()
  }, [loadCommunity])

  const handleCreatePost = async () => {
    if (!newPostText.trim() || !community) return

    setPosting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          community_id: community.id,
          author_id: user.id,
          content: newPostText
        })

      if (insertError) throw insertError

      setNewPostText('')
      setShowNewPost(false)
      await loadCommunity()
    } catch (err: any) {
      setError(err.message || 'Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading community...</p>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <Card className="max-w-sm p-8 text-center">
          <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-lg)' }}>{error || 'Community not found'}</p>
          <Link href="/homeowner/communities">
            <Button className="w-full">Back to Community</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--color-surface-primary)', minHeight: '100vh' }}>
      <header style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 1.5rem'
      }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/homeowner/communities" style={{ color: 'var(--color-text-secondary)' }} className="hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 style={{
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-primary)',
            flex: 1
          }}>
            ZIP {community.zip_code}
          </h1>
          <Button
            size="sm"
            onClick={() => setShowNewPost(!showNewPost)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Post
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <Card className="p-4 mb-6" style={{ borderColor: 'var(--color-error)', borderWidth: '1px' }}>
            <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
              {error}
            </p>
          </Card>
        )}

        {showNewPost && (
          <Card variant="interactive" className="p-6 mb-6">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Share your thoughts, ask questions, or recommend local contractors..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: 'var(--space-md)',
                backgroundColor: 'var(--color-surface-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: 'var(--space-md)'
              }}
            />
            <div className="flex gap-3">
              <Button
                onClick={handleCreatePost}
                disabled={!newPostText.trim() || posting}
                className="flex-1"
              >
                {posting ? 'Posting...' : 'Post'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowNewPost(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {community.posts && community.posts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {community.posts.map(post => (
              <Card key={post.id} variant="interactive" className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-xs)'
                    }}>
                      {post.author.display_name || 'Anonymous'}
                    </h3>
                    <p style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-tertiary)'
                    }}>
                      {new Date(post.created_at).toLocaleDateString()} at{' '}
                      {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {post.reply_count > 0 && (
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: 'var(--color-brand-lighter)',
                      color: 'var(--color-brand)',
                      padding: 'var(--space-xs) var(--space-sm)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--weight-semibold)'
                    }}>
                      {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
                    </div>
                  )}
                </div>

                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-primary)',
                  lineHeight: 'var(--leading-relaxed)',
                  marginBottom: 'var(--space-md)',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {post.content}
                </p>

                <Link href={`/homeowner/communities/${community.id}/posts/${post.id}`}>
                  <Button size="sm" variant="secondary" className="w-full">
                    View Thread
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="accent" className="p-8 text-center">
            <h2 style={{
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-sm)'
            }}>
              No discussions yet
            </h2>
            <p style={{
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-lg)'
            }}>
              Be the first to start a conversation
            </p>
            <Button onClick={() => setShowNewPost(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Post
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function CommunityDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <CommunityDetailContent />
    </Suspense>
  )
}
