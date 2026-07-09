'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

interface Trade {
  id: string
  name: string
}

// Pre-launch contractor waitlist capture. Deliberately minimal:
// four fields, no password, no onboarding — per the frictionless
// design principle in docs/LAUNCH_PLAN.md.
export function WaitlistForm() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [businessName, setBusinessName] = useState('')
  const [trade, setTrade] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('trades').select('id, name').eq('active', true).order('name')
      .then(({ data }) => setTrades(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName, trade, zipCode, email })
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong — try again')
      setLoading(false)
      return
    }
    setJoined(true)
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#F7F5F1', fontSize: 14, outline: 'none'
  }

  if (joined) {
    return (
      <div style={{
        padding: '20px 24px', borderRadius: 12,
        background: 'rgba(46, 139, 87, 0.10)', border: '1px solid rgba(46, 139, 87, 0.25)',
        display: 'flex', gap: 12, alignItems: 'flex-start'
      }}>
        <Check style={{ width: 18, height: 18, color: '#2E8B57', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ color: '#2E8B57', fontWeight: 700, fontSize: 15, margin: 0 }}>You&apos;re on the list.</p>
          <p style={{ color: '#C0CDD8', fontSize: 14, lineHeight: 1.6, margin: '4px 0 0' }}>
            We&apos;ll reach out the moment homeowner demand opens up in your area — early
            members get first access to their ZIP.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <input
          type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
          required placeholder="Business name" style={inputStyle}
        />
        <select
          value={trade} onChange={e => setTrade(e.target.value)} required
          style={{ ...inputStyle, color: trade ? '#F7F5F1' : '#6B8090' }}
        >
          <option value="" disabled>Your trade</option>
          {trades.map(t => (
            <option key={t.id} value={t.name} style={{ color: '#12181F' }}>{t.name}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
        <input
          type="text" inputMode="numeric" value={zipCode}
          onChange={e => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
          required placeholder="ZIP code" maxLength={5} style={inputStyle}
        />
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          required placeholder="you@yourbusiness.com" style={inputStyle}
        />
      </div>
      {error && <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{error}</p>}
      <button
        type="submit" disabled={loading}
        style={{
          padding: '14px 0', borderRadius: 10, background: '#E8722C', color: '#fff',
          border: 'none', fontSize: 15, fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Joining...' : 'Claim my ZIP — join the waitlist'}
      </button>
      <p style={{ color: '#4A6070', fontSize: 12, margin: 0, textAlign: 'center' }}>
        No password, no payment, no commitment — just first access when your area opens.
      </p>
    </form>
  )
}
