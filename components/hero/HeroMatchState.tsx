'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Loader2, MapPin, Bell } from 'lucide-react'

type State = 'idle' | 'checking' | 'ready' | 'low' | 'error'

interface DensityResult {
  zip: string
  city: string | null
  count: number
  ready: boolean
}

export function HeroMatchState() {
  const [zip, setZip] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<DensityResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function checkZip(value: string) {
    const clean = value.replace(/\D/g, '').slice(0, 5)
    setZip(clean)
    if (clean.length !== 5) return
    setState('checking')
    try {
      const res = await fetch(`/api/density?zip=${clean}`)
      if (!res.ok) { setState('error'); return }
      const data: DensityResult = await res.json()
      setResult(data)
      setState(data.ready ? 'ready' : 'low')
    } catch {
      setState('error')
    }
  }

  return (
    <div>
      {/* Primary CTAs — always visible */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <Link href="/signup?role=homeowner">
          <button style={{
            padding: '15px 28px', borderRadius: 10,
            background: '#E8722C', color: '#fff',
            border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            {state === 'ready' ? 'Get matched free' : 'Get my estimate free'}
            <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </Link>
        <Link href="/signup?role=contractor">
          <button style={{
            padding: '15px 28px', borderRadius: 10,
            background: 'transparent', color: '#C0CDD8',
            border: '1px solid rgba(255,255,255,0.12)',
            fontSize: 16, fontWeight: 600, cursor: 'pointer'
          }}>
            I&apos;m a contractor
          </button>
        </Link>
      </div>

      {/* ZIP density checker */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 10, overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <MapPin style={{ width: 14, height: 14, color: '#6B8090', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={zip}
              onChange={e => checkZip(e.target.value)}
              placeholder="Enter ZIP to check availability"
              maxLength={5}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#F7F5F1', fontSize: 14, width: 200,
                '::placeholder': { color: '#4A6070' }
              } as React.CSSProperties}
            />
          </div>
          <div style={{ padding: '10px 14px', minWidth: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {state === 'checking' && (
              <Loader2 style={{ width: 14, height: 14, color: '#6B8090', animation: 'spin 1s linear infinite' }} />
            )}
            {state === 'ready' && (
              <span style={{ color: '#2E8B57', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check style={{ width: 13, height: 13 }} /> Available
              </span>
            )}
            {state === 'low' && (
              <span style={{ color: '#E8722C', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Bell style={{ width: 13, height: 13 }} /> Coming soon
              </span>
            )}
            {state === 'idle' && (
              <span style={{ color: '#3A5060', fontSize: 13 }}>Check area</span>
            )}
            {state === 'error' && (
              <span style={{ color: '#6B7280', fontSize: 13 }}>Try again</span>
            )}
          </div>
        </div>
      </div>

      {/* State-specific message */}
      {state === 'ready' && result && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(46, 139, 87, 0.10)',
          border: '1px solid rgba(46, 139, 87, 0.25)',
          borderRadius: 10, marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 10, maxWidth: 460
        }}>
          <Check style={{ width: 15, height: 15, color: '#2E8B57', flexShrink: 0, marginTop: 2 }} />
          <div>
            <span style={{ color: '#2E8B57', fontWeight: 700, fontSize: 14 }}>
              {result.count} verified contractor{result.count !== 1 ? 's' : ''} near {result.city ?? result.zip}
            </span>
            <span style={{ color: '#4A6070', fontSize: 14 }}>
              {' '}— matching is open in your area.
            </span>
          </div>
        </div>
      )}

      {state === 'low' && result && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(232, 114, 44, 0.08)',
          border: '1px solid rgba(232, 114, 44, 0.20)',
          borderRadius: 10, marginBottom: 20, maxWidth: 460
        }}>
          <p style={{ color: '#C0CDD8', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            <span style={{ color: '#E8722C', fontWeight: 700 }}>We&apos;re building your contractor network{result.city ? ` in ${result.city}` : ''}. </span>
            Get your estimate now — we&apos;ll notify you the moment matching opens in your area.
          </p>
          <Link href={`/signup?role=homeowner&zip=${result.zip}&waitlist=true`}>
            <button style={{
              marginTop: 12,
              padding: '9px 18px', borderRadius: 8,
              background: '#E8722C', color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}>
              Get my estimate + notify me →
            </button>
          </Link>
        </div>
      )}

      {/* Trust signals */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {['No credit card required', 'Estimate in 30 seconds', 'Your data is never sold'].map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check style={{ width: 13, height: 13, color: '#2E8B57' }} />
            <span style={{ color: '#4A6070', fontSize: 13 }}>{t}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
