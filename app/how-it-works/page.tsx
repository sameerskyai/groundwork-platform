'use client'

import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'
import { SwipeDemo } from '@/components/swipe/SwipeDemo'
import { ArrowRight } from 'lucide-react'

export default function HowItWorksPage() {
  return (
    <div style={{ background: '#F7F5F1', minHeight: '100vh' }}>
      <header style={{ background: '#0C1118', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
          <Link href="/signup?role=homeowner">
            <button style={{ padding: '10px 20px', borderRadius: 8, background: '#E8722C', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Get my free estimate
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: '#12181F', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h1 style={{ color: '#F7F5F1', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
            How Groundwork works
          </h1>
          <p style={{ color: '#6B8090', fontSize: 17, lineHeight: 1.7 }}>
            From project description to contractor match in under three minutes. Here&apos;s exactly what happens.
          </p>
        </div>
      </section>

      {/* Step 1 */}
      <section style={{ padding: '90px 24px', background: '#F7F5F1' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '6rem', fontWeight: 700, color: '#E8E4DE', lineHeight: 1, marginBottom: 12 }}>01</div>
            <h2 style={{ color: '#12181F', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Describe your project
            </h2>
            <p style={{ color: '#6B7280', fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
              Tell us what you need done in plain language. Add photos if you have them — a picture of the existing space helps our AI understand scope far better than text alone.
            </p>
            <p style={{ color: '#6B7280', fontSize: 16, lineHeight: 1.8 }}>
              Our AI will ask follow-up questions to clarify details that significantly affect cost: square footage, materials, whether you have existing structure to remove, timeline urgency. This takes about 90 seconds.
            </p>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px', border: '1px solid #E8E4DE' }}>
            <div style={{ background: '#F7F5F1', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
              <div style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Your description</div>
              <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.7 }}>&ldquo;I need my kitchen renovated. It&apos;s a galley kitchen from the 1960s that I want to open up into the dining room. New cabinets, countertops, and appliances.&rdquo;</p>
            </div>
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '16px' }}>
              <div style={{ color: '#0369A1', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>AI follow-up questions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['What\'s the approximate square footage of the kitchen?', 'Are you moving any plumbing or electrical?', 'What material are you thinking for countertops?', 'Do you have a rough budget range in mind?'].map(q => (
                  <div key={q} style={{ color: '#374151', fontSize: 13, display: 'flex', gap: 6 }}>
                    <span>→</span> <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2 */}
      <section id="estimates" style={{ padding: '90px 24px', background: '#12181F' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px' }}>
            <div style={{ color: '#E8722C', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Your AI estimate</div>
            <div style={{ fontFamily: 'monospace', fontSize: 40, fontWeight: 700, color: '#F7F5F1', marginBottom: 4 }}>$18k–$22k</div>
            <div style={{ color: '#6B8090', fontSize: 13, marginBottom: 20 }}>Based on 47 completed kitchen jobs in Bethesda, MD</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Labor (demo + installation)', amount: '$7,200–$9,100' },
                { label: 'Custom cabinetry', amount: '$4,800–$6,000' },
                { label: 'Countertops (quartz)', amount: '$2,400–$3,200' },
                { label: 'Appliances (mid-range)', amount: '$2,800–$3,500' },
                { label: 'Plumbing + electrical', amount: '$800–$1,200' }
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                  <span style={{ color: '#C0CDD8', fontSize: 13 }}>{item.label}</span>
                  <span style={{ color: '#F7F5F1', fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '6rem', fontWeight: 700, color: 'rgba(255,255,255,0.08)', lineHeight: 1, marginBottom: 12 }}>02</div>
            <h2 style={{ color: '#F7F5F1', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Get a real cost breakdown
            </h2>
            <p style={{ color: '#6B8090', fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
              In under a minute, you get an estimate range based on completed jobs near you — not national averages, not Zillow-style guesses. Real projects that actually happened in your ZIP code.
            </p>
            <p style={{ color: '#6B8090', fontSize: 16, lineHeight: 1.8 }}>
              Unlock the full breakdown for $9 to see itemized labor, materials, timeline, and a shareable report you can bring into any contractor conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Step 3 — Swipe */}
      <section style={{ padding: '90px 24px', background: '#F7F5F1' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '6rem', fontWeight: 700, color: '#E8E4DE', lineHeight: 1, marginBottom: 12 }}>03</div>
            <h2 style={{ color: '#12181F', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Swipe to pick your contractor
            </h2>
            <p style={{ color: '#6B7280', fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
              Groundwork surfaces verified contractors who match your specific trade, your ZIP code, and your budget range. They appear as cards you can swipe through — like browsing, but for someone who&apos;ll actually show up.
            </p>
            <p style={{ color: '#6B7280', fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}>
              Swipe right to show interest — the contractor sees your project and can respond. Swipe left to pass and move on. Your contact information is never shared until you choose to share it.
            </p>
            <Link href="/signup?role=homeowner">
              <button style={{ padding: '13px 24px', borderRadius: 10, background: '#E8722C', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Try it now <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </Link>
          </div>
          <div>
            <SwipeDemo compact />
          </div>
        </div>
      </section>

      {/* After the match */}
      <section style={{ padding: '80px 24px', background: '#12181F' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#F7F5F1', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            After the match
          </h2>
          <p style={{ color: '#6B8090', fontSize: 16, lineHeight: 1.8, marginBottom: 48 }}>
            Once you match with a contractor, you chat in-platform. Schedule a site visit, negotiate scope, finalize pricing — all in one place. When the job is done and verified, the final cost goes into our database so the next homeowner gets a sharper estimate.
          </p>
          <Link href="/signup?role=homeowner">
            <button style={{ padding: '15px 32px', borderRadius: 10, background: '#E8722C', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Get started — it&apos;s free →
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
