'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google'
import { MapPin, Star, ShieldCheck, MessageCircle, Clock } from 'lucide-react'

const fraunces = Fraunces({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-fraunces' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-mono' })

// Design tokens
const C = {
  navy: "var(--color-surface-primary)",
  navy2: "var(--color-surface-secondary)",
  offWhite: 'var(--color-text-inverse)',
  amber: "var(--color-brand)",
  slate: "var(--color-text-secondary)",
  green: "var(--color-success)",
  line: "var(--color-border-strong)",
  textDim: "var(--color-text-tertiary)"
}

const THRESHOLD = 90

interface Candidate {
  id: string
  business_name: string
  bio: string
  rating: number
  review_count: number
  years_in_business: number
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
  const [firstName, setFirstName] = useState('there')
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [estimate, setEstimate] = useState<{ range_low: number | null; range_high: number | null } | null>(null)
  const [matchCount, setMatchCount] = useState(0)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [index, setIndex] = useState(0)
  const [matchedContractor, setMatchedContractor] = useState<MatchedContractor | null>(null)
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [matchModal, setMatchModal] = useState<Candidate | null>(null)

  // Drag state
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)
  const startPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('full_name, zip_code').eq('id', user.id).single()
      setFirstName(prof?.full_name?.split(' ')[0] ?? 'there')

      // Most recent active project
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
          const cp = matchedRow.contractor_profiles as unknown as MatchedContractor
          setMatchedContractor(cp)
        }

        // Candidate swipe deck
        try {
          const res = await fetch(`/api/projects/${proj.id}/candidates`)
          if (res.ok) {
            const json = await res.json()
            setCandidates(json.candidates ?? [])
          }
        } catch { /* noop */ }

        // Neighborhood feed
        const zip = proj.zip_code ?? prof?.zip_code
        if (zip) {
          try {
            const fres = await fetch(`/api/feed?zip=${zip}`)
            if (fres.ok) {
              const fjson = await fres.json()
              setFeed(fjson.entries ?? [])
            }
          } catch { /* noop */ }
        }
      }

      setLoading(false)
    }
    load()
  }, [router])

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
    if (!project) return
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
      if (res.ok) {
        const json = await res.json()
        if (direction === 'yes' && json.matched) {
          setMatchModal(card)
          setMatchCount(c => c + 1)
        }
      }
    } catch { /* noop */ }
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
  const absX = Math.abs(dragX)
  const stampOpacity = Math.min(1, absX / 70)
  const stamp = dragX > 30 ? 'YES' : dragX < -30 ? 'PASS' : null

  if (loading) {
    return (
      <div className={inter.variable} style={{ minHeight: '100vh', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textDim, fontFamily: 'var(--font-inter), sans-serif' }}>
        Loading…
      </div>
    )
  }

  return (
    <div
      className={`${fraunces.variable} ${inter.variable} ${mono.variable}`}
      style={{ minHeight: '100vh', background: C.navy, color: C.offWhite, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
    >
      {/* Header + nav */}
      <header style={{ borderBottom: `1px solid ${C.line}`, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: C.navy, zIndex: 20 }}>
        <div style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>
          Ground<span style={{ color: C.amber }}>work</span>
        </div>
        <nav style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Dashboard', href: '/homeowner', active: true },
            { label: 'Matches', href: '/homeowner/matches' },
            { label: 'Messages', href: '/homeowner/messages' },
            { label: 'Neighborhood', href: project?.zip_code ? `/feed/${project.zip_code}` : '/homeowner' }
          ].map(t => (
            <Link key={t.label} href={t.href} style={{
              padding: '7px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: 'none',
              color: t.active ? C.offWhite : C.textDim,
              background: t.active ? C.navy2 : 'transparent',
              border: `1px solid ${t.active ? C.line : 'transparent'}`
            }}>
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 28px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
        {/* Main column */}
        <div>
          {!project ? (
            <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 20, padding: '56px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 18 }}>🔨</div>
              <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 26, fontWeight: 700, marginBottom: 10 }}>Start your first estimate</h1>
              <p style={{ color: C.textDim, fontSize: 15, marginBottom: 26, maxWidth: 380, marginInline: 'auto', lineHeight: 1.6 }}>
                Describe your project and get an instant AI estimate, then swipe through trusted local contractors.
              </p>
              <Link href="/homeowner/estimate" style={{
                display: 'inline-block', padding: '13px 26px', borderRadius: 100, background: C.amber,
                color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none'
              }}>
                Get a free estimate
              </Link>
            </div>
          ) : (
            <>
              {/* Welcome card */}
              <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 20, padding: 26, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div>
                    <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
                      Welcome back, {firstName}
                    </h1>
                    <p style={{ color: C.textDim, fontSize: 14, lineHeight: 1.5, maxWidth: 460 }}>
                      {project.ai_project_type ? `${project.ai_project_type} · ` : ''}{project.description}
                    </p>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textDim, whiteSpace: 'nowrap' }}>
                    <MapPin style={{ width: 13, height: 13 }} /> {project.zip_code}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 22 }}>
                  <div style={{ flex: 1, background: C.navy, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ color: C.textDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Estimate range</div>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 20, fontWeight: 600 }}>
                      {estimate?.range_low != null ? `${money(estimate.range_low)}–${money(estimate.range_high)}` : '—'}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: C.navy, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ color: C.textDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Matches</div>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 20, fontWeight: 600, color: matchCount > 0 ? C.green : C.offWhite }}>
                      {matchCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Swipe deck */}
              <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
                Contractors near you
              </h2>

              {!current ? (
                <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
                  <div style={{ fontSize: 34, marginBottom: 14 }}>✓</div>
                  <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>You&apos;re all caught up</p>
                  <p style={{ color: C.textDim, fontSize: 14, maxWidth: 300, marginInline: 'auto', lineHeight: 1.6 }}>
                    No more contractors to review right now. Check back soon as more join your area.
                  </p>
                </div>
              ) : (
                <div style={{ position: 'relative', maxWidth: 420, height: 380, margin: '0 auto' }}>
                  {/* Stacked background card */}
                  {candidates[index + 1] && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 20, background: C.navy2,
                      border: `1px solid ${C.line}`,
                      transform: 'scale(0.96) translateY(10px)', zIndex: 1, pointerEvents: 'none'
                    }} />
                  )}

                  {/* Active card */}
                  <div
                    onPointerDown={e => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); onDown(e.clientX, e.clientY) }}
                    onPointerMove={e => onMove(e.clientX, e.clientY)}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 20, background: C.navy2,
                      border: `1px solid ${C.line}`, padding: 26, zIndex: 10,
                      display: 'flex', flexDirection: 'column',
                      cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none', willChange: 'transform',
                      transform: exiting
                        ? `translateX(${exiting === 'right' ? '140%' : '-140%'}) rotate(${exiting === 'right' ? 20 : -20}deg)`
                        : `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)`,
                      transition: exiting ? 'transform 0.3s ease-out' : isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)'
                    }}
                  >
                    {/* Stamp */}
                    {stamp && (
                      <div style={{
                        position: 'absolute', top: 22,
                        ...(stamp === 'YES' ? { left: 22 } : { right: 22 }),
                        border: `3px solid ${stamp === 'YES' ? C.green : C.amber}`,
                        color: stamp === 'YES' ? C.green : C.amber,
                        padding: '4px 12px', borderRadius: 8, fontSize: 15, fontWeight: 800, letterSpacing: '0.12em',
                        transform: stamp === 'YES' ? 'rotate(-14deg)' : 'rotate(14deg)',
                        opacity: stampOpacity, pointerEvents: 'none'
                      }}>
                        {stamp}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.amber }}>
                        {current.subscription_tier === 'paid_unlimited' ? 'Featured' : 'Verified pro'}
                      </span>
                      {current.trust_score != null && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.green, fontWeight: 700 }}>
                          <ShieldCheck style={{ width: 14, height: 14 }} /> Trust {current.trust_score}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 23, fontWeight: 700, marginBottom: 8 }}>
                      {current.business_name}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: C.textDim, fontSize: 13, marginBottom: 14 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.offWhite }}>
                        <Star style={{ width: 13, height: 13, fill: C.amber, color: C.amber }} /> {current.rating?.toFixed(1) ?? '—'}
                        <span style={{ color: C.textDim }}>({current.review_count})</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock style={{ width: 13, height: 13 }} /> {current.years_in_business} yr
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin style={{ width: 13, height: 13 }} /> {current.distance_miles} mi
                      </span>
                    </div>

                    <p style={{ color: '#C0CDD8', fontSize: 14, lineHeight: 1.65, flex: 1, overflow: 'hidden' }}>
                      {current.bio || 'A trusted local professional ready to take on your project.'}
                    </p>

                    <div style={{ display: 'flex', gap: 18, background: C.navy, borderRadius: 12, padding: '12px 16px', marginTop: 16, marginBottom: 16 }}>
                      <div>
                        <div style={{ color: C.textDim, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Verified jobs</div>
                        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 17, fontWeight: 600 }}>{current.verified_job_count}</div>
                      </div>
                      <div>
                        <div style={{ color: C.textDim, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Plan</div>
                        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 17, fontWeight: 600, textTransform: 'capitalize' }}>{current.subscription_tier}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); doSwipe('left') }}
                        style={{ flex: 1, padding: '11px 0', borderRadius: 100, background: 'rgba(232,114,44,0.12)', color: C.amber, border: '1px solid rgba(232,114,44,0.3)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ← Pass
                      </button>
                      <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); doSwipe('right') }}
                        style={{ flex: 1, padding: '11px 0', borderRadius: 100, background: 'rgba(46,139,87,0.14)', color: C.green, border: '1px solid rgba(46,139,87,0.3)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Interested →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Trust panel */}
          <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 18, padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Trust score</h3>
            {matchedContractor ? (
              <>
                <p style={{ color: C.textDim, fontSize: 12, marginBottom: 16 }}>{matchedContractor.business_name}</p>
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 42, fontWeight: 600, color: C.green, lineHeight: 1 }}>
                    {matchedContractor.trust_score ?? '—'}
                  </div>
                  <div style={{ color: C.textDim, fontSize: 11, marginTop: 4 }}>{matchedContractor.verified_job_count} verified jobs</div>
                </div>
                {[
                  { label: 'Estimate accuracy', value: matchedContractor.trust_accuracy },
                  { label: 'On-time completion', value: matchedContractor.trust_on_time },
                  { label: 'Dispute-free', value: matchedContractor.trust_dispute_free }
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: C.textDim }}>{row.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono), monospace', color: C.offWhite }}>{row.value ?? '—'}</span>
                    </div>
                    <div style={{ height: 6, background: C.navy, borderRadius: 100 }}>
                      <div style={{ height: '100%', width: `${row.value ?? 0}%`, background: C.green, borderRadius: 100 }} />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p style={{ color: C.textDim, fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
                Once you match with a contractor, their full trust breakdown — estimate accuracy, on-time completion, and dispute-free rate — appears here.
              </p>
            )}
          </div>

          {/* Neighborhood feed */}
          <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 18, padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Neighborhood activity</h3>
            {feed.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {feed.slice(0, 6).map(e => (
                  <div key={e.id} style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.amber, marginBottom: 4 }}>
                      {e.trade_category}
                    </div>
                    <p style={{ fontSize: 13, color: '#C0CDD8', lineHeight: 1.5 }}>{e.copy_line}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: C.textDim }}>
                      <span>{e.neighborhood_label}</span>
                      <span style={{ fontFamily: 'var(--font-mono), monospace' }}>{e.cost_range_label}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: C.textDim, fontSize: 13, lineHeight: 1.6 }}>
                No recent activity in your area yet. As projects complete nearby, they&apos;ll show up here.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Match modal */}
      {matchModal && (
        <div
          onClick={() => setMatchModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(6,10,14,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 22, padding: '38px 32px', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(46,139,87,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <MessageCircle style={{ width: 30, height: 30, color: C.green }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 24, fontWeight: 700, marginBottom: 10 }}>It&apos;s a match!</h2>
            <p style={{ color: C.textDim, fontSize: 14, lineHeight: 1.6, marginBottom: 26 }}>
              You and <strong style={{ color: C.offWhite }}>{matchModal.business_name}</strong> both said yes. You can now message each other to plan the work.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setMatchModal(null)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 100, background: 'transparent', color: C.textDim, border: `1px solid ${C.line}`, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Keep swiping
              </button>
              <Link href="/homeowner/chat" style={{ flex: 1, padding: '12px 0', borderRadius: 100, background: C.amber, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', lineHeight: '1.4' }}>
                Send a message
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
