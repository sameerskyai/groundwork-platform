import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'
import { Check, Building2 } from 'lucide-react'

export const metadata = {
  title: 'For Property Managers — Groundwork',
  description: 'Manage maintenance and renovation across your portfolio with real cost data and verified contractors in one place.'
}

export default function ForPropertyManagersPage() {
  return (
    <div style={{ background: '#F7F5F1', minHeight: '100vh' }}>
      <header style={{ background: '#0C1118', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
          <Link href="/contact">
            <button style={{ padding: '10px 20px', borderRadius: 8, background: '#E8722C', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Talk to us
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: '#12181F', padding: '90px 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ color: '#4A6B8A', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
            For property managers
          </div>
          <h1 style={{ color: '#F7F5F1', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
            One platform for your whole portfolio.
          </h1>
          <p style={{ color: '#6B8090', fontSize: 17, lineHeight: 1.7, marginBottom: 40, maxWidth: 540 }}>
            Managing maintenance and renovation across multiple properties means juggling multiple contractors, comparing quotes you can&apos;t verify, and never knowing if you&apos;re being overcharged. Groundwork fixes that.
          </p>
          <Link href="/contact">
            <button style={{ padding: '15px 28px', borderRadius: 10, background: '#4A6B8A', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Talk to our team →
            </button>
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '90px 24px', background: '#F7F5F1' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ color: '#12181F', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 48 }}>
            Built for recurring volume, not one-off projects.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { icon: '📊', title: 'Portfolio-wide cost tracking', body: 'See what you\'ve spent on HVAC, plumbing, roofing across all your properties. Compare costs year-over-year and spot where you\'re overpaying.' },
              { icon: '⚡', title: 'Instant estimates for every work order', body: 'Any unit, any trade — get a real cost estimate before you call a single contractor. Know what\'s fair before anyone walks in.' },
              { icon: '🔄', title: 'Preferred contractor relationships', body: 'Contractors you work with repeatedly build a verified track record with you. Their history with your portfolio is visible at a glance.' },
              { icon: '🔒', title: 'One set of verified contractors', body: 'Build a portfolio of vetted, insured contractors you trust — not a new cold search every time something breaks.' },
              { icon: '📋', title: 'Maintenance history per unit', body: 'Every project, every cost, every contractor — attached to the unit. Search by property, trade, or contractor.' },
              { icon: '📈', title: 'Cost benchmarking', body: 'Compare what you paid for a kitchen remodel against what similar jobs cost in that ZIP code. Know immediately if a quote is fair.' }
            ].map(b => (
              <div key={b.title} style={{ padding: '28px', background: '#fff', borderRadius: 16, border: '1px solid #E8E4DE' }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{b.icon}</div>
                <h3 style={{ color: '#12181F', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{b.title}</h3>
                <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7 }}>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '80px 24px', background: '#12181F' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ color: '#F7F5F1', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Portfolio pricing
          </h2>
          <p style={{ color: '#6B8090', fontSize: 15, marginBottom: 40 }}>
            Priced per unit. Scales with your portfolio size. All tiers include full platform access and contractor verification.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { units: '1–10 units', price: '$49/mo', label: 'Starter' },
              { units: '11–50 units', price: '$149/mo', label: 'Professional' },
              { units: '50+ units', price: 'Custom', label: 'Enterprise' }
            ].map(t => (
              <div key={t.units} style={{ padding: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
                <div style={{ color: '#E8722C', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{t.label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700, color: '#F7F5F1', marginBottom: 4 }}>{t.price}</div>
                <div style={{ color: '#6B8090', fontSize: 13 }}>{t.units}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Full access to cost estimation across all units', 'Contractor matching and messaging', 'Portfolio-wide cost tracking and history', 'Verified contractor pool', 'Priority support'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Check style={{ width: 14, height: 14, color: '#2E8B57', flexShrink: 0 }} />
                <span style={{ color: '#C0CDD8', fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 36 }}>
            <Link href="/contact">
              <button style={{ padding: '14px 28px', borderRadius: 10, background: '#E8722C', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Talk to our team about your portfolio
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
