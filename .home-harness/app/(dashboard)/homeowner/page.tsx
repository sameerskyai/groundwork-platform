'use client'

/**
 * Homeowner dashboard.
 *
 * THREE fixes live here.
 *
 * 1. TASK 5 — ONE primary action. The page used to offer a swipe deck, a nav
 *    bar, a match modal and an estimate link with equal weight. It now computes
 *    a single `nextStep` from the journey stage and renders exactly one
 *    accent-filled button for it. Everything else is a secondary control.
 *      no project            -> start an estimate
 *      project, no thread    -> see your matches
 *      matched               -> open the conversation
 *
 * 2. BUG #4 — the swipe handler now creates the `conversations` row the moment
 *    /api/swipes reports a mutual match (see _lib/conversations.ts for why the
 *    call lives here rather than in the API route), and the match modal links
 *    to that real thread instead of a bare /homeowner/chat with no match param.
 *
 * 3. COLOUR — the old palette map read `navy: var(--color-surface-primary)` and
 *    `offWhite: var(--color-text-inverse)`. Both resolve to --color-base
 *    (pure white) under the drawing set, so the whole page rendered white
 *    text on a white background. Every value here now comes from the eleven
 *    tokens with a real contrast pairing, and there are no hex literals.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Star, ShieldCheck, MessageCircle, Clock, ArrowRight } from 'lucide-react'
import { Notice, Loading } from '../_components/Feedback'
import { friendlyError, type FriendlyError } from '../_lib/errors'
import { ensureConversation } from '../_lib/conversations'

const THRESHOLD = 90

interface Candidate {
  id: string
  business_name: string
  bio: string
  rating: number
  review_count: number
  years_in_business: number | null
  trust_score: number | null
  verified_job_count: number
  subscription_tier: string
  distance_miles: number
  zip_code: string
}

interface ProjectInfo {
  id: string
  description: string
  ai_project_type: string | null
  zip_code: string
}

interface MatchedContractor {
  business_name: string
  trust_score: number | null
  trust_accuracy: number | null
  trust_on_time: number | null
  trust_dispute_free: number | null
  verified_job_count: number
}

interface FeedEntry {
  id: string
  trade_category: string
  project_type_label: string
  cost_range_label: string
  copy_line: string
  neighborhood_label: string | null
}

function money(n: number | null | undefined) {
  if (n == null) return '—'
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`
}

export default function HomeownerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [firstName, setFirstName] = useState('there')
  const [userId, setUserId] = useState<string | null>(null)
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [estimate, setEstimate] = useState<{ range_low: number | null; range_high: number | null } | null>(null)
  const [matchCount, setMatchCount] = useState(0)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [index, setIndex] = useState(0)
  const [matchedContractor, setMatchedContractor] = useState<MatchedContractor | null>(null)
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [matchModal, setMatchModal] = useState<{ card: Candidate; conversationId: string | null } | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [threadName, setThreadName] = useState<string | null>(null)

  // Drag state
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)
  const startPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUserId(user.id)

        const { data: prof } = await supabase
          .from('profiles').select('full_name, zip_code').eq('id', user.id).single()
        setFirstName(prof?.full_name?.split(' ')[0] ?? 'there')

        // An open thread is the strongest journey signal, so it is loaded first.
        const { data: convRows } = await supabase
          .from('conversations')
          .select('id, created_at, contractor:contractor_id(business_name)')
          .eq('homeowner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const conv = (convRows ?? [])[0] as Record<string, any> | undefined
        if (conv) {
          setThreadId(conv.id)
          setThreadName(conv.contractor?.business_name ?? 'your contractor')
        }

        const { data: proj } = await supabase
          .from('projects')
          .select('id, description, ai_project_type, zip_code')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (proj) {
          setProject(proj)

          const [{ data: est }, { data: matchRows }, { data: matchedRow }] = await Promise.all([
            supabase.from('estimates').select('range_low, range_high').eq('project_id', proj.id).maybeSingle(),
            supabase.from('matches').select('id').eq('project_id', proj.id).eq('status', 'pending'),
            supabase
              .from('matches')
              .select('contractor_profiles(business_name, trust_score, trust_accuracy, trust_on_time, trust_dispute_free, verified_job_count)')
              .eq('project_id', proj.id)
              .eq('status', 'pending')
              .order('matched_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          ])

          setEstimate(est ?? null)
          setMatchCount(matchRows?.length ?? 0)
          if (matchedRow?.contractor_profiles) {
            setMatchedContractor(matchedRow.contractor_profiles as unknown as MatchedContractor)
          }

          try {
            const res = await fetch(`/api/projects/${proj.id}/candidates`)
            if (res.ok) setCandidates((await res.json()).candidates ?? [])
          } catch { /* the deck is optional; the page still works without it */ }

          const zip = proj.zip_code ?? prof?.zip_code
          if (zip) {
            try {
              const fres = await fetch(`/api/feed?zip=${zip}`)
              if (fres.ok) setFeed((await fres.json()).entries ?? [])
            } catch { /* the feed is optional */ }
          }
        }
      } catch (err) {
        setError(
          friendlyError(err, {
            title: 'We could not load your dashboard',
            detail: 'Nothing has been lost. Reload the page — if it keeps failing, your estimate and messages are still reachable from the links below.'
          })
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  // ---------------------------------------------------------- journey stage
  // Exactly one primary action, chosen by where the person actually is.
  const nextStep = !project
    ? {
        eyebrow: 'Step 1 of 3',
        title: 'Start with an estimate',
        body: 'Describe the work in a sentence or two. You get a real cost range in under a minute, and that range is what contractors respond to.',
        cta: { label: 'Get a free estimate', href: '/homeowner/estimate' }
      }
    : threadId
      ? {
          eyebrow: 'You matched',
          title: `Keep talking to ${threadName}`,
          body: 'You both said yes, so the thread is open. Agreeing a start date and a budget range is what turns a match into a job.',
          cta: { label: 'Open the conversation', href: `/homeowner/messages/${threadId}` }
        }
      : {
          eyebrow: 'Step 2 of 3',
          title: matchCount > 0 ? `${matchCount} contractors are waiting on you` : 'Pick who you want to talk to',
          body: 'We only surface contractors above 80% compatibility with your project. Say yes to the ones you would actually hire — they see nothing until you do.',
          cta: { label: 'See your matches', href: `/homeowner/matches?project=${project.id}` }
        }

  const current = candidates[index]

  function advance(dir: 'left' | 'right') {
    setExiting(dir)
    setTimeout(() => {
      setIndex(i => i + 1)
      setDragX(0)
      setDragY(0)
      setExiting(null)
    }, 300)
  }

  async function recordSwipe(card: Candidate, direction: 'yes' | 'pass') {
    if (!project || !userId) return
    try {
      const res = await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          contractor_id: card.id,
          direction,
          swiped_by: 'homeowner'
        })
      })
      if (!res.ok) return
      const json = await res.json()
      if (direction !== 'yes' || !json.matched) return

      setMatchCount(c => c + 1)

      // BUG #4: the conversation is created HERE, at the moment the match
      // becomes mutual. Before this, no conversation row was ever written by
      // the app and the inbox could only show seeded threads.
      const supabase = createClient()
      const conversationId = await ensureConversation(supabase, {
        homeownerId: userId,
        contractorId: card.id,
        matchId: json.match_id ?? null
      })
      if (conversationId) {
        setThreadId(conversationId)
        setThreadName(card.business_name)
      }
      setMatchModal({ card, conversationId })
    } catch { /* a failed swipe must not break the deck */ }
  }

  function doSwipe(dir: 'left' | 'right') {
    if (!current || exiting) return
    recordSwipe(current, dir === 'right' ? 'yes' : 'pass')
    advance(dir)
  }

  function onDown(x: number, y: number) {
    if (exiting) return
    startPos.current = { x, y }
    setIsDragging(true)
  }
  function onMove(x: number, y: number) {
    if (!isDragging) return
    setDragX(x - startPos.current.x)
    setDragY((y - startPos.current.y) * 0.25)
  }
  function onUp() {
    if (!isDragging) return
    setIsDragging(false)
    if (dragX > THRESHOLD) doSwipe('right')
    else if (dragX < -THRESHOLD) doSwipe('left')
    else { setDragX(0); setDragY(0) }
  }

  const rotation = dragX * 0.05
  const stampOpacity = Math.min(1, Math.abs(dragX) / 70)
  const stamp = dragX > 30 ? 'YES' : dragX < -30 ? 'PASS' : null

  if (loading) return <Loading what="Loading your dashboard" />

  const card = {
    background: 'var(--color-base)',
    border: '1px solid var(--color-line)',
    borderRadius: 'var(--radius-card)'
  } as const

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-base)', color: 'var(--color-ink)' }}>
      {/* Header + nav. Every destination carries the param it needs to land. */}
      <header
        style={{
          borderBottom: '1px solid var(--color-line)',
          padding: 'var(--space-2) var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          background: 'var(--color-base)',
          zIndex: 20
        }}
      >
        <div style={{ fontSize: 'var(--type-4)', fontWeight: 700, letterSpacing: 'var(--tracking-display)' }}>
          Lay<span style={{ color: 'var(--color-accent)' }}>work</span>
        </div>
        <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'Dashboard', href: '/homeowner', active: true },
            { label: 'Matches', href: project ? `/homeowner/matches?project=${project.id}` : '/homeowner/estimate' },
            { label: 'Messages', href: '/homeowner/messages' },
            { label: 'Neighbourhood', href: '/homeowner/communities' },
            { label: 'Saved', href: '/homeowner/saved' }
          ].map(t => (
            <Link
              key={t.label}
              href={t.href}
              aria-current={t.active ? 'page' : undefined}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-control)',
                fontSize: 'var(--type-2)',
                fontWeight: 500,
                textDecoration: 'none',
                color: t.active ? 'var(--color-ink)' : 'var(--color-ink-2)',
                background: t.active ? 'var(--color-base-alt)' : 'transparent',
                border: `1px solid ${t.active ? 'var(--color-line)' : 'transparent'}`
              }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: 'var(--space-4) var(--space-3)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 340px)',
          gap: 'var(--space-3)',
          alignItems: 'start'
        }}
        className="dash-grid"
      >
        <div>
          {error && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <Notice error={error} />
            </div>
          )}

          {/* ---------------- THE one primary action ---------------- */}
          <section
            style={{
              background: 'var(--color-base-alt)',
              border: '1px solid var(--color-line)',
              borderLeft: '3px solid var(--color-accent)',
              borderRadius: 'var(--radius-card)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-3)'
            }}
          >
            <p className="annotation" style={{ marginBottom: 'var(--space-1)' }}>{nextStep.eyebrow}</p>
            <h1
              style={{
                margin: '0 0 var(--space-1) 0',
                fontSize: 'var(--type-6)',
                lineHeight: 'var(--leading-display)',
                letterSpacing: 'var(--tracking-display)',
                fontWeight: 700,
                color: 'var(--color-ink)'
              }}
            >
              {nextStep.title}
            </h1>
            <p
              style={{
                margin: '0 0 var(--space-3) 0',
                fontSize: 'var(--type-3)',
                lineHeight: 'var(--leading-body)',
                color: 'var(--color-ink-2)',
                maxWidth: '54ch'
              }}
            >
              {nextStep.body}
            </p>
            <Link href={nextStep.cta.href} className="btn-primary" style={{ textDecoration: 'none' }}>
              {nextStep.cta.label}
              <ArrowRight style={{ width: 15, height: 15, marginLeft: 8 }} aria-hidden="true" />
            </Link>
          </section>

          {project && (
            <>
              <section style={{ ...card, padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <div>
                    <p className="annotation" style={{ marginBottom: 4 }}>Your project</p>
                    <p style={{ margin: 0, fontSize: 'var(--type-3)', color: 'var(--color-ink)', maxWidth: '52ch' }}>
                      Welcome back, {firstName}. {project.ai_project_type ? `${project.ai_project_type} · ` : ''}
                      {project.description}
                    </p>
                  </div>
                  <span className="annotation" style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                    <MapPin style={{ width: 12, height: 12 }} aria-hidden="true" /> {project.zip_code}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {[
                    {
                      label: 'Estimate range',
                      value: estimate?.range_low != null ? `${money(estimate.range_low)}–${money(estimate.range_high)}` : '—'
                    },
                    { label: 'Matches', value: String(matchCount) }
                  ].map(tile => (
                    <div
                      key={tile.label}
                      style={{
                        flex: '1 1 140px',
                        background: 'var(--color-base-alt)',
                        border: '1px solid var(--color-line)',
                        borderRadius: 'var(--radius-card)',
                        padding: 'var(--space-2)'
                      }}
                    >
                      <div className="annotation" style={{ marginBottom: 4 }}>{tile.label}</div>
                      <div
                        className="tabular"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-5)', fontWeight: 600, color: 'var(--color-ink)' }}
                      >
                        {tile.value}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <h2
                className="annotation"
                style={{ marginBottom: 'var(--space-2)' }}
              >
                Contractors near you
              </h2>

              {!current ? (
                <div style={{ ...card, padding: 'var(--space-4)', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--type-4)', fontWeight: 600, color: 'var(--color-ink)' }}>
                    You have seen everyone nearby
                  </p>
                  <p
                    style={{
                      margin: '0 auto var(--space-3) auto',
                      maxWidth: '44ch',
                      fontSize: 'var(--type-3)',
                      lineHeight: 'var(--leading-body)',
                      color: 'var(--color-ink-2)'
                    }}
                  >
                    Every contractor within range of ZIP {project.zip_code} who works on this kind of
                    job has been through this deck. New pros join weekly, and your existing matches
                    are still waiting.
                  </p>
                  <Link
                    href={`/homeowner/matches?project=${project.id}`}
                    className="btn-secondary"
                    style={{ textDecoration: 'none' }}
                  >
                    Review your matches
                  </Link>
                </div>
              ) : (
                <div style={{ position: 'relative', maxWidth: 420, height: 400, margin: '0 auto' }}>
                  {candidates[index + 1] && (
                    <div
                      style={{
                        position: 'absolute', inset: 0, ...card,
                        transform: 'scale(0.96) translateY(10px)', zIndex: 1, pointerEvents: 'none'
                      }}
                    />
                  )}

                  <div
                    onPointerDown={e => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); onDown(e.clientX, e.clientY) }}
                    onPointerMove={e => onMove(e.clientX, e.clientY)}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                    style={{
                      position: 'absolute', inset: 0, ...card,
                      padding: 'var(--space-3)', zIndex: 10,
                      display: 'flex', flexDirection: 'column',
                      cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none', willChange: 'transform',
                      transform: exiting
                        ? `translateX(${exiting === 'right' ? '140%' : '-140%'}) rotate(${exiting === 'right' ? 20 : -20}deg)`
                        : `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)`,
                      transition: exiting ? 'transform 0.3s var(--ease-precise)' : isDragging ? 'none' : 'transform 0.35s var(--ease-precise)'
                    }}
                  >
                    {stamp && (
                      <div
                        style={{
                          position: 'absolute', top: 20,
                          ...(stamp === 'YES' ? { left: 20 } : { right: 20 }),
                          border: `3px solid ${stamp === 'YES' ? 'var(--color-verified)' : 'var(--color-alert)'}`,
                          color: stamp === 'YES' ? 'var(--color-verified)' : 'var(--color-alert)',
                          padding: '4px 12px', borderRadius: 'var(--radius-control)',
                          fontFamily: 'var(--font-mono)', fontSize: 'var(--type-2)', fontWeight: 700,
                          letterSpacing: 'var(--tracking-mono)',
                          transform: stamp === 'YES' ? 'rotate(-14deg)' : 'rotate(14deg)',
                          opacity: stampOpacity, pointerEvents: 'none', background: 'var(--color-base)'
                        }}
                      >
                        {stamp}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <span className="annotation" style={{ color: 'var(--color-accent)' }}>
                        {current.subscription_tier === 'paid_unlimited' ? 'Featured' : 'Verified pro'}
                      </span>
                      {current.trust_score != null && (
                        <span
                          className="annotation"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-verified)' }}
                        >
                          <ShieldCheck style={{ width: 13, height: 13 }} aria-hidden="true" /> Trust {current.trust_score}
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        margin: '0 0 var(--space-1) 0',
                        fontSize: 'var(--type-5)',
                        fontWeight: 700,
                        letterSpacing: 'var(--tracking-display)',
                        color: 'var(--color-ink)'
                      }}
                    >
                      {current.business_name}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <span className="annotation" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star style={{ width: 12, height: 12, fill: 'var(--color-accent)', color: 'var(--color-accent)' }} aria-hidden="true" />
                        {current.rating != null ? current.rating.toFixed(1) : '—'} ({current.review_count})
                      </span>
                      {current.years_in_business != null && (
                        <span className="annotation" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock style={{ width: 12, height: 12 }} aria-hidden="true" /> {current.years_in_business} yr
                        </span>
                      )}
                      <span className="annotation" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin style={{ width: 12, height: 12 }} aria-hidden="true" /> {current.distance_miles} mi
                      </span>
                    </div>

                    <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--type-3)', lineHeight: 'var(--leading-body)', flex: 1, overflow: 'hidden' }}>
                      {current.bio || 'A local professional ready to take on your project.'}
                    </p>

                    <div
                      style={{
                        display: 'flex', gap: 'var(--space-3)', background: 'var(--color-base-alt)',
                        borderRadius: 'var(--radius-card)', padding: 'var(--space-2)',
                        margin: 'var(--space-2) 0'
                      }}
                    >
                      <div>
                        <div className="annotation" style={{ marginBottom: 2 }}>Verified jobs</div>
                        <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-4)', fontWeight: 600 }}>
                          {current.verified_job_count}
                        </div>
                      </div>
                      <div>
                        <div className="annotation" style={{ marginBottom: 2 }}>Plan</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-4)', fontWeight: 600, textTransform: 'capitalize' }}>
                          {current.subscription_tier}
                        </div>
                      </div>
                    </div>

                    {/* Secondary by design: the page's one primary action is above. */}
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); doSwipe('left') }}
                        className="btn-secondary"
                        style={{ flex: 1, cursor: 'pointer' }}
                      >
                        Pass
                      </button>
                      <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); doSwipe('right') }}
                        className="btn-secondary"
                        style={{ flex: 1, cursor: 'pointer', borderColor: 'var(--color-verified)', color: 'var(--color-verified)' }}
                      >
                        Interested
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ ...card, padding: 'var(--space-3)' }}>
            <h3 className="annotation" style={{ marginBottom: 'var(--space-2)' }}>Trust score</h3>
            {matchedContractor ? (
              <>
                <p style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--type-2)', color: 'var(--color-ink-2)' }}>
                  {matchedContractor.business_name}
                </p>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
                  <div
                    className="tabular"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-6)', fontWeight: 600, color: 'var(--color-verified)', lineHeight: 1 }}
                  >
                    {matchedContractor.trust_score ?? '—'}
                  </div>
                  <div className="annotation" style={{ marginTop: 4 }}>
                    {matchedContractor.verified_job_count} verified jobs
                  </div>
                </div>
                {[
                  { label: 'Estimate accuracy', value: matchedContractor.trust_accuracy },
                  { label: 'On-time completion', value: matchedContractor.trust_on_time },
                  { label: 'Dispute-free', value: matchedContractor.trust_dispute_free }
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: 'var(--space-1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="annotation">{row.label}</span>
                      <span className="annotation tabular" style={{ color: 'var(--color-ink)' }}>{row.value ?? '—'}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--color-base-alt)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-control)' }}>
                      <div style={{ height: '100%', width: `${row.value ?? 0}%`, background: 'var(--color-verified)' }} />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 'var(--type-2)', lineHeight: 'var(--leading-body)', color: 'var(--color-ink-2)' }}>
                Nothing here yet because you have not matched. Once you and a contractor both say
                yes, their estimate accuracy, on-time rate and dispute-free record appear here —
                measured from real finished jobs, not reviews.
              </p>
            )}
          </div>

          <div style={{ ...card, padding: 'var(--space-3)' }}>
            <h3 className="annotation" style={{ marginBottom: 'var(--space-2)' }}>Neighbourhood activity</h3>
            {feed.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {feed.slice(0, 6).map(e => (
                  <div key={e.id} style={{ borderBottom: '1px solid var(--color-line)', paddingBottom: 'var(--space-1)' }}>
                    <div className="annotation" style={{ color: 'var(--color-accent)', marginBottom: 4 }}>
                      {e.trade_category}
                    </div>
                    <p style={{ margin: 0, fontSize: 'var(--type-2)', color: 'var(--color-ink-2)', lineHeight: 'var(--leading-body)' }}>
                      {e.copy_line}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span className="annotation">{e.neighborhood_label}</span>
                      <span className="annotation tabular">{e.cost_range_label}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--type-2)', lineHeight: 'var(--leading-body)', color: 'var(--color-ink-2)' }}>
                  Nothing to show yet — this fills up when neighbours finish a job and choose to
                  share what it cost. Yours can be the first once your project is done.
                </p>
                <Link
                  href="/homeowner/communities"
                  style={{ fontSize: 'var(--type-2)', color: 'var(--color-accent)' }}
                >
                  Visit your neighbourhood →
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>

      {matchModal && (
        <div
          onClick={() => setMatchModal(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'var(--space-3)'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-base)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-modal)',
              padding: 'var(--space-5) var(--space-4)',
              maxWidth: 400,
              textAlign: 'center'
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--color-accent-wash)', color: 'var(--color-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-2)'
              }}
            >
              <MessageCircle style={{ width: 26, height: 26 }} />
            </div>
            <h2 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--type-5)', fontWeight: 700, letterSpacing: 'var(--tracking-display)' }}>
              It&apos;s a match
            </h2>
            <p style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--type-3)', lineHeight: 'var(--leading-body)', color: 'var(--color-ink-2)' }}>
              You and <strong style={{ color: 'var(--color-ink)' }}>{matchModal.card.business_name}</strong> both
              said yes. A private thread is now open between the two of you.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              <button onClick={() => setMatchModal(null)} className="btn-secondary" style={{ flex: 1, cursor: 'pointer' }}>
                Keep swiping
              </button>
              <Link
                href={matchModal.conversationId ? `/homeowner/messages/${matchModal.conversationId}` : '/homeowner/messages'}
                className="btn-primary"
                style={{ flex: 1, textDecoration: 'none' }}
              >
                Send a message
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .dash-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
