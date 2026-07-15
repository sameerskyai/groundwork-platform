'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { LockedMatchesCTA } from '@/components/ui/LockedMatchesCTA'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Star, MapPin, MessageCircle, Loader2 } from 'lucide-react'

interface Match {
  id: string
  status: string
  match_score: number
  match_reasoning: string
  matched_at: string | null
  contractor_profiles: {
    id: string
    business_name: string
    bio: string
    rating: number
    review_count: number
    years_in_business: number
    subscription_tier: string
    profiles: { zip_code: string }
  }
}


interface ScoreResponse {
  matches: any[]
  matches_locked_count?: number
  limit_reached?: boolean
  user_tier?: string
}

function MatchesContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const [matches, setMatches] = useState<Match[]>([])
  const [matchesLocked, setMatchesLocked] = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const [userTier, setUserTier] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [running, setRunning] = useState(false)
  const router = useRouter()

  const loadMatches = useCallback(async () => {
    try {
      setError('')
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from('matches')
        .select(`*, contractor_profiles(*, profiles(zip_code))`)
        .eq('project_id', projectId)
        .order('match_score', { ascending: false })

      if (queryError) {
        setError('Failed to load matches. Try refreshing.')
        setMatches([])
      } else {
        setMatches(data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (!projectId) {
      router.push('/homeowner')
      return
    }
    loadMatches()
  }, [projectId, router, loadMatches])

  async function runMatching() {
    setRunning(true)
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    })
    const data = await res.json()
    setMatchesLocked(data.matches_locked_count || 0)
    setLimitReached(data.limit_reached || false)
    setUserTier(data.user_tier || 'free')
    await loadMatches()
    setRunning(false)
  }

  async function requestContractor(matchId: string) {
    const supabase = createClient()
    await supabase.from('matches').update({
      homeowner_swiped_at: new Date().toISOString(),
      status: 'contractor_review'
    }).eq('id', matchId)
    await loadMatches()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading your matches...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center p-8">
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
          Load Failed
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
          {error}
        </p>
        <Button onClick={() => window.location.reload()} className="w-full">
          Retry
        </Button>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <header style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 1.5rem'
      }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/homeowner" style={{ color: 'var(--color-text-secondary)' }} className="hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
            Your matches
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {!matches.length ? (
          <Card variant="accent" className="p-12 text-center">
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
              Find contractors for your project
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Our AI will match you with the best pros in your area.
            </p>
            <Button size="lg" onClick={runMatching} disabled={running}>
              {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finding matches...</> : 'Find my matches'}
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map(m => {
              const c = m.contractor_profiles
              const isMatched = m.status === 'matched'
              const isPending = m.status === 'contractor_review'
              const isNew = m.status === 'pending'

              return (
                <Card key={m.id} variant="interactive">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                          {c.business_name}
                        </span>
                        {c.subscription_tier === 'paid_unlimited' && (
                          <Badge variant="success">Pro</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {c.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5" style={{ fill: 'var(--color-warning)' }} />
                            {c.rating.toFixed(1)} ({c.review_count})
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {c.profiles?.zip_code}
                        </span>
                        <span>{c.years_in_business}yrs exp</span>
                      </div>
                      {c.bio && (
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }} className="line-clamp-2">
                          {c.bio}
                        </p>
                      )}
                      {m.match_reasoning && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-info)', marginTop: 'var(--space-md)' }}>
                          AI: {m.match_reasoning}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {Math.round(m.match_score * 100)}% match
                    </div>
                  </div>

                  <div style={{ marginTop: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    {isMatched && (
                      <Link href={`/homeowner/chat?match=${m.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      </Link>
                    )}
                    {isPending && (
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-warning)' }}>
                        Waiting for contractor...
                      </span>
                    )}
                    {isNew && (
                      <Button size="sm" variant="secondary" onClick={() => requestContractor(m.id)}>
                        Request this contractor
                      </Button>
                    )}
                    <Link href={`/contractors/${c.id}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-brand)' }} className="hover:opacity-80 transition-opacity">
                      View profile
                    </Link>
                  </div>
                </Card>
              )
            })}
            {matchesLocked > 0 && (
              <LockedMatchesCTA
                lockedCount={matchesLocked}
                onUpgradeClick={() => {
                  // Navigate to upgrade flow (TODO: implement payment)
                  console.log('Upgrade clicked', { userTier, limitReached })
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--color-text-secondary)' }}>
        Loading your matches...
      </div>
    }>
      <MatchesContent />
    </Suspense>
  )
}
