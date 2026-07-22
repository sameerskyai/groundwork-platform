'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { ChevronRight, CheckCircle2 } from 'lucide-react'
import { ExplodedHouseHero } from '@/components/waitlist/ExplodedHouseHero'
import { Problem, Shift, MechanicsPanels, EightyGate, FoundingTiers } from '@/components/waitlist/ScrollNarrative'

function WaitlistContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [positionNumber, setPositionNumber] = useState(0)
  const [referralLink, setReferralLink] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [website, setWebsite] = useState('') // honeypot — never shown to real users
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null)

  const referrerCode = searchParams?.get('ref')

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/waitlist/stats')
        if (res.ok) {
          const data = await res.json()
          setSpotsRemaining(data.spots_remaining)
        }
      } catch {
        // Non-critical — counter just won't render if this fails
      }
    }
    loadStats()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    if (!smsConsent) {
      setError('Please agree to receive updates')
      return
    }

    setLoading(true)
    try {
      const utm_source = searchParams?.get('utm_source')
      const utm_medium = searchParams?.get('utm_medium')
      const utm_campaign = searchParams?.get('utm_campaign')
      const utm_content = searchParams?.get('utm_content')

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          sms_consent: smsConsent,
          referral_code: referrerCode,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_content,
          website
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to join waitlist')
        setLoading(false)
        return
      }

      setSubmitted(true)
      setPositionNumber(data.position_number)
      setReferralCode(data.referralCode)
      setReferralLink(data.referralLink)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const spotsCounter = spotsRemaining !== null && (
    <p className="mb-5 text-sm font-medium" style={{ color: 'var(--color-brand-text)' }}>
      {spotsRemaining > 0
        ? `${spotsRemaining} of 500 Founding Member spots left`
        : 'Founding 500 is full — join the general waitlist'}
    </p>
  )

  // Renders once, at the hero position only -- previously this was
  // returned from both hero and final-CTA renderForm() calls, so a real
  // submission showed the referral card twice on the page (CodeRabbit
  // catch on PR #5). The final CTA collapses to a short pointer back up
  // instead once submitted; see successPointer below.
  function renderSuccess() {
    return (
      <div className="max-w-md mx-auto space-y-4 p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
        <CheckCircle2 className="w-16 h-16 mx-auto" style={{ color: 'var(--color-success)' }} />
        <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          You&apos;re #{positionNumber}!
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Check your email for next steps. Share your referral link to move up the queue.
        </p>

        <div className="p-4 rounded-lg" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-primary)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Your Referral Link
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 px-3 py-2 rounded text-sm"
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)'
              }}
            />
            <button
              onClick={() => navigator.clipboard.writeText(referralLink)}
              className="px-3 py-2 rounded text-sm font-medium whitespace-nowrap"
              style={{ backgroundColor: 'var(--color-brand-solid)', color: 'var(--color-text-inverse)' }}
            >
              Copy
            </button>
          </div>
        </div>

        <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--color-brand-lighter)', color: 'var(--color-brand-text)' }}>
          <p className="text-sm font-medium">Your referral code: <span className="font-mono font-bold">{referralCode}</span></p>
        </div>

        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Each friend who joins moves you up ~100 spots. Share to unlock exclusive perks!
        </p>

        <Link href="/home">
          <Button size="lg" className="w-full">
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  // Pre-submit form only now -- shared between the hero (compact) and
  // final-CTA (full) placements, one set of state, one submit handler.
  function renderForm(compact: boolean) {
    return (
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto space-y-4 p-6 rounded-2xl"
        style={{
          backgroundColor: 'var(--color-surface-primary)',
          border: '1px solid var(--color-border)',
          boxShadow: compact ? 'var(--shadow-lg)' : 'none'
        }}
      >
        <input
          type="text"
          name="website"
          value={website}
          onChange={e => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
        />

        <Input
          type="text"
          label="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Sarah Johnson"
          required
        />

        <Input
          type="email"
          label="Email Address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="sarah@example.com"
          required
        />

        <Input
          type="tel"
          label="Phone Number (Optional)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />

        <label className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
          <input
            type="checkbox"
            checked={smsConsent}
            onChange={e => setSmsConsent(e.target.checked)}
            className="mt-1 w-4 h-4"
            style={{ accentColor: 'var(--color-brand)' }}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            I agree to receive SMS and email updates from Groundwork. Message and data rates may apply. See our{' '}
            <Link href="/privacy" className="underline" style={{ color: 'var(--color-brand-text)' }}>
              Privacy Policy
            </Link>{' '}
            for details.
          </span>
        </label>

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Joining...' : 'Join the Waitlist'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>

        {!compact && (
          <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            We&apos;ll let you in as soon as your area is live.
          </p>
        )}
      </form>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      {/* Beat 1 — Hero: the gamble. House + headline + form + counter, all above the fold. */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(184, 115, 51, 0.08) 0%, rgba(201, 143, 85, 0.10) 100%)',
          backgroundColor: 'var(--color-surface-secondary)'
        }}
      >
        <div className="relative z-10 max-w-2xl mx-auto px-6 pt-16 text-center">
          <div className="mb-6 inline-block px-4 py-2 rounded-full text-sm" style={{ backgroundColor: 'var(--color-brand-lighter)', color: 'var(--color-brand-text)' }}>
            ✓ Trusted by homeowners nationwide
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 10vw, 3.5rem)', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-text-primary)', lineHeight: 1.1 }}>
            Stop gambling on contractors.
          </h1>
          <p style={{ fontSize: 'clamp(1.125rem, 3vw, 1.25rem)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Free AI estimates + contractors matched at 80%+ compatibility. Northern Virginia first.
          </p>

          {!submitted && spotsCounter}
          {submitted ? renderSuccess() : renderForm(true)}
        </div>

        <ExplodedHouseHero />
      </div>

      <Problem />
      <Shift />
      <MechanicsPanels />
      <EightyGate />
      <FoundingTiers />

      {/* Beat 7 — Final CTA: the form again + the position moment.
          Collapses to a short pointer once submitted rather than
          duplicating the success/referral card a second time. */}
      <div className="py-24" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 700, marginBottom: '2rem', color: 'var(--color-text-primary)' }}>
            {submitted ? 'You’re in.' : 'Get your number before your neighbor does.'}
          </h2>
          {submitted ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>
              You&apos;re #{positionNumber} on the list — your referral link is up top.
            </p>
          ) : (
            <>
              {spotsCounter}
              {renderForm(false)}
            </>
          )}
        </div>
      </div>

      <Leaderboard />

      {/* Footer */}
      <footer className="px-6 py-4 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <p>© 2026 Groundwork. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

interface LeaderboardEntry {
  display_name: string
  verified_referral_count: number
}

function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch('/api/waitlist/leaderboard')
        if (res.ok) {
          const data = await res.json()
          setEntries(data.leaderboard ?? [])
        }
      } catch {
        // Non-critical — section just won't render
      }
    }
    loadLeaderboard()
  }, [])

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="px-6 py-16" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--color-text-primary)' }}>
          Top Referrers
        </h2>
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div
              key={`${entry.display_name}-${i}`}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-surface-primary)', border: '1px solid var(--color-border)' }}
            >
              <span style={{ color: 'var(--color-text-primary)' }}>
                <span className="font-mono text-sm mr-3" style={{ color: 'var(--color-text-tertiary)' }}>#{i + 1}</span>
                {entry.display_name}
              </span>
              <span className="font-bold" style={{ color: 'var(--color-brand-text)' }}>
                {entry.verified_referral_count} {entry.verified_referral_count === 1 ? 'referral' : 'referrals'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <WaitlistContent />
    </Suspense>
  )
}
