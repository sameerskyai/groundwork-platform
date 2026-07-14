'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google'
import { MapPin, MessageCircle } from 'lucide-react'

const fraunces = Fraunces({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-fraunces' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-mono' })

const C = {
  navy: '#12181F',
  navy2: '#1B232D',
  offWhite: '#F7F5F1',
  amber: '#E8722C',
  slate: '#4A6B8A',
  green: '#2E8B57',
  line: '#2A3440',
  textDim: '#93A0AD'
}

const THRESHOLD = 90

interface ContractorProfile {
  id: string
  business_name: string | null
  subscription_tier: string
  subscription_active: boolean
  trust_score: number | null
  trust_accuracy: number | null
  trust_on_time: number | null
  trust_dispute_free: number | null
  verified_job_count: number
}

interface ProjectCard {
  id: string
  description: string
  ai_project_type: string | null
  ai_estimate_low: number | null
  ai_estimate_high: number | null
  budget_min: number | null
  budget_max: number | null
  zip_code: string
}

function money(n: number | null | undefined) {
  if (n == null) return '—'
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`
}

export default function ContractorDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ContractorProfile | null>(null)
  const [projects, setProjects] = useState<ProjectCard[]>([])
  const [index, setIndex] = useState(0)
  const [capped, setCapped] = useState(false)
  const [swipesRemaining, setSwipesRemaining] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [matchModal, setMatchModal] = useState<ProjectCard | null>(null)

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

      const { data: cp } = await supabase
        .from('contractor_profiles')
        .select('id, business_name, subscription_tier, subscription_active, trust_score, trust_accuracy, trust_on_time, trust_dispute_free, verified_job_count')
        .eq('user_id', user.id)
        .single()

      if (!cp) { setLoading(false); return }
      setProfile(cp)

      // Recent completed jobs count for this contractor
      const { data: matchIds } = await supabase
        .from('matches').select('id').eq('contractor_id', cp.id)
      const ids = (matchIds ?? []).map(m => m.id)
      if (ids.length) {
        const { count } = await supabase
          .from('completed_jobs')
          .select('id', { count: 'exact', head: true })
          .in('match_id', ids)
        setCompletedCount(count ?? 0)
      }

      // Project feed
      try {
        const res = await fetch(`/api/contractors/${cp.id}/feed`)
        if (res.ok) {
          const json = await res.json()
          if (json.capped) {
            setCapped(true)
            setSwipesRemaining(0)
          } else {
            setProjects(json.projects ?? [])
            setSwipesRemaining(json.swipes_remaining ?? 0)
          }
        }
      } catch { /* noop */ }

      setLoading(false)
    }
    load()
  }, [router])

  const current = projects[index]

  function advance(dir: 'left' | 'right') {
    setExiting(dir)
    setTimeout(() => {
      setIndex(i => i + 1)
      setDragX(0)
      setDragY(0)
      setExiting(null)
    }, 300)
  }

  async function recordSwipe(card: ProjectCard, direction: 'yes' | 'pass') {
    if (!profile) return
    try {
      const res = await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: card.id,
          contractor_id: profile.id,
          direction,
          swiped_by: 'contractor'
        })
      })
      if (res.status === 429) {
        setCapped(true)
        setSwipesRemaining(0)
        return
      }
      if (res.ok) {
        const json = await res.json()
        if (direction === 'yes') {
          setSwipesRemaining(n => Math.max(0, n - 1))
          if (json.matched) setMatchModal(card)
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
            { label: 'Dashboard', href: '/contractor', active: true },
            { label: 'Matches', href: '/contractor' },
            { label: 'Messages', href: '/contractor/chat' },
            { label: 'Profile', href: '/contractor/profile' }
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
          {/* Welcome card */}
          <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 20, padding: 26, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
                  {profile?.business_name ?? 'Your dashboard'}
                </h1>
                <p style={{ color: C.textDim, fontSize: 14 }}>Swipe through projects that match your trades and service area.</p>
              </div>
              {profile?.subscription_tier === 'paid_unlimited' && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: C.amber, color: '#fff' }}>Growth</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 22 }}>
              <div style={{ flex: 1, background: C.navy, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ color: C.textDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Plan</div>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 18, fontWeight: 600, textTransform: 'capitalize' }}>{profile?.subscription_tier ?? 'free'}</div>
              </div>
              <div style={{ flex: 1, background: C.navy, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ color: C.textDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Swipes left</div>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 18, fontWeight: 600, color: swipesRemaining > 0 ? C.offWhite : C.amber }}>{swipesRemaining}</div>
              </div>
              <div style={{ flex: 1, background: C.navy, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ color: C.textDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>To review</div>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 18, fontWeight: 600 }}>{Math.max(0, projects.length - index)}</div>
              </div>
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            Projects near you
          </h2>

          {capped ? (
            <div style={{ background: C.navy2, border: `1px solid ${C.amber}`, borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 34, marginBottom: 14 }}>🔒</div>
              <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>You&apos;ve reached your monthly limit</p>
              <p style={{ color: C.textDim, fontSize: 14, maxWidth: 340, marginInline: 'auto', lineHeight: 1.6, marginBottom: 22 }}>
                Your plan&apos;s monthly match limit is used up. Upgrade to Growth for more matches, or wait until next month&apos;s reset.
              </p>
              <Link href="/contractor/profile#subscription" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 100, background: C.amber, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Upgrade plan
              </Link>
            </div>
          ) : !current ? (
            <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 34, marginBottom: 14 }}>📭</div>
              <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>No projects right now</p>
              <p style={{ color: C.textDim, fontSize: 14, maxWidth: 320, marginInline: 'auto', lineHeight: 1.6 }}>
                When homeowners in your area post projects matching your trades, they&apos;ll appear here to swipe on.
              </p>
            </div>
          ) : (
            <div style={{ position: 'relative', maxWidth: 420, height: 380, margin: '0 auto' }}>
              {/* Stacked background card */}
              {projects[index + 1] && (
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.amber }}>
                    {current.ai_project_type ?? 'New project'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textDim }}>
                    <MapPin style={{ width: 13, height: 13 }} /> {current.zip_code}
                  </span>
                </div>

                <p style={{ color: '#C0CDD8', fontSize: 14.5, lineHeight: 1.65, flex: 1, overflow: 'hidden' }}>
                  {current.description}
                </p>

                <div style={{ display: 'flex', gap: 22, background: C.navy, borderRadius: 12, padding: '14px 16px', marginTop: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ color: C.textDim, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>AI estimate</div>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 19, fontWeight: 600 }}>
                      {current.ai_estimate_low != null ? `${money(current.ai_estimate_low)}–${money(current.ai_estimate_high)}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: C.textDim, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Homeowner budget</div>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 19, fontWeight: 600 }}>
                      {current.budget_min != null ? `${money(current.budget_min)}–${money(current.budget_max)}` : '—'}
                    </div>
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
        </div>

        {/* Right sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Trust breakdown */}
          <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 18, padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Your trust score</h3>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 42, fontWeight: 600, color: C.green, lineHeight: 1 }}>
                {profile?.trust_score ?? '—'}
              </div>
              <div style={{ color: C.textDim, fontSize: 11, marginTop: 4 }}>{profile?.verified_job_count ?? 0} verified jobs</div>
            </div>
            {[
              { label: 'Estimate accuracy', value: profile?.trust_accuracy },
              { label: 'On-time completion', value: profile?.trust_on_time },
              { label: 'Dispute-free', value: profile?.trust_dispute_free }
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
          </div>

          {/* Completed jobs */}
          <div style={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 18, padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Completed jobs</h3>
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 30, fontWeight: 600 }}>{completedCount}</div>
            <p style={{ color: C.textDim, fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
              Verified completed jobs build your trust score and unlock better placement.
            </p>
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
              The homeowner is interested too. You can now message each other to plan the work.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setMatchModal(null)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 100, background: 'transparent', color: C.textDim, border: `1px solid ${C.line}`, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Keep swiping
              </button>
              <Link href="/contractor/chat" style={{ flex: 1, padding: '12px 0', borderRadius: 100, background: C.amber, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', lineHeight: '1.4' }}>
                Send a message
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
