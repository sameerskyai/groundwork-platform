import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'
import { WaitlistForm } from '@/components/waitlist/WaitlistForm'
import { Check, ArrowRight, DollarSign, Clock, Star } from 'lucide-react'

export const metadata = {
  title: 'For Contractors — Laywork',
  description: 'Stop chasing quotes that go nowhere. Laywork sends you budget-qualified homeowners who already know what fair looks like.'
}

const PAIN_POINTS = [
  { icon: '😤', pain: 'You spend hours writing estimates for people who never respond', fix: 'Every homeowner you hear from has already seen a fair price range and chose to reach out to you.' },
  { icon: '💸', pain: 'You pay per-lead fees on every job, win or lose', fix: 'Flat monthly subscription. No per-job fees, no commissions, no surprises.' },
  { icon: '📞', pain: 'You cold-call prospects who aren\'t ready to hire', fix: 'Homeowners swipe to show interest first. You hear from people who want to talk.' },
  { icon: '⭐', pain: 'You compete on star ratings against contractors who game reviews', fix: 'Trust scores based on verified job outcomes — did you finish? Did the cost match the estimate?' }
]

export default function ForContractorsPage() {
  return (
    <div style={{ background: 'var(--color-base-alt)', minHeight: '100vh' }}>
      <header style={{ background: 'var(--color-ink)', borderBottom: '1px solid color-mix(in srgb, var(--color-line) 6%, transparent)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
          <Link href="/signup?role=contractor">
            <button style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--color-accent)', color: 'var(--color-base)', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Join as a contractor
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: 'var(--color-ink)', padding: '90px 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ color: 'var(--color-accent-on-dark)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
            For contractors
          </div>
          <h1 style={{ color: 'var(--color-base)', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Stop chasing quotes that go nowhere.
            <br />
            <span style={{ color: 'var(--color-accent-on-dark)' }}>Get budget-qualified homeowners instead.</span>
          </h1>
          <p style={{ color: 'var(--color-line)', fontSize: 17, lineHeight: 1.7, marginBottom: 40, maxWidth: 560 }}>
            Most lead gen wastes your time: people tire-kicking, collecting quotes with no intention to hire, or expecting $8,000 worth of work for $2,000. Laywork sends you homeowners who already understand what fair costs.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/signup?role=contractor">
              <button style={{ padding: '15px 28px', borderRadius: 10, background: 'var(--color-accent)', color: 'var(--color-base)', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Join as a contractor <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </Link>
            <Link href="/pricing">
              <button style={{ padding: '15px 28px', borderRadius: 10, background: 'transparent', color: 'var(--color-line)', border: '1px solid color-mix(in srgb, var(--color-line) 12%, transparent)', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                See pricing
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pain points vs fixes */}
      <section style={{ padding: '90px 24px', background: 'var(--color-base-alt)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ color: 'var(--color-ink)', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 48 }}>
            Every other lead platform is broken for contractors.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PAIN_POINTS.map(p => (
              <div key={p.pain} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 24, padding: '24px 28px',
                background: 'var(--color-base)', borderRadius: 16, border: '1px solid var(--color-line)',
                alignItems: 'start'
              }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{p.icon}</span>
                  <p style={{ color: 'var(--color-ink-2)', fontSize: 14, lineHeight: 1.7 }}>{p.pain}</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Check style={{ width: 16, height: 16, color: 'var(--color-verified)', flexShrink: 0, marginTop: 3 }} />
                  <p style={{ color: 'var(--color-ink)', fontSize: 14, lineHeight: 1.7, fontWeight: 500 }}>{p.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 24px', background: 'var(--color-ink)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ color: 'var(--color-base)', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Set it up once. Let it run.
          </h2>
          <p style={{ color: 'var(--color-line)', fontSize: 16, marginBottom: 48 }}>
            Most contractors are fully set up in under 20 minutes.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { n: '01', icon: <DollarSign style={{ width: 20, height: 20, color: 'var(--color-accent-on-dark)' }} />, title: 'Answer the pricing interview', body: 'Tell us your rates once. Our AI turns that into your public profile and bio — no writing required.' },
              { n: '02', icon: <Star style={{ width: 20, height: 20, color: 'var(--color-accent-on-dark)' }} />, title: 'Get verified', body: 'Submit your license and insurance. Once verified, your profile goes live and you start appearing in matches.' },
              { n: '03', icon: <Clock style={{ width: 20, height: 20, color: 'var(--color-accent-on-dark)' }} />, title: 'Receive job requests', body: 'Homeowners in your area swipe to show interest. You see their project, budget, and location. Accept or pass.' }
            ].map(s => (
              <div key={s.n} style={{ padding: '28px', background: 'color-mix(in srgb, var(--color-base) 4%, transparent)', borderRadius: 16, border: '1px solid color-mix(in srgb, var(--color-line) 7%, transparent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-accent-on-dark)', fontWeight: 700 }}>{s.n}</span>
                  {s.icon}
                </div>
                <h3 style={{ color: 'var(--color-base)', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: 'var(--color-line)', fontSize: 14, lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '80px 24px', background: 'var(--color-base-alt)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ color: 'var(--color-ink)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>Simple, honest pricing.</h2>
          <p style={{ color: 'var(--color-ink-2)', fontSize: 16, marginBottom: 40 }}>Flat monthly rate. No per-job fees. No commissions.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { tier: 'Standard', price: '$79', period: '/mo', cap: '5 job requests per day', features: ['Public verified profile', 'AI-written bio', 'Basic analytics dashboard'], dark: false },
              { tier: 'Growth', price: '$149', period: '/mo', cap: '20 job requests per day', features: ['Priority placement in matches', 'Growth badge on profile', 'Advanced analytics + insights'], dark: true }
            ].map(t => (
              <div key={t.tier} style={{ background: t.dark ? 'var(--color-ink)' : 'var(--color-base)', borderRadius: 20, padding: '32px', border: t.dark ? 'none' : '1px solid var(--color-line)' }}>
                <div style={{ color: t.dark ? 'var(--color-accent-on-dark)' : 'var(--color-accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>{t.tier}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 36, fontWeight: 700, color: t.dark ? 'var(--color-base)' : 'var(--color-ink)' }}>{t.price}</span>
                  <span style={{ color: t.dark ? 'var(--color-line)' : 'var(--color-ink-2)', fontSize: 14 }}>{t.period}</span>
                </div>
                <div style={{ color: t.dark ? 'var(--color-accent-on-dark)' : 'var(--color-accent)', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>{t.cap}</div>
                {t.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <Check style={{ width: 14, height: 14, color: t.dark ? 'color-mix(in srgb, var(--color-verified) 70%, var(--color-base))' : 'var(--color-verified)', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: t.dark ? 'var(--color-line)' : 'var(--color-ink-2)', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
                <Link href="/signup?role=contractor">
                  <button style={{ width: '100%', marginTop: 24, padding: '13px 0', borderRadius: 10, background: t.dark ? 'var(--color-accent)' : 'var(--color-ink)', color: 'var(--color-base)', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    Start with {t.tier}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-launch waitlist */}
      <section style={{ padding: '80px 24px', background: 'var(--color-ink)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ color: 'var(--color-accent-on-dark)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Not in your area yet?
          </div>
          <h2 style={{ color: 'var(--color-base)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Claim your ZIP before your competitors do.
          </h2>
          <p style={{ color: 'var(--color-line)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Laywork opens city by city. Join the waitlist and you&apos;ll be first in line
            when homeowners in your area start posting projects — early members get
            priority placement at launch.
          </p>
          <WaitlistForm />
        </div>
      </section>

      <Footer />
    </div>
  )
}
