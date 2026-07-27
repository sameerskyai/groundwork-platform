'use client'

/**
 * BUG #4 (FEATURE_INVENTORY.md, "Direct messaging"): the inbox could only ever
 * show seeded threads, because nothing in the app created a `conversations`
 * row. Creation now happens the moment a match becomes mutual --
 * see ensureConversation() in app/(dashboard)/_lib/conversations.ts, called
 * from the homeowner dashboard's swipe handler. This page is the read side.
 *
 * `conversations.updated_at` has no trigger on message insert, so ordering is
 * done off the latest message rather than trusting a column nothing maintains.
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MessagesSquare } from 'lucide-react'
import { Notice, EmptyState, Loading, Avatar, PageHeader, relativeTime } from '../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../_lib/errors'

interface Thread {
  id: string
  business_name: string
  avatar_url: string | null
  last_message: string | null
  last_at: string
}

function MessagesContent() {
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FriendlyError | null>(null)

  const loadConversations = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [{ data: convData, error: convError }, { data: proj }] = await Promise.all([
        supabase
          .from('conversations')
          .select(`
            id,
            created_at,
            contractor:contractor_id(id, business_name, profiles(avatar_url)),
            messages(content, created_at)
          `)
          .eq('homeowner_id', user.id),
        supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ])

      if (convError) throw convError
      setProjectId(proj?.id ?? null)

      const rows: Thread[] = (convData ?? []).map((conv: Record<string, any>) => {
        const msgs = [...(conv.messages ?? [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        return {
          id: conv.id,
          business_name: conv.contractor?.business_name ?? 'Contractor',
          avatar_url: conv.contractor?.profiles?.avatar_url ?? null,
          last_message: msgs[0]?.content ?? null,
          last_at: msgs[0]?.created_at ?? conv.created_at
        }
      })

      rows.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime())
      setThreads(rows)
      setError(null)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not load your messages',
          detail: 'Your conversations are safe — this is a problem reading them, not a problem with them. Reload the page to try again.'
        })
      )
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  if (loading) return <Loading what="Loading your messages" />

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <PageHeader
        back={{ href: '/homeowner', label: 'Dashboard' }}
        title="Messages"
        trailing={
          <span className="annotation">
            {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
          </span>
        }
      />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>
        {error && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <Notice error={error} />
          </div>
        )}

        {threads.length === 0 ? (
          <EmptyState
            glyph={<MessagesSquare style={{ width: 22, height: 22 }} />}
            title="No conversations yet"
            why="A thread opens the moment you and a contractor both say yes — nobody can message you before that, which is why this is empty rather than full of cold pitches."
            action={
              projectId
                ? { label: 'See your matches', href: `/homeowner/matches?project=${projectId}` }
                : { label: 'Start an estimate', href: '/homeowner/estimate' }
            }
            secondary={{ label: 'Back to dashboard', href: '/homeowner' }}
          />
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {threads.map(t => (
              <li key={t.id}>
                <Link
                  href={`/homeowner/messages/${t.id}`}
                  className="drawing-card--interactive"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 'var(--radius-card)',
                    textDecoration: 'none',
                    background: 'var(--color-base)'
                  }}
                >
                  <Avatar name={t.business_name} src={t.avatar_url} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 'var(--type-3)', fontWeight: 600, color: 'var(--color-ink)' }}>
                      {t.business_name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--type-2)',
                        color: t.last_message ? 'var(--color-ink-2)' : 'var(--color-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t.last_message ?? 'Say hello — nobody has written yet'}
                    </p>
                  </div>
                  <span className="annotation" style={{ flexShrink: 0 }}>
                    {relativeTime(t.last_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<Loading what="Loading your messages" />}>
      <MessagesContent />
    </Suspense>
  )
}
