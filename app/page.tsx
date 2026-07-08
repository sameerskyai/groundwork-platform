'use client'

import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { SwipeDemo } from '@/components/swipe/SwipeDemo'
import { Footer } from '@/components/layout/Footer'
import { HeroMatchState } from '@/components/hero/HeroMatchState'
import { Check, Shield, Star } from 'lucide-react'

const NAV_LINKS = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'For contractors', href: '/for-contractors' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' }
]

const STATS = [
  { n: '2,400+', label: 'Estimates delivered' },
  { n: '180', label: 'Contractors verified' },
  { n: '$3,800', label: 'Avg savings vs first quote' },
  { n: '30s', label: 'Time to an estimate' }
]

const STEPS = [
  {
    n: '01',
    title: 'Tell us about your project',
    body: 'Text, photos, or both. Our AI asks follow-up questions to sharpen the scope and set up an accurate estimate.',
    icon: '📝',
    payoff: false
  },
  {
    n: '02',
    title: 'Get a real price, instantly',
    body: 'We pull from completed jobs in your ZIP code — not national averages. Labor, materials, timeline. This is your anchor going into every contractor conversation.',
    icon: '💰',
    payoff: false
  },
  {
    n: '03',
    title: 'Swipe to match with the right contractor',
    body: 'Verified contractors who fit your trade, your location, and your actual budget show up as swipe cards. Interested = they see your project. Pass = next. You stay in control.',
    icon: '👆',
    payoff: true
  }
]

const COMPARE = [
  { label: 'Pricing data', them: 'National averages', us: 'Real jobs in your ZIP' },
  { label: 'Contractor vetting', them: 'Self-reported ratings', us: 'License + insurance verified' },
  { label: 'Getting quotes', them: 'Cold calls from strangers', us: 'Swipe-to-match, you control who sees your project' },
  { label: 'Estimate timing', them: 'After a site visit', us: '30 seconds, from your phone' },
  { label: 'Contractor fees', them: 'Up to 30% lead fees per job', us: 'Flat monthly subscription, no per-job cuts' }
]

