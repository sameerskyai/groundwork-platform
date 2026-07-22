'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Send, ArrowLeft, CheckCircle, Upload } from 'lucide-react'
import Link from 'next/link'
import { CompletionOptIn } from '@/components/feed/CompletionOptIn'
import { ReviewForm } from '@/components/feed/ReviewForm'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  profiles: { full_name: string; avatar_url: string | null }
}

function ChatContent() {
  const searchParams = useSearchParams()
  const matchId = searchParams.get('match')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [userId, setUserId] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [matchProjectId, setMatchProjectId] = useState<string | null>(null)
  const [matchZip, setMatchZip] = useState<string>('')
  const [showComplete, setShowComplete] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showOptIn, setShowOptIn] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isHomeowner, setIsHomeowner] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!matchId) {
      setError('No conversation selected. Go back to matches.')
      setLoading(false)
      return
    }
    loadMessages()

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      try {
        setError('')
        setUserId(data.user?.id ?? '')
        // Load match context to know project ID, ZIP, and whether this user is the homeowner
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('project_id, projects(zip_code, user_id, status)')
          .eq('id', matchId)
          .single()

        if (matchError) {
          setError('Failed to load conversation.')
          setLoading(false)
          return
        }

        if (match) {
          const proj = match.projects as any
          setMatchProjectId(match.project_id)
          setMatchZip(proj?.zip_code ?? '')
          setIsHomeowner(proj?.user_id === data.user?.id)
          // If already completed show opt-in if not yet answered
          if (proj?.status === 'completed') setShowComplete(false)
        }
        setLoading(false)
      } catch (err) {
        setError('Failed to load conversation.')
        setLoading(false)
      }
    })

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      }, () => loadMessages())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    try {
      const res = await fetch(`/api/chat?matchId=${matchId}`)
      const data = await res.json()
      if (!res.ok) {
        setError('Failed to load messages.')
        return
      }
      setMessages(data.messages ?? [])
    } catch (err) {
      setError('Connection error. Try refreshing.')
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || !matchId || sending) return
    setSending(true)
    setSuggestions([])
    setInput('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, content })
    })

    const data = await res.json()
    if (data.suggestions) setSuggestions(data.suggestions)
    await loadMessages()
    setSending(false)
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Conversation unavailable</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link href={matchProjectId ? `/homeowner/matches?project=${matchProjectId}` : '/homeowner'}>
          <Button>Back to matches</Button>
        </Link>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
        <p className="text-gray-600">Loading conversation...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={matchProjectId ? `/homeowner/matches?project=${matchProjectId}` : '/homeowner'} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-gray-900">Chat</h1>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-4 flex flex-col gap-3 overflow-y-auto">
        {messages.map(m => {
          const isMe = m.sender_id === userId
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                isMe
                  ? 'gradient-brand text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm'
              }`}>
                {m.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Review form — shown after receipt upload, before opt-in prompt */}
      {showReview && matchId && matchProjectId && (
        <div className="max-w-2xl mx-auto w-full px-6 pb-3">
          <ReviewForm
            matchId={matchId}
            projectId={matchProjectId}
            onSubmitted={() => {
              setShowReview(false)
              setShowOptIn(true)
            }}
          />
        </div>
      )}

      {/* Opt-in prompt — shown once after job completion and review */}
      {showOptIn && matchProjectId && (
        <div className="max-w-2xl mx-auto w-full px-6 pb-3">
          <CompletionOptIn
            projectId={matchProjectId}
            zipCode={matchZip}
            onDone={() => setShowOptIn(false)}
          />
        </div>
      )}

      {/* Mark job complete — only shown to homeowner, one-time */}
      {isHomeowner && !showOptIn && !showReview && matchProjectId && (
        <div className="max-w-2xl mx-auto w-full px-6 pb-3">
          {showComplete ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-sm font-medium text-gray-800 mb-3">Upload receipt or invoice to verify completion</p>
              <label className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-[#FF6B35] transition-colors mb-3">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {receiptFile ? receiptFile.name : 'Choose file (PDF, JPG, PNG)'}
                </span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="sr-only"
                  onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <div className="flex gap-3">
                <Button
                  size="sm"
                  disabled={!receiptFile || completing}
                  onClick={async () => {
                    if (!receiptFile || !matchProjectId) return
                    setCompleting(true)
                    // Upload receipt to Supabase Storage
                    const { createClient: cc } = await import('@/lib/supabase/client')
                    const sb = cc()
                    const path = `receipts/${matchProjectId}/${receiptFile.name}`
                    const { data: uploadData } = await sb.storage.from('project-photos').upload(path, receiptFile, { upsert: true })
                    const receiptUrl = uploadData?.path
                      ? sb.storage.from('project-photos').getPublicUrl(uploadData.path).data.publicUrl
                      : ''
                    // Mark complete via API
                    const response = await fetch('/api/feed', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ projectId: matchProjectId, receiptUrl })
                    })
                    const result = await response.json()
                    setCompleting(false)
                    setShowComplete(false)
                    if (result.success) {
                      setShowReview(true)
                    }
                  }}
                >
                  {completing ? 'Submitting...' : 'Mark complete'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowComplete(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowComplete(true)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-600 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mark job as complete
            </button>
          )}
        </div>
      )}

      {/* Smart reply suggestions */}
      {suggestions.length > 0 && (
        <div className="max-w-2xl mx-auto w-full px-6 pb-2 flex gap-2 flex-wrap">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-sm bg-white border border-gray-200 rounded-full px-4 py-1.5 text-gray-700 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
          />
          <Button size="md" onClick={() => sendMessage(input)} disabled={!input.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <ChatContent />
    </Suspense>
  )
}
