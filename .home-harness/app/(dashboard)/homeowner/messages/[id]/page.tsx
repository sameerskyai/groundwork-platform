'use client'

/**
 * One conversation thread.
 *
 * TASK 7: every message carries the sender's name and a timestamp, and the
 * header carries the participant's name and avatar. `profiles.avatar_url` is
 * owner-only under RLS and is never written by the app, so the monogram in
 * <Avatar> is the real avatar for almost everyone -- it is designed to look
 * deliberate rather than like a failed image load.
 *
 * Messages are written to `messages.conversation_id` (migration 025) and read
 * back from the same column, so a sent message survives a reload. Sending
 * optimistically appends, then re-reads from the database so what you see
 * after a send is what is actually stored.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { Notice, Loading, Avatar, messageTimestamp } from '../../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../../_lib/errors'

interface Message {
  id: string
  sender_id: string
  sender_type: string | null
  content: string
  created_at: string
}

interface ConversationDetail {
  id: string
  business_name: string
  avatar_url: string | null
  messages: Message[]
}

function ConversationContent() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [myName, setMyName] = useState('You')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [sendError, setSendError] = useState<FriendlyError | null>(null)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages])

  const loadConversation = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setMyId(user.id)

      const [{ data: convData, error: convError }, { data: prof }] = await Promise.all([
        supabase
          .from('conversations')
          .select(`
            id,
            contractor:contractor_id(id, business_name, profiles(avatar_url)),
            messages(id, sender_id, sender_type, content, created_at)
          `)
          .eq('id', conversationId)
          .eq('homeowner_id', user.id)
          .single(),
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
      ])

      if (convError) throw convError

      setMyName(prof?.full_name?.split(' ')[0] ?? 'You')

      const conv = convData as unknown as Record<string, any>
      const sorted = [...(conv.messages ?? [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      setConversation({
        id: conv.id,
        business_name: conv.contractor?.business_name ?? 'Contractor',
        avatar_url: conv.contractor?.profiles?.avatar_url ?? null,
        messages: sorted
      })
      setError(null)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not open this conversation',
          detail: 'The link may be out of date, or the thread may belong to a different account. Go back to Messages and open it from the list.'
        })
      )
    } finally {
      setLoading(false)
    }
  }, [conversationId, router])

  useEffect(() => {
    loadConversation()
  }, [loadConversation])

  const handleSend = async () => {
    const body = messageText.trim()
    if (!body || !conversation || sending) return

    setSending(true)
    setSendError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { error: insertError } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_type: 'homeowner',
        content: body
      })

      if (insertError) throw insertError

      setMessageText('')
      // Re-read so the thread shows what is actually stored, not what we hoped.
      await loadConversation()
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

  if (loading) return <Loading what="Loading conversation" />

  if (!conversation) {
    return (
      <div style={{ background: 'var(--color-base)', minHeight: '100vh', padding: 'var(--space-4) var(--space-3)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {error && <Notice error={error} />}
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Link href="/homeowner/messages" className="btn-primary" style={{ textDecoration: 'none' }}>
              Back to Messages
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--color-base)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Participant identity lives in the header: name + avatar, always. */}
      <header
        style={{
          background: 'var(--color-base)',
          borderBottom: '1px solid var(--color-line)',
          padding: 'var(--space-2) var(--space-3)',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Link
            href="/homeowner/messages"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 44,
              fontSize: 'var(--type-2)',
              color: 'var(--color-accent)',
              textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <span aria-hidden="true">&larr;</span> Messages
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flex: 1, minWidth: 0 }}>
            <Avatar name={conversation.business_name} src={conversation.avatar_url} size={36} />
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--type-3)',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {conversation.business_name}
              </p>
              <p className="annotation" style={{ margin: 0 }}>Matched contractor</p>
            </div>
          </div>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding: 'var(--space-3)',
          overflowY: 'auto'
        }}
      >
        {error && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <Notice error={error} />
          </div>
        )}

        {conversation.messages.length === 0 ? (
          <div
            style={{
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-card)',
              padding: 'var(--space-4)',
              textAlign: 'center'
            }}
          >
            <h2 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--type-4)', fontWeight: 600, color: 'var(--color-ink)' }}>
              Nothing said yet
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--type-3)',
                lineHeight: 'var(--leading-body)',
                color: 'var(--color-ink-2)',
                maxWidth: '46ch',
                marginInline: 'auto'
              }}
            >
              You and {conversation.business_name} matched, so this thread is open — nobody has
              written the first line. Telling them your timeline and budget range gets a useful
              reply fastest.
            </p>
          </div>
        ) : (
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {conversation.messages.map(msg => {
              const mine = msg.sender_id === myId
              const who = mine ? myName : conversation.business_name
              return (
                <li
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: 'var(--space-1)',
                    justifyContent: mine ? 'flex-end' : 'flex-start'
                  }}
                >
                  {!mine && <Avatar name={conversation.business_name} src={conversation.avatar_url} size={32} />}
                  <div style={{ maxWidth: '76%' }}>
                    {/* Name + timestamp on EVERY message, not just the first. */}
                    <p
                      className="annotation"
                      style={{ margin: '0 0 4px 0', textAlign: mine ? 'right' : 'left' }}
                    >
                      {who} · {messageTimestamp(msg.created_at)}
                    </p>
                    <div
                      style={{
                        background: mine ? 'var(--color-accent-wash)' : 'var(--color-base-alt)',
                        border: '1px solid var(--color-line)',
                        borderRadius: 'var(--radius-card)',
                        padding: 'var(--space-1) var(--space-2)',
                        overflowWrap: 'break-word'
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--type-3)',
                          lineHeight: 'var(--leading-body)',
                          color: 'var(--color-ink)',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {msg.content}
                      </p>
                    </div>
                  </div>
                  {mine && <Avatar name={myName} size={32} />}
                </li>
              )
            })}
          </ol>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          background: 'var(--color-base)',
          borderTop: '1px solid var(--color-line)',
          padding: 'var(--space-2) var(--space-3)',
          position: 'sticky',
          bottom: 0
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {sendError && (
            <div style={{ marginBottom: 'var(--space-1)' }}>
              <Notice error={sendError} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            <label htmlFor="message-input" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
              Write a message
            </label>
            <input
              id="message-input"
              type="text"
              className="drawing-input"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={`Message ${conversation.business_name}…`}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim() || sending}
              className="btn-primary"
              aria-label="Send message"
              style={{
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                opacity: !messageText.trim() || sending ? 0.5 : 1
              }}
            >
              <Send style={{ width: 16, height: 16 }} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConversationPage() {
  return (
    <Suspense fallback={<Loading what="Loading conversation" />}>
      <ConversationContent />
    </Suspense>
  )
}
