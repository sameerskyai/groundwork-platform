import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'
import { Shield, Check, Star } from 'lucide-react'

export const metadata = {
  title: 'Contractor Verification — Groundwork',
  description: 'How Groundwork verifies contractor licenses, insurance, and builds outcome-based trust scores.'
}

export default function TrustPage() {
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
      <section style={{ background: '#12181F', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <Shield style={{ width: 48, height: 48, color: '#E8722C', margin: '0 auto 24px' }} />
          <h1 style={{ color: '#F7F5F1', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Contractor verification & trust scores
          </h1>
          <p style={{ color: '#6B8090', fontSize: 17, lineHeight: 1.7 }}>
            Every contractor on Groundwork is verified before going live. Here&apos;s exactly what that means and how our trust score works.
          </p>
        </div>
      </section>

      {/* Verification steps */}
      <section style={{ padding: '80px 24px', background: '#F7F5F1' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ color: '#12181F', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 40 }}>
            The verification process
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              {
                n: '1',
                title: 'License submission',
                body: 'Every contractor submits their contractor license number and issuing state. We verify the license is active and in good standing against state licensing databases.',
                badge: 'License Verified',
                color: '#2E8B57'
              },
              {
                n: '2',
                title: 'Insurance documentation',
                body: 'Contractors submit proof of general liability insurance (minimum $1M per occurrence). We verify coverage is current and adequate for the trades they offer.',
                badge: 'Insured',
                color: '#4A6B8A'
              },
              {
                n: '3',
                title: 'Trade interview',
                body: 'Our AI conducts a structured pricing interview to understand each contractor\'s real rates, scope of work, and service area. This data powers accurate matching and estimate validation.',
                badge: 'Rates Verified',
                color: '#E8722C'
              },
              {
                n: '4',
                title: 'Profile review',
                body: 'Our team reviews submitted information before the profile goes live. Profiles with incomplete, inconsistent, or unverifiable information are not approved.',
                badge: 'Profile Approved',
                color: '#12181F'
              }
            ].map(step => (
              <div key={step.n} style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 20, padding: '24px', background: '#fff', borderRadius: 16, border: '1px solid #E8E4DE', alignItems: 'start' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                  {step.n}
                </div>
                <div>
                  <h3 style={{ color: '#12181F', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7 }}>{step.body}</p>
                </div>
                <div style={{ background: step.color === '#12181F' ? '#F3F4F6' : `${step.color}18`, border: `1px solid ${step.color}33`, borderRadius: 100, padding: '4px 12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check style={{ width: 12, height: 12, color: step.color }} />
                  <span style={{ color: step.color, fontSize: 12, fontWeight: 700 }}>{step.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust score */}
      <section style={{ padding: '80px 24px', background: '#12181F' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Star style={{ width: 28, height: 28, color: '#E8722C' }} />
            <h2 style={{ color: '#F7F5F1', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
              The trust score
            </h2>
          </div>
          <p style={{ color: '#6B8090', fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
            We don&apos;t use star ratings. Star ratings measure sentiment, not outcomes — and they&apos;re easily gamed by contractors who ask every satisfied customer to leave a review. Groundwork&apos;s trust score is based on what actually happened.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { metric: 'Job completion rate', desc: 'Did the contractor finish the job they started?', weight: 'High weight' },
              { metric: 'Cost accuracy', desc: 'Did the final cost land within the estimated range?', weight: 'High weight' },
              { metric: 'Timeline accuracy', desc: 'Did the job finish within the estimated timeframe?', weight: 'Medium weight' },
              { metric: 'Response rate', desc: 'How reliably does the contractor respond to homeowner messages?', weight: 'Medium weight' },
              { metric: 'Homeowner rating', desc: 'Verified post-completion rating from homeowners only', weight: 'Standard weight' }
            ].map(m => (
              <div key={m.metric} style={{ padding: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                <h3 style={{ color: '#F7F5F1', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{m.metric}</h3>
                <p style={{ color: '#6B8090', fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>{m.desc}</p>
                <span style={{ background: 'rgba(232, 114, 44, 0.15)', color: '#E8722C', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{m.weight}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px' }}>
            <p style={{ color: '#C0CDD8', fontSize: 14, lineHeight: 1.8 }}>
              <strong style={{ color: '#F7F5F1' }}>New contractors</strong> start with a provisional score until they have enough completed jobs to establish a track record. During this period, they&apos;re clearly labeled as &ldquo;new to Groundwork&rdquo; and their base verification badges still display.
            </p>
          </div>
        </div>
      </section>

      {/* What happens if */}
      <section style={{ padding: '80px 24px', background: '#F7F5F1' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ color: '#12181F', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 32 }}>
            What happens when something goes wrong
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { trigger: 'A contractor\'s license lapses', action: 'Profile suspended immediately. Access restored only upon verified renewal.' },
              { trigger: 'A homeowner reports a problem', action: 'We investigate. Contractors with substantiated complaints receive score penalties; repeated violations result in removal.' },
              { trigger: 'A final cost is significantly over the estimate', action: 'Flagged for review. If the contractor is responsible for scope creep without homeowner agreement, it affects their cost-accuracy score.' },
              { trigger: 'A contractor ghosts a matched homeowner', action: 'Logged and affects response rate score. Repeated ghosting leads to suspension.' }
            ].map(item => (
              <div key={item.trigger} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '20px 24px', background: '#fff', borderRadius: 14, border: '1px solid #E8E4DE' }}>
                <div style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}><strong style={{ color: '#12181F' }}>If:</strong> {item.trigger}</div>
                <div style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}><strong style={{ color: '#E8722C' }}>Then:</strong> {item.action}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
