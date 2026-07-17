'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, MessageCircle } from 'lucide-react'

interface Conversation {
  id: string
  contractor_id: string
  match_id: string
  created_at: string
  updated_at: string
  contractor: {
    id: string
    business_name: string
    profiles: {
      avatar_url: string | null
    } | null
  }
  messages: Array<{
    content: string
    created_at: string
  }>
}

function MessagesContent() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConversations = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          contractor_id,
          match_id,
          created_at,
          updated_at,
          contractor:contractor_id(
            id,
            business_name,
            profiles(avatar_url)
          ),
          messages(content, created_at)
        `)
        .eq('homeowner_id', user.id)
        .order('updated_at', { ascending: false })

      if (convError) throw convError

      // Get the latest message for each conversation
      const convsWithLatest = (convData || []).map((conv: any) => ({
        ...conv,
        messages: conv.messages ? conv.messages.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 1) : []
      }))

      setConversations(convsWithLatest as any)
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading messages...</p>
        </div>
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
          <Link href="/homeowner" style={{ color: 'var(--color-text-secondary)' }} className="hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 style={{
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-primary)',
            flex: 1
          }}>
            Messages
          </h1>
          <span style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-tertiary)'
          }}>
            {conversations.length}
          </span>
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

        {conversations.length === 0 ? (
          <Card variant="accent" className="p-12 text-center">
            <MessageCircle style={{
              width: '3rem',
              height: '3rem',
              margin: '0 auto var(--space-md)',
              color: 'var(--color-text-tertiary)',
              opacity: 0.5
            }} />
            <h2 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-sm)'
            }}>
              No conversations yet
            </h2>
            <p style={{
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-lg)'
            }}>
              Message contractors you've matched with
            </p>
            <Link href="/homeowner">
              <Button>Back to Dashboard</Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map(conv => {
              const latestMsg = conv.messages?.[0]
              return (
                <Link
                  key={conv.id}
                  href={`/homeowner/messages/${conv.id}`}
                  className="block"
                >
                  <Card variant="interactive" className="p-4 hover:opacity-90 transition-opacity cursor-pointer">
                    <div className="flex items-start gap-4">
                      {conv.contractor.profiles?.avatar_url && (
                        <img
                          src={conv.contractor.profiles.avatar_url}
                          alt={conv.contractor.business_name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--weight-bold)',
                          color: 'var(--color-text-primary)',
                          marginBottom: 'var(--space-xs)'
                        }}>
                          {conv.contractor.business_name}
                        </h3>
                        {latestMsg ? (
                          <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {latestMsg.content}
                          </p>
                        ) : (
                          <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-text-tertiary)',
                            fontStyle: 'italic'
                          }}>
                            No messages yet
                          </p>
                        )}
                      </div>
                      <div style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-tertiary)',
                        flexShrink: 0
                      }}>
                        {formatTime(latestMsg?.created_at || conv.updated_at)}
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
