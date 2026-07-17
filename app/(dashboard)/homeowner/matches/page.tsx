'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import SwipeCard, { type Match } from './swipe-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'

// J3: Swipe/Heart/Save Cards (Tinder-style, 80%+ gate)
// Only show matches with score >= 0.8 (80% compatibility)

function MatchesContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const router = useRouter()

  const [matches, setMatches] = useState<Match[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)

  const loadMatches = useCallback(async () => {
    try {
      if (!projectId) return

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // J3 Gate: Only show matches with 80%+ compatibility
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          id,
          match_score,
          match_reasoning,
          contractor:contractor_id(
            id,
            business_name,
            rating,
            review_count,
            verified_job_count,
            years_in_business,
            profiles(avatar_url)
          )
        `)
        .eq('project_id', projectId)
        .eq('homeowner_id', user.id)
        .gte('match_score', 0.8)
        .order('match_score', { ascending: false })

      if (matchError) throw matchError
      setMatches((matchData || []) as unknown as Match[])
    } catch (err: any) {
      setError(err.message || 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  useEffect(() => {
    if (!projectId) {
      router.push('/homeowner')
      return
    }
    loadMatches()
  }, [projectId, router, loadMatches])

  const handleHeart = async (matchId: string) => {
    setActing(true)
    try {
      const supabase = createClient()
      await supabase
        .from('matches')
        .update({ liked_at: new Date().toISOString() })
        .eq('id', matchId)
      setCurrentIndex(prev => prev + 1)
    } catch (err: any) {
      setError(err.message || 'Failed to like match')
    } finally {
      setActing(false)
    }
  }

  const handlePass = async (matchId: string) => {
    setActing(true)
    try {
      const supabase = createClient()
      await supabase
        .from('matches')
        .update({ passed_at: new Date().toISOString() })
        .eq('id', matchId)
      setCurrentIndex(prev => prev + 1)
    } catch (err: any) {
      setError(err.message || 'Failed to pass match')
    } finally {
      setActing(false)
    }
  }

  const handleSave = async (matchId: string) => {
    setActing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const match = matches.find(m => m.id === matchId)
      if (!match) return

      const { data: existing } = await supabase
        .from('saved_contractors')
        .select('id')
        .eq('user_id', user.id)
        .eq('contractor_id', match.contractor.id)
        .single()

      if (existing) {
        await supabase
          .from('saved_contractors')
          .delete()
          .eq('user_id', user.id)
          .eq('contractor_id', match.contractor.id)
      } else {
        await supabase
          .from('saved_contractors')
          .insert({ user_id: user.id, contractor_id: match.contractor.id })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save contractor')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading matches...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <Card className="max-w-sm p-6 text-center">
          <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-lg)' }}>{error}</p>
          <Link href="/homeowner">
            <Button className="w-full">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <Card className="max-w-sm p-8 text-center">
          <h2 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-md)'
          }}>
            No matches yet
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
            We're still finding contractors who match your needs. Check back soon!
          </p>
          <Link href="/homeowner">
            <Button className="w-full">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const currentMatch = matches[currentIndex]

  if (!currentMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <Card className="max-w-sm p-8 text-center">
          <h2 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-md)'
          }}>
            All caught up!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
            You've reviewed all available matches. New contractors will appear as they join!
          </p>
          <Link href="/homeowner">
            <Button className="w-full">Back to Dashboard</Button>
          </Link>
        </Card>
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
            Your Matches
          </h1>
          <span style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-tertiary)'
          }}>
            {currentIndex + 1} of {matches.length}
          </span>
        </div>
      </header>

      <SwipeCard
        match={currentMatch}
        onHeart={handleHeart}
        onPass={handlePass}
        onSave={handleSave}
        saving={acting}
        passing={acting}
      />
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
