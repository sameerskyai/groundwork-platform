'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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

function MatchesContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const router = useRouter()

  const loadMatches = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('matches')
      .select(`*, contractor_profiles(*, profiles(zip_code))`)
      .eq('project_id', projectId)
      .order('match_score', { ascending: false })
    setMatches(data ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    if (!projectId) { router.push('/homeowner'); return }
    loadMatches()
  }, [projectId, router, loadMatches])

  async function runMatching() {
    setRunning(true)
    await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    })
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/homeowner" className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-gray-900">Your matches</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {!matches.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Find contractors for your project</h2>
            <p className="text-gray-500 mb-6">Our AI will match you with the best pros in your area.</p>
            <Button size="lg" onClick={runMatching} disabled={running}>
              {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finding matches...</> : 'Find my matches'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map(m => {
              const c = m.contractor_profiles
              const isMatched = m.status === 'matched'
              const isPending = m.status === 'contractor_review'
              const isNew = m.status === 'pending'

              return (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{c.business_name}</span>
                        {c.subscription_tier === 'growth' && (
                          <span className="text-xs bg-[#FF6B35] text-white px-2 py-0.5 rounded-full font-medium">Featured</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                        {c.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {c.rating.toFixed(1)} ({c.review_count})
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {c.profiles?.zip_code}
                        </span>
                        <span>{c.years_in_business}yrs exp</span>
                      </div>
                      {c.bio && <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{c.bio}</p>}
                      {m.match_reasoning && (
                        <p className="text-xs text-[#FF6B35] mt-2">AI: {m.match_reasoning}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      {Math.round(m.match_score * 100)}% match
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    {isMatched && (
                      <Link href={`/homeowner/chat?match=${m.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      </Link>
                    )}
                    {isPending && (
                      <span className="text-sm text-amber-600 font-medium">Waiting for contractor...</span>
                    )}
                    {isNew && (
                      <Button size="sm" variant="outline" onClick={() => requestContractor(m.id)}>
                        Request this contractor
                      </Button>
                    )}
                    <Link href={`/contractors/${c.id}`} className="text-sm text-gray-500 hover:text-[#FF6B35]">
                      View profile
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <MatchesContent />
    </Suspense>
  )
}
