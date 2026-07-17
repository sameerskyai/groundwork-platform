'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Send } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  sender_type: string
  content: string
  created_at: string
}

interface ConversationDetail {
  id: string
  contractor_id: string
  contractor: {
    id: string
    business_name: string
    profiles: {
      avatar_url: string | null
    } | null
  }
  messages: Message[]
}

function ConversationContent() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])

  const loadConversation = useCallback(async () => {
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
          contractor:contractor_id(
            id,
            business_name,
            profiles(avatar_url)
          ),
          messages(id, sender_id, sender_type, content, created_at)
        `)
        .eq('id', conversationId)
        .eq('homeowner_id', user.id)
        .single()

      if (convError) throw convError
      if (!convData) throw new Error('Conversation not found')

      const sortedMessages = (convData.messages || [])
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      setConversation({
        ...convData,
        messages: sortedMessages
      } as unknown as ConversationDetail)
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }, [conversationId, router])

  useEffect(() => {
    loadConversation()
  }, [loadConversation])

  const handleSend = async () => {
    if (!messageText.trim() || !conversation) return

    setSending(true)
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          sender_type: 'homeowner',
          content: messageText
        })

      if (insertError) throw insertError

      setMessageText('')
      await loadConversation()
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <Card className="max-w-sm p-8 text-center">
          <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-lg)' }}>{error || 'Conversation not found'}</p>
          <Link href="/homeowner/messages">
            <Button className="w-full">Back to Messages</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--color-surface-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 1.5rem'
      }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/homeowner/messages" style={{ color: 'var(--color-text-secondary)' }} className="hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            {conversation.contractor.profiles?.avatar_url && (
              <img
                src={conversation.contractor.profiles.avatar_url}
                alt={conversation.contractor.business_name}
                className="w-10 h-10 rounded-lg object-cover inline-block mr-3"
              />
            )}
            <h1 style={{
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
              display: 'inline-block'
            }}>
              {conversation.contractor.business_name}
            </h1>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-6 overflow-y-auto">
        {error && (
          <Card className="p-4 mb-6" style={{ borderColor: 'var(--color-error)', borderWidth: '1px' }}>
            <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{error}</p>
          </Card>
        )}

        <div className="flex flex-col gap-4">
          {conversation.messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-lg)' }}>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            conversation.messages.map((msg, idx) => {
              const isFromHomeowner = msg.sender_type === 'homeowner'
              return (
                <div
                  key={msg.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: isFromHomeowner ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    backgroundColor: isFromHomeowner ? 'var(--color-brand)' : 'var(--color-surface-secondary)',
                    color: isFromHomeowner ? 'white' : 'var(--color-text-primary)',
                    padding: 'var(--space-md) var(--space-lg)',
                    borderRadius: 'var(--radius-lg)',
                    wordWrap: 'break-word'
                  }}>
                    <p style={{
                      fontSize: 'var(--text-sm)',
                      lineHeight: 'var(--leading-relaxed)',
                      margin: 0
                    }}>
                      {msg.content}
                    </p>
                    <p style={{
                      fontSize: 'var(--text-xs)',
                      opacity: isFromHomeowner ? 0.8 : 0.6,
                      marginTop: 'var(--space-xs)',
                      margin: 'var(--space-xs) 0 0 0'
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderTop: '1px solid var(--color-border)',
        padding: '1rem 1.5rem'
      }}>
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: 'var(--space-md)',
              backgroundColor: 'var(--color-surface-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-primary)'
            }}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
            style={{ padding: 'var(--space-md) var(--space-lg)' }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ConversationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <ConversationContent />
    </Suspense>
  )
}
