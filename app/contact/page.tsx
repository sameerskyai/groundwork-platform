'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'
import { Mail, MessageCircle } from 'lucide-react'

const FAQS = [
  {
    q: 'Is Laywork free for homeowners?',
    a: 'Yes. Creating an account and getting an AI estimate is completely free. You only pay if you want to unlock the full itemized breakdown (a one-time $9 unlock) — the estimate range itself is always free.'
  },
  {
    q: 'How is the estimate calculated?',
    a: 'Our AI pulls from a database of real completed jobs in your ZIP code — not national averages. It factors in trade type, scope, materials, labor rates in your area, and timing. The more detail you give us, the sharper the estimate.'
  },
  {
    q: 'How are contractors verified?',
    a: 'Every contractor submits proof of a valid contractor\'s license and general liability insurance before going live on Laywork. We don\'t accept self-reported claims. See our Contractor Verification page for the full methodology.'
  },
  {
    q: 'What if I don\'t like any of the contractors I\'m matched with?',
    a: 'You\'re always in control. Pass on any match and Laywork will surface others. You never have to engage with anyone you don\'t want to.'
  },
  {
    q: 'Is my contact information shared with contractors?',
    a: 'Not automatically. When you match with a contractor, they can see your project description, photos, and ZIP code. Your name and contact info are only shared when you choose to share them directly through messaging.'
  },
  {
    q: 'I\'m a contractor — how does pricing work?',
    a: 'Two flat monthly tiers: Standard ($79/mo, 5 job requests per day) and Growth ($149/mo, 20 requests per day). No per-job fees, no commissions, no surprises. Cancel anytime.'
  },
  {
    q: 'My project is complete. How do I add it to the Neighborhood Feed?',
    a: 'After marking a project complete, you\'ll see an option to contribute it to the anonymous feed. We\'ll ask for the final cost and a brief summary — never your full address. This helps other homeowners in your area get better estimates.'
  }
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    background: 'var(--color-base)',
    border: '1.5px solid var(--color-line)',
    color: 'var(--color-ink)',
    fontSize: 15,
    outline: 'none'
  }

  return (
    <div style={{ background: 'var(--color-base-alt)', minHeight: '100vh' }}>
      <header style={{ background: 'var(--color-ink)', borderBottom: '1px solid color-mix(in srgb, var(--color-base) 6%, transparent)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ marginBottom: 60 }}>
          <h1 style={{ color: 'var(--color-ink)', fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Contact & Support
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 17 }}>
            We read every message. Expect a response within one business day.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48 }}>

          {/* Contact form */}
          <div>
            <h2 style={{ color: 'var(--color-ink)', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Send us a message</h2>

            {submitted ? (
              <div style={{
                background: 'color-mix(in srgb, var(--color-verified) 8%, var(--color-base))', border: '1px solid color-mix(in srgb, var(--color-verified) 30%, var(--color-base))',
                borderRadius: 16, padding: '32px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <h3 style={{ color: 'var(--color-ink)', fontWeight: 700, marginBottom: 8 }}>Message received</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                  We&apos;ll get back to you at {form.email} within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Your name', field: 'name' as const, type: 'text', placeholder: 'Full name' },
                  { label: 'Email', field: 'email' as const, type: 'email', placeholder: 'you@example.com' },
                  { label: 'Subject', field: 'subject' as const, type: 'text', placeholder: 'What is this about?' }
                ].map(f => (
                  <div key={f.field}>
                    <label style={{ display: 'block', color: 'var(--color-ink)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      required
                      placeholder={f.placeholder}
                      value={form[f.field]}
                      onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', color: 'var(--color-ink)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                    Message
                  </label>
                  <textarea
                    required
                    placeholder="Tell us what you need..."
                    rows={5}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <button type="submit" style={{
                  padding: '13px 24px', borderRadius: 10,
                  background: 'var(--color-accent)', color: 'var(--color-base)',
                  border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer'
                }}>
                  Send message
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail style={{ width: 16, height: 16, color: 'var(--color-accent)' }} />
                <a href="mailto:hello@groundworkapp.com" style={{ color: 'var(--color-ink)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                  hello@groundworkapp.com
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageCircle style={{ width: 16, height: 16, color: 'var(--color-text-muted)' }} />
                <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Typical response time: &lt; 1 business day</span>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 style={{ color: 'var(--color-ink)', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Frequently asked questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {FAQS.map((faq, i) => (
                <div key={i} style={{
                  borderBottom: '1px solid var(--color-line)',
                  paddingBottom: 20,
                  marginBottom: 20
                }}>
                  <h3 style={{ color: 'var(--color-ink)', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    {faq.q}
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.7 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
