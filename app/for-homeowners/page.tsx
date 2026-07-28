import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'
import { SwipeDemo } from '@/components/swipe/SwipeDemo'
import { Check, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'For Homeowners — Laywork',
  description: 'Get a real cost estimate for your home project before you talk to any contractor. Know the fair price. Pick who you want.'
}

const HOW = [
  { n: '01', title: 'Describe your project', body: 'Text or photos — tell us what needs doing. Our AI asks follow-up questions to understand scope. Takes about 90 seconds.', color: 'var(--color-accent)' },
  { n: '02', title: 'Get your price', body: 'We pull from real completed jobs in your ZIP code. You see a range and a full itemized breakdown: labor, materials, timeline. No registration required for the estimate range.', color: 'var(--color-ink-2)' },
  { n: '03', title: 'Swipe to pick your contractor', body: 'Contractors who match your trade, budget, and area show up as cards. Swipe to show interest — they see your project, you start a conversation. You\'re always in control of who hears from you.', color: 'var(--color-verified)' }
]

export default function ForHomeownersPage() {
  return (
    <div style={{ background: 'var(--color-base-alt)', minHeight: '100vh' }}>
      <header style={{ background: 'var(--color-ink)', borderBottom: '1px solid color-mix(in srgb, var(--color-line) 6%, transparent)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/waitlist">
              <button style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--color-accent)', color: 'var(--color-base)', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Join the waitlist
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: 'var(--color-ink)', padding: '90px 24px', borderBottom: '1px solid color-mix(in srgb, var(--color-line) 5%, transparent)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}
          className="grid-cols-1 md:grid-cols-2">
          <div>
            <div style={{ color: 'var(--color-accent-on-dark)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
              For homeowners
            </div>
            <h1 style={{ color: 'var(--color-base)', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
              Know the fair price before anyone walks through your door.
            </h1>
            <p style={{ color: 'var(--color-line)', fontSize: 17, lineHeight: 1.7, marginBottom: 32, maxWidth: 460 }}>
              When you already know what something should cost, you can&apos;t be overcharged. That&apos;s the only reason Laywork exists — to give homeowners the information contractors have had for decades.
            </p>
            <Link href="/waitlist">
              <button style={{ padding: '15px 28px', borderRadius: 10, background: 'var(--color-accent)', color: 'var(--color-base)', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Join the waitlist <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </Link>
          </div>
          <div style={{ background: 'color-mix(in srgb, var(--color-base) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--color-line) 6%, transparent)', borderRadius: 24, padding: '28px 24px' }}>
            <p style={{ color: 'var(--color-line-strong)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 }}>
              Try the swipe matching demo
            </p>
            <SwipeDemo compact />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '90px 24px', background: 'var(--color-base-alt)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ color: 'var(--color-ink)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 50 }}>
            How it works for homeowners
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 40 }}>
            {HOW.map(s => (
              <div key={s.n} style={{ padding: '32px', background: 'var(--color-base)', borderRadius: 16, border: '1px solid var(--color-line)' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '4rem', fontWeight: 700, color: 'var(--color-line)', lineHeight: 1, marginBottom: 12 }}>{s.n}</div>
                <h3 style={{ color: 'var(--color-ink)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: 'var(--color-ink-2)', fontSize: 14, lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The information gap */}
      <section style={{ padding: '80px 24px', background: 'var(--color-ink)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-base)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>
            The information gap is the whole problem.
          </h2>
          <p style={{ color: 'var(--color-line)', fontSize: 17, lineHeight: 1.8, marginBottom: 40 }}>
            Every contractor you call walks in knowing exactly what your job should cost. You don&apos;t. That&apos;s not a coincidence — it&apos;s how the industry works. Laywork closes that gap before the first conversation.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { stat: '62%', label: 'of homeowners accept the first quote they get' },
              { stat: '3x', label: 'price spread between highest and lowest quote for the same job' },
              { stat: '$3,800', label: 'average savings when homeowners come in knowing the fair price' }
            ].map(s => (
              <div key={s.stat} style={{ background: 'color-mix(in srgb, var(--color-base) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--color-line) 7%, transparent)', borderRadius: 14, padding: '24px 20px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 36, fontWeight: 700, color: 'var(--color-accent-on-dark)', marginBottom: 8 }}>{s.stat}</div>
                <div style={{ color: 'var(--color-line)', fontSize: 13, lineHeight: 1.6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What homeowners get */}
      <section style={{ padding: '80px 24px', background: 'var(--color-base-alt)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ color: 'var(--color-ink)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 32 }}>
            What you get with Laywork
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { title: 'A real cost estimate in under a minute', body: 'Based on completed jobs near you — not national averages. Free, no sign-up required for the estimate range.' },
              { title: 'Full itemized breakdown', body: 'Labor vs. materials vs. timeline. Unlock for $9 — or create a free account and it\'s included.' },
              { title: 'Contractor matching, not cold calling', body: 'Contractors who match your trade, budget, and area show up as swipe cards. You decide who hears from you.' },
              { title: 'Verified contractors only', body: 'Every contractor has submitted license and insurance documentation. Not self-reported. Verified.' },
              { title: 'You stay in control', body: 'Your contact info is never automatically shared. You open the conversation when you\'re ready.' }
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 24px', background: 'var(--color-base)', borderRadius: 12, border: '1px solid var(--color-line)' }}>
                <Check style={{ width: 18, height: 18, color: 'var(--color-verified)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ color: 'var(--color-ink)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ color: 'var(--color-ink-2)', fontSize: 14, lineHeight: 1.6 }}>{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: 'var(--color-accent)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-base)', fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Get your estimate. Free. Now.
          </h2>
          <p style={{ color: 'color-mix(in srgb, var(--color-base) 80%, transparent)', fontSize: 17, marginBottom: 32 }}>
            No credit card. No sales calls. Just the number you need.
          </p>
          <Link href="/waitlist">
            <button style={{ padding: '16px 36px', borderRadius: 10, background: 'var(--color-base)', color: 'var(--color-accent)', border: 'none', fontSize: 17, fontWeight: 700, cursor: 'pointer' }}>
              Join the waitlist →
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
