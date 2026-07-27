'use client'

/**
 * BUG #5 ROOT CAUSE + FIX.
 *
 * This page required `?project=<id>` and, if it was missing, an effect fired
 * `router.push('/homeowner')` — so every "Back to matches" link that did not
 * carry the param silently landed the user on the dashboard instead. Two
 * offenders were real: onboarding pushed a bare `/homeowner/matches`, and the
 * dashboard nav fell back to `/homeowner`.
 *
 * The fix is here rather than at each call site: when the param is absent the
 * page resolves the user's most recent active project itself and rewrites the
 * URL, so the page always lands where its label promises. It only shows an
 * empty state when the user genuinely has no project — and that state points at
 * the estimate, which is the thing that creates one.
 *
 * BUG #4 also touches this file: hearting a match is the accept action the UI
 * exposes here, so it opens the conversation thread (ensureConversation).
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import SwipeCard, { type Match } from './swipe-card'
import { Heart, Zap } from 'lucide-react'
import { Notice, EmptyState, Loading, PageHeader } from '../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../_lib/errors'
import { ensureConversation } from '../../_lib/conversations'

function MatchesContent() {
  const searchParams = useSearchParams()
  // Guard the literal strings "null"/"undefined": callers that interpolate an
  // absent id produce ?project=null, which is truthy and would 404 the lookup.
  const rawProject = searchParams.get('project')
  const paramProject = rawProject && rawProject !== 'null' && rawProject !== 'undefined' ? rawProject : null
  const router = useRouter()

  const [projectId, setProjectId] = useState<string | null>(paramProject)
  const [noProject, setNoProject] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [acting, setActing] = useState(false)
  const [openedThread, setOpenedThread] = useState<string | null>(null)

  const loadMatches = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // BUG #5: resolve the project instead of bouncing to /homeowner.
      let id = paramProject
      if (!id) {
        const { data: proj } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!proj?.id) {
          setNoProject(true)
          setLoading(false)
          return
        }
        id = proj.id
        // Keep the URL honest so a refresh or a shared link still works.
        router.replace(`/homeowner/matches?project=${id}`)
      }
      setProjectId(id)

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', id)
        .maybeSingle()

      if (projectError) throw projectError
      if (!project || project.user_id !== user.id) {
        setError({
          title: 'That project is not yours to open',
          detail: 'The link points at a project on a different account. Head back to your dashboard and open your own project from there.'
        })
        setLoading(false)
        return
      }

      // THE 80% gate. One scale, one threshold: match_score is 0–1
      // (matches.match_score is DECIMAL(4,3)), and 0.8 here is the same
      // number as MATCH_THRESHOLD in lib/agents/match-ranker-agent.ts, which
      // GET /api/projects/[id]/candidates enforces server-side before any of
      // these rows are written. The literal is repeated rather than imported
      // because importing that module would pull the Anthropic SDK into the
      // client bundle. The 0–100 variants of this gate (match-scorer.ts,
      // POST /api/projects/[id]/score) were deleted, not converted.
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
        .eq('project_id', id)
        .gte('match_score', 0.8)
        .order('match_score', { ascending: false })

      if (matchError) throw matchError
      setMatches((matchData || []) as unknown as Match[])
      setError(null)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not load your matches',
          detail: 'Your matches are still there — this is a problem reading them. Reload the page to try again.'
        })
      )
    } finally {
      setLoading(false)
    }
  }, [paramProject, router])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  const backToDashboard = { href: '/homeowner', label: 'Dashboard' }

  const handleHeart = async (matchId: string) => {
    setActing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const match = matches.find(m => m.id === matchId)

      await supabase
        .from('matches')
        .update({ liked_at: new Date().toISOString() })
        .eq('id', matchId)

      // BUG #4: hearting is the accept action this screen exposes, so it is
      // where the conversation gets created. Without this the thread would
      // never exist and Messages would stay empty forever.
      if (match?.contractor?.id) {
        const conversationId = await ensureConversation(supabase, {
          homeownerId: user.id,
          contractorId: match.contractor.id,
          matchId
        })
        if (conversationId) setOpenedThread(conversationId)
      }

      setCurrentIndex(prev => prev + 1)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not save that',
          detail: 'Your choice did not stick. Try the heart again — nothing else on this page was affected.'
        })
      )
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
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not save that',
          detail: 'Passing did not record. Try again — you will see the same contractor until it does.'
        })
      )
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
        .maybeSingle()

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
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not update your saved list',
          detail: 'The contractor is still on this screen, so nothing is lost. Try the bookmark again.'
        })
      )
    } finally {
      setActing(false)
    }
  }

  if (loading) return <Loading what="Loading your matches" />

  const shell = (children: React.ReactNode) => (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <PageHeader back={backToDashboard} title="Your matches" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>{children}</div>
    </div>
  )

  if (noProject) {
    return shell(
      <EmptyState
        glyph={<Zap style={{ width: 22, height: 22 }} />}
        title="No matches because there is no project yet"
        why="Matching starts from a project: we compare what you want built against what each contractor has actually finished. Two sentences and a ZIP code is enough to begin."
        action={{ label: 'Start a free estimate', href: '/homeowner/estimate' }}
        secondary={{ label: 'Back to dashboard', href: '/homeowner' }}
      />
    )
  }

  if (error && matches.length === 0) {
    return shell(
      <>
        <Notice error={error} />
        <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-1)' }}>
          <Link href="/homeowner" className="btn-primary" style={{ textDecoration: 'none' }}>
            Back to dashboard
          </Link>
        </div>
      </>
    )
  }

  if (matches.length === 0) {
    return shell(
      <EmptyState
        glyph={<Heart style={{ width: 22, height: 22 }} />}
        title="No matches above 80% yet"
        why="We only show contractors who clear 80% compatibility with your project, so this stays empty rather than filling with near-misses. Adding a budget range is the single fastest way to raise the scores."
        action={{ label: 'Set your budget', href: `/homeowner/budget?project=${projectId}` }}
        secondary={{ label: 'Back to dashboard', href: '/homeowner' }}
      />
    )
  }

  const currentMatch = matches[currentIndex]

  if (!currentMatch) {
    return shell(
      <EmptyState
        glyph={<Heart style={{ width: 22, height: 22 }} />}
        title="You have been through all of them"
        why={`All ${matches.length} contractors above the 80% line have had your answer. The ones you hearted can message you now; new pros are added as they join your area.`}
        action={
          openedThread
            ? { label: 'Open your conversation', href: `/homeowner/messages/${openedThread}` }
            : { label: 'Go to Messages', href: '/homeowner/messages' }
        }
        secondary={{ label: 'Back to dashboard', href: '/homeowner' }}
      />
    )
  }

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <PageHeader
        back={backToDashboard}
        title="Your matches"
        trailing={
          <span className="annotation tabular">
            {currentIndex + 1} / {matches.length}
          </span>
        }
      />

      {error && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-2) var(--space-3) 0' }}>
          <Notice error={error} />
        </div>
      )}

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
    <Suspense fallback={<Loading what="Loading your matches" />}>
      <MatchesContent />
    </Suspense>
  )
}
