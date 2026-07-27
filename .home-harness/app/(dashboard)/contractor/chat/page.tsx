'use client'

/**
 * Contractor messages.
 *
 * This used to dynamic-import the homeowner chat page. That page is now a
 * resolver that forwards to /homeowner/messages, so re-using it would have sent
 * every contractor into the homeowner's inbox. It is a real contractor-side
 * inbox instead, reading the same `conversations` / `messages` tables the
 * homeowner side uses (RLS: conversations_select_participants and
 * messages_insert_as_participant both admit the contractor).
 *
 * The homeowner's name lives in `profiles`, which is owner-only under RLS, so
 * threads are identified by the project rather than by a name we cannot read.
 * Saying "Homeowner" is truthful; inventing a name would not be.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MessagesSquare, Send } from 'lucide-react'
import {
  Notice, EmptyState, Loading, Avatar, PageHeader, relativeTime, messageTimestamp
} from '../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../_lib/errors'

interface Msg {
  id: string
  sender_id: string
  sender_type: string | null
  content: string
  created_at: string
}

interface Thread {
  id: string
  label: string
  messages: Msg[]
}

function ContractorChatContent() {
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [sendError, setSendError] = useState<FriendlyError | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setMyId(user.id)

      const { data: cp } = await supabase
        .from('contractor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!cp?.id) {
        setThreads([])
        setLoading(false)
        return
      }

      const { data: rows, error: convError } = await supabase
        .from('conversations')
        .select('id, created_at, messages(id, sender_id, sender_type, content, created_at)')
        .eq('contractor_id', cp.id)

      if (convError) throw convError

      const mapped: Thread[] = (rows ?? []).map((c: Record<string, any>, i: number) => ({
        id: c.id,
        label: `Homeowner · thread ${i + 1}`,
        messages: [...(c.messages ?? [])].sort(
          (a: Msg, b: Msg) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }))

      mapped.sort((a, b) => {
        const at = a.messages.at(-1)?.created_at ?? ''
        const bt = b.messages.at(-1)?.created_at ?? ''
        return bt.localeCompare(at)
      })

      setThreads(mapped)
      setActiveId(prev => prev ?? mapped[0]?.id ?? null)
      setError(null)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not load your messages',
          detail: 'Your threads are safe — this is a problem reading them. Reload the page to try again.'
        })
      )
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeId, threads])

  const active = threads.find(t => t.id === activeId) ?? null

  const send = async () => {
    const body = text.trim()
    if (!body || !active || sending) return
    setSending(true)
    setSendError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { error: insertError } = await supabase.from('messages').insert({
        conversation_id: active.id,
        sender_id: user.id,
        sender_type: 'contractor',
        content: body
      })
      if (insertError) throw insertError

      setText('')
      await load()
    } catch (err) {
      setSendError(
        friendlyError(err, {
          title: 'Your message did not send',
          detail: 'It is still in the box below, so nothing was lost. Press send again in a moment.'
        })
      )
    } finally {
      setSending(false)
    }
  }

  if (loading) return <Loading what="Loading your messages" />

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <PageHeader
        back={{ href: '/contractor', label: 'Dashboard' }}
        title="Messages"
        trailing={<span className="annotation tabular">{threads.length}</span>}
      />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>
        {error && <div style={{ marginBottom: 'var(--space-3)' }}><Notice error={error} /></div>}

        {threads.length === 0 ? (
          <EmptyState
            glyph={<MessagesSquare style={{ width: 22, height: 22 }} />}
            title="No conversations yet"
            why="A homeowner has to say yes to you before a thread opens — that is the whole point of the swipe, and it is why nobody can be cold-pitched here. Say yes to more projects in your feed and the matches follow."
            action={{ label: 'Review projects near you', href: '/contractor' }}
            secondary={{ label: 'Check your profile', href: '/contractor/profile' }}
          />
        ) : (
          <>
            {threads.length > 1 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                {threads.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    aria-current={t.id === activeId ? 'true' : undefined}
                    style={{
                      cursor: 'pointer',
                      padding: '8px 12px',
                      minHeight: 44,
                      fontSize: 'var(--type-2)',
                      borderRadius: 'var(--radius-control)',
                      background: t.id === activeId ? 'var(--color-accent-wash)' : 'var(--color-base)',
                      color: 'var(--color-ink)',
                      border: `1px solid ${t.id === activeId ? 'var(--color-accent)' : 'var(--color-line)'}`
                    }}
                  >
                    {t.label}
                    {t.messages.at(-1) && (
                      <span className="annotation" style={{ marginLeft: 8 }}>
                        {relativeTime(t.messages.at(-1)!.created_at)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {active && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
                  <Avatar name="Homeowner" size={36} />
                  <div>
                    <p style={{ margin: 0, fontSize: 'var(--type-3)', fontWeight: 600, color: 'var(--color-ink)' }}>
                      Homeowner
                    </p>
                    <p className="annotation" style={{ margin: 0 }}>Matched with you</p>
                  </div>
                </div>

                {active.messages.length === 0 ? (
                  <p
                    style={{
                      border: '1px solid var(--color-line)',
                      borderRadius: 'var(--radius-card)',
                      padding: 'var(--space-3)',
                      margin: 0,
                      fontSize: 'var(--type-3)',
                      lineHeight: 'var(--leading-body)',
                      color: 'var(--color-ink-2)'
                    }}
                  >
                    Nothing said yet. Opening with what you would need to see before quoting —
                    photos, measurements, access — gets a useful answer fastest.
                  </p>
                ) : (
                  <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {active.messages.map(m => {
                      const mine = m.sender_id === myId
                      return (
                        <li key={m.id} style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                          {!mine && <Avatar name="Homeowner" size={32} />}
                          <div style={{ maxWidth: '76%' }}>
                            <p className="annotation" style={{ margin: '0 0 4px 0', textAlign: mine ? 'right' : 'left' }}>
                              {mine ? 'You' : 'Homeowner'} · {messageTimestamp(m.created_at)}
                            </p>
                            <div
                              style={{
                                background: mine ? 'var(--color-accent-wash)' : 'var(--color-base-alt)',
                                border: '1px solid var(--color-line)',
                                borderRadius: 'var(--radius-card)',
                                padding: 'var(--space-1) var(--space-2)'
                              }}
                            >
                              <p style={{ margin: 0, fontSize: 'var(--type-3)', lineHeight: 'var(--leading-body)', color: 'var(--color-ink)', whiteSpace: 'pre-wrap' }}>
                                {m.content}
                              </p>
                            </div>
                          </div>
                          {mine && <Avatar name="You" size={32} />}
                        </li>
                      )
                    })}
                  </ol>
                )}
                <div ref={endRef} />

                {sendError && <div style={{ marginTop: 'var(--space-2)' }}><Notice error={sendError} /></div>}

                <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-3)' }}>
                  <input
                    type="text"
                    className="drawing-input"
                    aria-label="Write a message"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                    placeholder="Write a message…"
                    disabled={sending}
                  />
                  <button
                    onClick={send}
                    disabled={!text.trim() || sending}
                    className="btn-primary"
                    aria-label="Send message"
                    style={{ border: 'none', cursor: 'pointer', flexShrink: 0, opacity: !text.trim() || sending ? 0.5 : 1 }}
                  >
                    <Send style={{ width: 16, height: 16 }} aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <p className="annotation" style={{ marginTop: 'var(--space-4)' }}>
          <Link href="/contractor" style={{ color: 'var(--color-accent)' }}>← Back to your dashboard</Link>
        </p>
      </div>
    </div>
  )
}

export default function ContractorChatPage() {
  return (
    <Suspense fallback={<Loading what="Loading your messages" />}>
      <ContractorChatContent />
    </Suspense>
  )
}
