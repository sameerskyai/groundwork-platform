'use client'

/**
 * /homeowner/chat — resolver, not a second inbox.
 *
 * FEATURE_INVENTORY.md, "Direct messaging": the app carried two disconnected
 * messaging systems. This one keyed off `messages.match_id` via /api/chat,
 * which additionally requires `matches.status = 'matched'` — a status no row in
 * the live database has — so it could only ever render "Failed to load
 * messages." or "No conversation selected. Go back to matches." Every link into
 * it was a dead end.
 *
 * Rather than keep two half-working inboxes, this route now resolves to the one
 * that works: it finds (or opens) the conversation for the match and forwards
 * to /homeowner/messages/<id>, which is the consolidated thread with
 * participant identity and per-message timestamps.
 */

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Notice, Loading, PageHeader } from '../../_components/Feedback'
import { ensureConversation } from '../../_lib/conversations'
import { friendlyError, type FriendlyError } from '../../_lib/errors'

function ChatResolver() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const raw = searchParams.get('match')
  const matchId = raw && raw !== 'null' && raw !== 'undefined' ? raw : null

  const [error, setError] = useState<FriendlyError | null>(null)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/login')
          return
        }

        if (!matchId) {
          router.replace('/homeowner/messages')
          return
        }

        // Already have a thread for this match?
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .eq('match_id', matchId)
          .eq('homeowner_id', user.id)
          .limit(1)
          .maybeSingle()

        if (existing?.id) {
          router.replace(`/homeowner/messages/${existing.id}`)
          return
        }

        // No thread yet: open one from the match, if it is genuinely ours.
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('id, contractor_id, projects(user_id)')
          .eq('id', matchId)
          .maybeSingle()

        if (matchError) throw matchError

        const ownerId = (match?.projects as unknown as { user_id?: string } | null)?.user_id
        if (!match || ownerId !== user.id) {
          if (!cancelled) {
            setError({
              title: 'That conversation is not on this account',
              detail: 'The link points at a match belonging to someone else. Open the thread from your Messages list instead.'
            })
          }
          return
        }

        const conversationId = await ensureConversation(supabase, {
          homeownerId: user.id,
          contractorId: match.contractor_id,
          matchId: match.id
        })

        if (conversationId) {
          router.replace(`/homeowner/messages/${conversationId}`)
        } else if (!cancelled) {
          setError({
            title: 'We could not open that conversation',
            detail: 'The match is yours, but the thread would not open. Go to Messages — if it is there, it will open from the list.'
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            friendlyError(err, {
              title: 'We could not open that conversation',
              detail: 'Nothing was lost. Open it from your Messages list instead.'
            })
          )
        }
      }
    }

    resolve()
    return () => { cancelled = true }
  }, [matchId, router])

  if (!error) return <Loading what="Opening your conversation" />

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <PageHeader back={{ href: '/homeowner/messages', label: 'Messages' }} title="Conversation" />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>
        <Notice error={error} />
        <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-1)' }}>
          <Link href="/homeowner/messages" className="btn-primary" style={{ textDecoration: 'none' }}>
            Go to Messages
          </Link>
          <Link href="/homeowner" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<Loading what="Opening your conversation" />}>
      <ChatResolver />
    </Suspense>
  )
}
