'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'
import { Mail, MessageCircle } from 'lucide-react'

const FAQS = [
  {
    q: 'Is Groundwork free for homeowners?',
    a: 'Yes. Creating an account and getting an AI estimate is completely free. You only pay if you want to unlock the full itemized breakdown (a one-time $9 unlock) — the estimate range itself is always free.'
  },
  {
    q: 'How is the estimate calculated?',
    a: 'Our AI pulls from a database of real completed jobs in your ZIP code — not national averages. It factors in trade type, scope, materials, labor rates in your area, and timing. The more detail you give us, the sharper the estimate.'
  },
  {
    q: 'How are contractors verified?',
    a: 'Every contractor submits proof of a valid contractor\'s license and general liability insurance before going live on Groundwork. We don\'t accept self-reported claims. See our Contractor Verification page for the full methodology.'
  },
  {
    q: 'What if I don\'t like any of the contractors I\'m matched with?',
    a: 'You\'re always in control. Pass on any match and Groundwork will surface others. You never have to engage with anyone you don\'t want to.'
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
    background: '#fff',
    border: '1.5px solid #E0DBD4',
    color: '#12181F',
    fontSize: 15,
    outline: 'none'
  }

  return (
    <div style={{ background: '#F7F5F1', minHeight: '100vh' }}>
      <header style={{ background: '#0C1118', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ marginBottom: 60 }}>
          <h1 style={{ color: '#12181F', fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Contact & Support
          </h1>
          <p style={{ color: '#6B7280', fontSize: 17 }}>
            We read every message. Expect a response within one business day.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48 }}>

          {/* Contact form */}
          <div>
            <h2 style={{ color: '#12181F', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Send us a message</h2>

            {submitted ? (
              <div style={{
                background: '#EDFAF3', border: '1px solid #B7EDD4',
                borderRadius: 16, padding: '32px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <h3 style={{ color: '#12181F', fontWeight: 700, marginBottom: 8 }}>Message received</h3>
                <p style={{ color: '#6B7280', fontSize: 14 }}>
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
                    <label style={{ display: 'block', color: '#374151', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
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
                  <label style={{ display: 'block', color: '#374151', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
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
                  background: '#E8722C', color: '#fff',
                  border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer'
                }}>
                  Send message
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail style={{ width: 16, height: 16, color: '#E8722C' }} />
                <a href="mailto:hello@groundworkapp.com" style={{ color: '#12181F', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                  hello@groundworkapp.com
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageCircle style={{ width: 16, height: 16, color: '#4A6B8A' }} />
                <span style={{ color: '#6B7280', fontSize: 14 }}>Typical response time: &lt; 1 business day</span>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 style={{ color: '#12181F', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Frequently asked questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {FAQS.map((faq, i) => (
                <div key={i} style={{
                  borderBottom: '1px solid #E8E4DE',
                  paddingBottom: 20,
                  marginBottom: 20
                }}>
                  <h3 style={{ color: '#12181F', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    {faq.q}
                  </h3>
                  <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7 }}>{faq.a}</p>
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
