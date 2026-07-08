import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'
import { Check, ArrowRight, DollarSign, Clock, Star } from 'lucide-react'

export const metadata = {
  title: 'For Contractors — Groundwork',
  description: 'Stop chasing quotes that go nowhere. Groundwork sends you budget-qualified homeowners who already know what fair looks like.'
}

const PAIN_POINTS = [
  { icon: '😤', pain: 'You spend hours writing estimates for people who never respond', fix: 'Every homeowner you hear from has already seen a fair price range and chose to reach out to you.' },
  { icon: '💸', pain: 'You pay per-lead fees on every job, win or lose', fix: 'Flat monthly subscription. No per-job fees, no commissions, no surprises.' },
  { icon: '📞', pain: 'You cold-call prospects who aren\'t ready to hire', fix: 'Homeowners swipe to show interest first. You hear from people who want to talk.' },
  { icon: '⭐', pain: 'You compete on star ratings against contractors who game reviews', fix: 'Trust scores based on verified job outcomes — did you finish? Did the cost match the estimate?' }
]

export default function ForContractorsPage() {
  return (
    <div style={{ background: '#F7F5F1', minHeight: '100vh' }}>
      <header style={{ background: '#0C1118', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
          <Link href="/signup?role=contractor">
            <button style={{ padding: '10px 20px', borderRadius: 8, background: '#E8722C', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Join as a contractor
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: '#12181F', padding: '90px 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ color: '#E8722C', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
            For contractors
          </div>
          <h1 style={{ color: '#F7F5F1', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Stop chasing quotes that go nowhere.
            <br />
            <span style={{ color: '#E8722C' }}>Get budget-qualified homeowners instead.</span>
          </h1>
          <p style={{ color: '#6B8090', fontSize: 17, lineHeight: 1.7, marginBottom: 40, maxWidth: 560 }}>
            Most lead gen wastes your time: people tire-kicking, collecting quotes with no intention to hire, or expecting $8,000 worth of work for $2,000. Groundwork sends you homeowners who already understand what fair costs.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/signup?role=contractor">
              <button style={{ padding: '15px 28px', borderRadius: 10, background: '#E8722C', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Join as a contractor <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </Link>
            <Link href="/pricing">
              <button style={{ padding: '15px 28px', borderRadius: 10, background: 'transparent', color: '#C0CDD8', border: '1px solid rgba(255,255,255,0.12)', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                See pricing
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pain points vs fixes */}
      <section style={{ padding: '90px 24px', background: '#F7F5F1' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ color: '#12181F', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 48 }}>
            Every other lead platform is broken for contractors.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PAIN_POINTS.map(p => (
              <div key={p.pain} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 24, padding: '24px 28px',
                background: '#fff', borderRadius: 16, border: '1px solid #E8E4DE',
                alignItems: 'start'
              }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{p.icon}</span>
                  <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7 }}>{p.pain}</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Check style={{ width: 16, height: 16, color: '#2E8B57', flexShrink: 0, marginTop: 3 }} />
                  <p style={{ color: '#12181F', fontSize: 14, lineHeight: 1.7, fontWeight: 500 }}>{p.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 24px', background: '#12181F' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ color: '#F7F5F1', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Set it up once. Let it run.
          </h2>
          <p style={{ color: '#6B8090', fontSize: 16, marginBottom: 48 }}>
            Most contractors are fully set up in under 20 minutes.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { n: '01', icon: <DollarSign style={{ width: 20, height: 20, color: '#E8722C' }} />, title: 'Answer the pricing interview', body: 'Tell us your rates once. Our AI turns that into your public profile and bio — no writing required.' },
              { n: '02', icon: <Star style={{ width: 20, height: 20, color: '#E8722C' }} />, title: 'Get verified', body: 'Submit your license and insurance. Once verified, your profile goes live and you start appearing in matches.' },
              { n: '03', icon: <Clock style={{ width: 20, height: 20, color: '#E8722C' }} />, title: 'Receive job requests', body: 'Homeowners in your area swipe to show interest. You see their project, budget, and location. Accept or pass.' }
            ].map(s => (
              <div key={s.n} style={{ padding: '28px', background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#E8722C', fontWeight: 700 }}>{s.n}</span>
                  {s.icon}
                </div>
                <h3 style={{ color: '#F7F5F1', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: '#6B8090', fontSize: 14, lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '80px 24px', background: '#F7F5F1' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ color: '#12181F', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>Simple, honest pricing.</h2>
          <p style={{ color: '#6B7280', fontSize: 16, marginBottom: 40 }}>Flat monthly rate. No per-job fees. No commissions.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { tier: 'Standard', price: '$79', period: '/mo', cap: '5 job requests per day', features: ['Public verified profile', 'AI-written bio', 'Basic analytics dashboard'], dark: false },
              { tier: 'Growth', price: '$149', period: '/mo', cap: '20 job requests per day', features: ['Priority placement in matches', 'Growth badge on profile', 'Advanced analytics + insights'], dark: true }
            ].map(t => (
              <div key={t.tier} style={{ background: t.dark ? '#12181F' : '#fff', borderRadius: 20, padding: '32px', border: t.dark ? 'none' : '1px solid #E8E4DE' }}>
                <div style={{ color: '#E8722C', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>{t.tier}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 36, fontWeight: 700, color: t.dark ? '#F7F5F1' : '#12181F' }}>{t.price}</span>
                  <span style={{ color: '#6B7280', fontSize: 14 }}>{t.period}</span>
                </div>
                <div style={{ color: '#E8722C', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>{t.cap}</div>
                {t.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <Check style={{ width: 14, height: 14, color: '#2E8B57', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: t.dark ? '#C0CDD8' : '#374151', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
                <Link href="/signup?role=contractor">
                  <button style={{ width: '100%', marginTop: 24, padding: '13px 0', borderRadius: 10, background: t.dark ? '#E8722C' : '#12181F', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    Start with {t.tier}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
