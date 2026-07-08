import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'
import { Check } from 'lucide-react'

export const metadata = {
  title: 'Pricing — Groundwork',
  description: 'Simple, transparent pricing for homeowners, contractors, and property managers. No hidden fees.'
}

export default function PricingPage() {
  return (
    <div style={{ background: '#F7F5F1', minHeight: '100vh' }}>
      <header style={{ background: '#0C1118', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/login"><button style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', color: '#6B8090', border: '1px solid rgba(255,255,255,0.08)', fontSize: 14, cursor: 'pointer' }}>Sign in</button></Link>
            <Link href="/signup"><button style={{ padding: '8px 18px', borderRadius: 8, background: '#E8722C', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Get started free</button></Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <h1 style={{ color: '#12181F', fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Honest pricing. No hidden fees.
          </h1>
          <p style={{ color: '#6B7280', fontSize: 18, maxWidth: 520, margin: '0 auto' }}>
            Homeowners pay nothing. Contractors pay a flat monthly rate — no per-job cuts, ever. Property managers scale by unit count.
          </p>
        </div>

        {/* Homeowner */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ color: '#12181F', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 20 }}>
            For homeowners
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              {
                tier: 'Free',
                price: '$0',
                period: 'forever',
                features: ['AI estimate range in 30 seconds', 'Swipe-to-match with contractors', 'In-platform messaging', 'Neighborhood Feed access'],
                cta: 'Get started free',
                href: '/signup?role=homeowner',
                dark: false
              },
              {
                tier: 'Estimate Unlock',
                price: '$9',
                period: 'one-time per project',
                features: ['Full itemized breakdown: labor + materials', 'Timeline estimate', 'Contractor comparison view', 'Shareable estimate report'],
                cta: 'Unlock your estimate',
                href: '/signup?role=homeowner',
                dark: true
              }
            ].map(t => (
              <div key={t.tier} style={{ padding: '28px', borderRadius: 16, background: t.dark ? '#12181F' : '#fff', border: t.dark ? 'none' : '1px solid #E8E4DE' }}>
                <div style={{ color: '#E8722C', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>{t.tier}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 700, color: t.dark ? '#F7F5F1' : '#12181F' }}>{t.price}</span>
                </div>
                <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>{t.period}</div>
                {t.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <Check style={{ width: 14, height: 14, color: '#2E8B57', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: t.dark ? '#C0CDD8' : '#374151', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
                <Link href={t.href}>
                  <button style={{ width: '100%', marginTop: 20, padding: '12px 0', borderRadius: 10, background: t.dark ? '#E8722C' : '#12181F', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    {t.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Contractor */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ color: '#12181F', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 20 }}>
            For contractors
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              {
                tier: 'Standard',
                price: '$79',
                period: '/month',
                cap: '5 job requests per day',
                features: ['Public verified profile', 'AI-written bio (from your pricing interview)', 'In-platform messaging', 'Basic analytics dashboard'],
                cta: 'Start with Standard',
                dark: false
              },
              {
                tier: 'Growth',
                price: '$149',
                period: '/month',
                cap: '20 job requests per day',
                features: ['Priority placement in homeowner matches', 'Growth badge on public profile', 'Advanced analytics + trend data', 'All Standard features'],
                cta: 'Go Growth',
                dark: true
              }
            ].map(t => (
              <div key={t.tier} style={{ padding: '28px', borderRadius: 16, background: t.dark ? '#12181F' : '#fff', border: t.dark ? 'none' : '1px solid #E8E4DE' }}>
                <div style={{ color: '#E8722C', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>{t.tier}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 700, color: t.dark ? '#F7F5F1' : '#12181F' }}>{t.price}</span>
                  <span style={{ color: '#6B7280', fontSize: 14 }}>{t.period}</span>
                </div>
                <div style={{ color: '#E8722C', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>{t.cap}</div>
                {t.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <Check style={{ width: 14, height: 14, color: '#2E8B57', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: t.dark ? '#C0CDD8' : '#374151', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
                <Link href="/signup?role=contractor">
                  <button style={{ width: '100%', marginTop: 20, padding: '12px 0', borderRadius: 10, background: t.dark ? '#E8722C' : '#12181F', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    {t.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
          <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 16 }}>
            Cancel anytime. Access continues through end of billing period. No refunds for partial months.
          </p>
        </div>

        {/* Property Manager */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ color: '#12181F', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 20 }}>
            For property managers
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { tier: 'Starter', price: '$49/mo', units: '1–10 units' },
              { tier: 'Professional', price: '$149/mo', units: '11–50 units' },
              { tier: 'Enterprise', price: 'Custom', units: '50+ units' }
            ].map(t => (
              <div key={t.tier} style={{ padding: '24px', background: '#fff', borderRadius: 14, border: '1px solid #E8E4DE', textAlign: 'center' }}>
                <div style={{ color: '#4A6B8A', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>{t.tier}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700, color: '#12181F', marginBottom: 4 }}>{t.price}</div>
                <div style={{ color: '#6B7280', fontSize: 13 }}>{t.units}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <Link href="/contact">
              <button style={{ padding: '13px 24px', borderRadius: 10, background: '#4A6B8A', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Talk to our team about your portfolio →
              </button>
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ padding: '40px', background: '#12181F', borderRadius: 20 }}>
          <h2 style={{ color: '#F7F5F1', fontSize: 20, fontWeight: 700, marginBottom: 28 }}>Pricing FAQ</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { q: 'Is there a free trial for contractors?', a: 'Not currently, but we\'re working on it. The setup takes under 20 minutes and you can cancel after your first month if it\'s not working for you.' },
              { q: 'What counts as a "job request"?', a: 'A job request is when a homeowner swipes to show interest in your profile and you choose to accept. Passing doesn\'t count against your daily limit.' },
              { q: 'Are there per-job commissions or fees?', a: 'Never. You pay the flat monthly rate and keep 100% of every job you win through Groundwork.' },
              { q: 'Why does the estimate unlock cost $9?', a: 'The full itemized breakdown — labor, materials, timeline, line items — requires significantly more AI compute to generate. $9 covers that cost and funds the platform.' }
            ].map(item => (
              <div key={item.q} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 20 }}>
                <h3 style={{ color: '#F7F5F1', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{item.q}</h3>
                <p style={{ color: '#6B8090', fontSize: 14, lineHeight: 1.7 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
