'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Star, MapPin, CheckCircle, MessageCircle, Heart } from 'lucide-react'
import Link from 'next/link'

interface ContractorProfile {
  id: string
  user_id: string
  business_name: string
  bio: string
  rating: number
  review_count: number
  years_in_business: number
  subscription_tier: string
  service_radius_miles: number
  verified_job_count: number
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
    zip_code: string
  }
}

interface Review {
  id: string
  rating: number
  content: string
  reviewer_id: string
  created_at: string
  profiles: {
    full_name: string
  }
}

interface MatchContext {
  match_score: number
  match_reasoning: string
}

export default function ContractorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const contractorId = params.id as string

  const [contractor, setContractor] = useState<ContractorProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [matchContext, setMatchContext] = useState<MatchContext | null>(null)
  const [saved, setSaved] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Load contractor profile
        const { data: contractorData, error: contractorError } = await supabase
          .from('contractor_profiles')
          .select('*, profiles(id, full_name, avatar_url, zip_code)')
          .eq('id', contractorId)
          .single()

        if (contractorError || !contractorData) {
          setError('Contractor not found')
          setLoading(false)
          return
        }

        setContractor(contractorData as ContractorProfile)

        // Load reviews (5 most recent)
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*, profiles(full_name)')
          .eq('contractor_id', contractorData.id)
          .order('created_at', { ascending: false })
          .limit(5)

        setReviews(reviewData ?? [])

        // If user is viewing from a match, load match context
        if (user) {
          const { data: matchData } = await supabase
            .from('matches')
            .select('match_score, match_reasoning')
            .eq('contractor_id', contractorData.id)
            .single()

          if (matchData) {
            setMatchContext(matchData as MatchContext)
          }

          // Check if saved
          const { data: savedData } = await supabase
            .from('saved_contractors')
            .select('id')
            .eq('user_id', user.id)
            .eq('contractor_id', contractorId)
            .single()

          setSaved(!!savedData)
        }

        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'Failed to load profile')
        setLoading(false)
      }
    }

    load()
  }, [contractorId])

  const handleSave = async () => {
    if (!contractor) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      if (saved) {
        // Remove from saved
        await supabase
          .from('saved_contractors')
          .delete()
          .eq('user_id', user.id)
          .eq('contractor_id', contractorId)
        setSaved(false)
      } else {
        // Add to saved
        await supabase
          .from('saved_contractors')
          .insert({
            user_id: user.id,
            contractor_id: contractorId
          })
        setSaved(true)
      }
    } catch (err) {
      console.error('Failed to save contractor', err)
    }
  }

  const handleMessage = async () => {
    if (!contractor) return

    try {
      setSending(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Find or create match
      // For now, route to matches page to create match if needed
      router.push('/homeowner/matches')
    } catch (err) {
      console.error('Failed to message', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !contractor) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center p-8">
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
            Profile not found
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
            {error || 'This contractor profile is not available'}
          </p>
          <Link href="/homeowner/matches">
            <Button className="w-full">Back to matches</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--color-surface-primary)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 1.5rem'
      }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            style={{ color: 'var(--color-text-secondary)' }}
            className="hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
            Contractor profile
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Match context banner (if coming from matches) */}
        {matchContext && (
          <Card variant="accent">
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-brand)' }}>
                  {Math.round(matchContext.match_score * 100)}% match
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-xs)' }}>
                  {matchContext.match_reasoning}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Main profile card */}
        <Card>
          <div className="flex gap-4 mb-6">
            {contractor.profiles.avatar_url && (
              <img
                src={contractor.profiles.avatar_url}
                alt={contractor.business_name}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-xs)' }}>
                {contractor.business_name}
              </h2>
              <div className="flex items-center gap-2 mb-2">
                {contractor.rating > 0 && (
                  <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    <Star className="w-4 h-4" style={{ fill: 'var(--color-warning)' }} />
                    {contractor.rating.toFixed(1)} ({contractor.review_count})
                  </span>
                )}
                {contractor.subscription_tier === 'paid_unlimited' && (
                  <Badge variant="success">Pro</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <MapPin className="w-4 h-4" />
                  {contractor.profiles.zip_code}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {contractor.years_in_business} years exp
                </span>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Badge variant="info" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified
            </Badge>
            {contractor.verified_job_count > 0 && (
              <Badge variant="info">
                {contractor.verified_job_count} jobs completed
              </Badge>
            )}
          </div>

          {/* Bio */}
          {contractor.bio && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-lg)' }}>
              {contractor.bio}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[color:var(--color-border)]"
              style={{
                backgroundColor: saved ? 'var(--color-brand-lighter)' : 'var(--color-surface-primary)',
                color: saved ? 'var(--color-brand)' : 'var(--color-text-secondary)'
              }}
            >
              <Heart className="w-4 h-4" style={{ fill: saved ? 'var(--color-brand)' : 'none' }} />
              {saved ? 'Saved' : 'Save'}
            </button>
            <Button onClick={handleMessage} disabled={sending} className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              {sending ? 'Opening...' : 'Message'}
            </Button>
          </div>
        </Card>

        {/* Reviews section */}
        {reviews.length > 0 && (
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-lg)' }}>
              Recent reviews
            </h3>
            <div className="flex flex-col gap-3">
              {reviews.map(review => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3"
                          style={{
                            fill: i < review.rating ? 'var(--color-warning)' : 'var(--color-border)',
                            color: i < review.rating ? 'var(--color-warning)' : 'var(--color-border)'
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                      {(review.profiles as any).full_name}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                    {review.content}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