export default function HomePage() {
  return (
    <div style={{ background: '#0C1118', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{
        background: '#0C1118',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark />
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                style={{ color: '#6B8090', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}
                className="hidden md:block hover:text-[#F7F5F1] transition-colors">
                {l.label}
              </Link>
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/login">
                <button style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: 'transparent', color: '#6B8090',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer'
                }}>
                  Sign in
                </button>
              </Link>
              <Link href="/signup?role=homeowner">
                <button style={{
                  padding: '8px 18px', borderRadius: 8,
                  background: '#E8722C', color: '#fff',
                  border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer'
                }}>
                  Get started free
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO — split layout: headline left, swipe demo right */}
      <section style={{ padding: '80px 24px 100px', background: '#0C1118' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}
          className="grid-cols-1 md:grid-cols-2">

          {/* Left: copy */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(232, 114, 44, 0.12)', border: '1px solid rgba(232, 114, 44, 0.25)',
              borderRadius: 100, padding: '5px 14px',
              marginBottom: 28
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8722C' }} />
              <span style={{ color: '#E8722C', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Built for homeowners
              </span>
            </div>

            <h1 style={{
              color: '#F7F5F1',
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              marginBottom: 24
            }}>
              Swipe to match with contractors who actually fit your budget.
            </h1>

            <p style={{
              color: '#6B8090',
              fontSize: 18,
              lineHeight: 1.7,
              marginBottom: 36,
              maxWidth: 460
            }}>
              Start with a real price, not a guess — then get matched with someone who works within it.
            </p>

            <HeroMatchState />
          </div>

          {/* Right: swipe demo */}
          <div>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 24, padding: '28px 24px'
            }}>
              <p style={{ color: '#4A6070', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 }}>
                Try it now — swipe through sample projects
              </p>
              <SwipeDemo />
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: '#E8722C', padding: '20px 24px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'center', gap: '16px 48px'
        }}>
          {STATS.map(s => (
            <div key={s.n} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 26, fontWeight: 700, color: '#fff',
                lineHeight: 1
              }}>
                {s.n}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 3 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '100px 24px', background: '#F7F5F1' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 60 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ height: 1, width: 32, background: '#E8722C' }} />
              <span style={{ color: '#E8722C', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                How it works
              </span>
            </div>
            <h2 style={{ color: '#12181F', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              From description to done.
            </h2>
          </div>

          {/* Steps 1 + 2 — supporting acts, smaller */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 24 }}>
            {STEPS.filter(s => !s.payoff).map(s => (
              <div key={s.n} style={{
                padding: '28px',
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #E8E4DE'
              }}>
                <div style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: '3.5rem', fontWeight: 700, color: '#E8E4DE',
                  lineHeight: 1, marginBottom: 12, userSelect: 'none'
                }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
                <h3 style={{ color: '#12181F', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Step 3 — the payoff, full width, dark, prominent */}
          {STEPS.filter(s => s.payoff).map(s => (
            <div key={s.n} style={{
              background: '#12181F',
              borderRadius: 20,
              padding: '48px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 48,
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: '5rem', fontWeight: 700,
                  color: '#E8722C',
                  lineHeight: 1, marginBottom: 16, userSelect: 'none',
                  opacity: 0.6
                }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{s.icon}</div>
                <h3 style={{ color: '#F7F5F1', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>
                  {s.title}
                </h3>
                <p style={{ color: '#6B8090', fontSize: 16, lineHeight: 1.75, maxWidth: 420 }}>{s.body}</p>
                <Link href="/how-it-works">
                  <button style={{
                    marginTop: 28,
                    padding: '13px 24px', borderRadius: 10,
                    background: '#E8722C', color: '#fff',
                    border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer'
                  }}>
                    See the full walkthrough →
                  </button>
                </Link>
              </div>
              {/* Mini swipe visual */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '20px',
                display: 'flex', flexDirection: 'column', gap: 12
              }}>
                <p style={{ color: '#3A5060', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  What a match looks like
                </p>
                {[
                  { name: 'Apex Contracting', trade: 'General Contractor', score: 96, status: 'accepted', color: '#2E8B57' },
                  { name: 'Metro HVAC Pros', trade: 'HVAC', score: 91, status: 'pending', color: '#E8722C' },
                  { name: 'Summit Builds', trade: 'General Contractor', score: 88, status: 'passed', color: '#4A6070' }
                ].map(c => (
                  <div key={c.name} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 10,
                    border: c.status === 'accepted' ? '1px solid rgba(46,139,87,0.3)' : '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: c.status === 'accepted' ? 'rgba(46,139,87,0.2)' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: c.color, flexShrink: 0
                    }}>
                      {c.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#F7F5F1', fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      <div style={{ color: '#4A6070', fontSize: 12 }}>{c.trade}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: c.color, fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>{c.score}%</div>
                      <div style={{ color: '#3A5060', fontSize: 11, textTransform: 'capitalize' }}>{c.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY DIFFERENT — comparison */}
      <section style={{ padding: '100px 24px', background: '#12181F' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ height: 1, width: 32, background: '#E8722C' }} />
              <span style={{ color: '#E8722C', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Why different
              </span>
            </div>
            <h2 style={{ color: '#F7F5F1', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Not another quote site.
            </h2>
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              padding: '14px 24px'
            }}>
              <div />
              <div style={{ color: '#4A6070', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Other sites</div>
              <div style={{ color: '#E8722C', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Groundwork</div>
            </div>
            {COMPARE.map((row, i) => (
              <div key={row.label} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                padding: '16px 24px',
                borderBottom: i < COMPARE.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                alignItems: 'center'
              }}>
                <div style={{ color: '#C0CDD8', fontSize: 14, fontWeight: 600 }}>{row.label}</div>
                <div style={{ color: '#4A6070', fontSize: 14 }}>{row.them}</div>
                <div style={{ color: '#F7F5F1', fontSize: 14, fontWeight: 500 }}>{row.us}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section style={{ padding: '100px 24px', background: '#F7F5F1' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>

            <div style={{ padding: '32px', background: '#fff', borderRadius: 16, border: '1px solid #E8E4DE' }}>
              <Shield style={{ width: 32, height: 32, color: '#E8722C', marginBottom: 16 }} />
              <h3 style={{ color: '#12181F', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Contractors are verified</h3>
              <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7 }}>
                Every contractor on Groundwork submits proof of license and insurance before going live. We don&apos;t accept self-reported claims.
              </p>
              <Link href="/trust" style={{ display: 'inline-block', marginTop: 16, color: '#E8722C', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                How verification works →
              </Link>
            </div>

            <div style={{ padding: '32px', background: '#fff', borderRadius: 16, border: '1px solid #E8E4DE' }}>
              <Star style={{ width: 32, height: 32, color: '#2E8B57', marginBottom: 16 }} />
              <h3 style={{ color: '#12181F', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Trust scores, not star ratings</h3>
              <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7 }}>
                We score contractors on verified job outcomes — did they finish? Did the final cost match the estimate? — not on how many five-star reviews they accumulated.
              </p>
            </div>

            <div style={{ padding: '32px', background: '#fff', borderRadius: 16, border: '1px solid #E8E4DE' }}>
              <div style={{ width: 32, height: 32, marginBottom: 16, fontSize: 28 }}>🔒</div>
              <h3 style={{ color: '#12181F', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Your data is never sold</h3>
              <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7 }}>
                Your address, project photos, and payment data are used to run Groundwork — not sold to advertisers, not shared with third parties.
              </p>
              <Link href="/privacy" style={{ display: 'inline-block', marginTop: 16, color: '#E8722C', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Read our Privacy Policy →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TWO SIDES */}
      <section style={{ padding: '100px 24px', background: '#0C1118' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

            {/* Homeowner */}
            <div style={{ background: '#12181F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40 }}>
              <div style={{ color: '#E8722C', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
                For homeowners
              </div>
              <h2 style={{ color: '#F7F5F1', fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
                Stop guessing what things cost. Walk in with the number.
              </h2>
              <p style={{ color: '#6B8090', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
                When you already know a fair price range before you talk to any contractor, you can&apos;t be overcharged. That&apos;s the whole point. You get the leverage — for free.
              </p>
              {['Real cost estimate in 30 seconds', 'Itemized: labor vs. materials', 'You control who sees your project', 'No upsells, no sales calls'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <Check style={{ width: 14, height: 14, color: '#2E8B57', marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: '#C0CDD8', fontSize: 14 }}>{item}</span>
                </div>
              ))}
              <Link href="/for-homeowners" style={{ display: 'inline-block', marginTop: 28 }}>
                <button style={{
                  padding: '13px 24px', borderRadius: 10,
                  background: '#E8722C', color: '#fff',
                  border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer'
                }}>
                  Get my free estimate
                </button>
              </Link>
            </div>

            {/* Contractor */}
            <div style={{ background: '#F7F5F1', borderRadius: 20, padding: 40 }}>
              <div style={{ color: '#E8722C', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
                For contractors
              </div>
              <h2 style={{ color: '#12181F', fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
                Stop chasing quotes that go nowhere.
              </h2>
              <p style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
                You set your rates once. We pre-qualify every homeowner against your trade, area, and budget before they see your name. You only hear from people who are ready to hire.
              </p>
              {['Answer the pricing interview once', 'AI builds your public profile', 'Budget-pre-qualified homeowners only', 'Flat monthly rate — no per-job fees'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <Check style={{ width: 14, height: 14, color: '#2E8B57', marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: '#2D3748', fontSize: 14 }}>{item}</span>
                </div>
              ))}
              <Link href="/for-contractors" style={{ display: 'inline-block', marginTop: 28 }}>
                <button style={{
                  padding: '13px 24px', borderRadius: 10,
                  background: '#12181F', color: '#F7F5F1',
                  border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer'
                }}>
                  Join as a contractor
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF — pre-launch structured component */}
      <section style={{ padding: '80px 24px', background: '#F7F5F1' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ height: 1, width: 32, background: '#E8722C' }} />
            <span style={{ color: '#E8722C', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Early access</span>
            <div style={{ height: 1, width: 32, background: '#E8722C' }} />
          </div>
          <h2 style={{ color: '#12181F', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Be the first in your area.
          </h2>
          <p style={{ color: '#6B7280', fontSize: 18, maxWidth: 500, margin: '0 auto 48px' }}>
            Groundwork is building city by city. Get in early and you&apos;re the homeowner in your ZIP code who already knows the number.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 800, margin: '0 auto' }}>
            {[
              { role: 'Homeowner', name: 'D.W.', location: 'Bethesda, MD', quote: 'I got three quotes for my HVAC. Two were way over what Groundwork said was fair. Ended up paying exactly the estimate.' },
              { role: 'Homeowner', name: 'M.R.', location: 'Arlington, VA', quote: 'Knowing the price range before anyone showed up changed the whole conversation. I wasn\'t guessing anymore.' },
              { role: 'Contractor', name: 'T.H., Licensed GC', location: 'Silver Spring, MD', quote: 'Every homeowner who comes through already understands what work costs. Way less back and forth on price.' }
            ].map(t => (
              <div key={t.name} style={{
                background: '#fff', borderRadius: 16,
                border: '1px solid #E8E4DE',
                padding: '24px',
                textAlign: 'left'
              }}>
                <p style={{ color: '#2D3748', fontSize: 14, lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#E8722C', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 14
                  }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ color: '#12181F', fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                    <div style={{ color: '#6B7280', fontSize: 12 }}>{t.role} · {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '100px 24px', background: '#12181F' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            color: '#F7F5F1',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            marginBottom: 20
          }}>
            The honest way to get work done.
          </h2>
          <p style={{ color: '#6B8090', fontSize: 18, marginBottom: 40 }}>
            Real estimates. Vetted contractors. No guessing.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link href="/signup?role=homeowner">
              <button style={{
                padding: '16px 32px', borderRadius: 10,
                background: '#E8722C', color: '#fff',
                border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer'
              }}>
                Get my free estimate
              </button>
            </Link>
            <Link href="/signup?role=contractor">
              <button style={{
                padding: '16px 32px', borderRadius: 10,
                background: 'transparent', color: '#C0CDD8',
                border: '1px solid rgba(255,255,255,0.15)',
                fontSize: 16, fontWeight: 600, cursor: 'pointer'
              }}>
                Join as a contractor
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
