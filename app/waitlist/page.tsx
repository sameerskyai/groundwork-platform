'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { ChevronRight, Mail, CheckCircle2 } from 'lucide-react'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [tcpaConsent, setTcpaConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [referralLink, setReferralLink] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validation
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    if (!tcpaConsent) {
      setError('Please agree to the TCPA consent')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to join waitlist')
        setLoading(false)
        return
      }

      setSubmitted(true)
      setReferralLink(data.referralLink || `${window.location.origin}/waitlist?ref=${data.userId}`)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      {/* Hero Section with Video */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            backgroundColor: 'var(--color-surface-secondary)',
            opacity: 0.3
          }}
        >
          <source src="/videos/groundwork-intro.mp4" type="video/mp4" />
        </video>

        <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
            Find Your Perfect Contractor
          </h1>
          <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            AI-powered matching connects you with vetted, local contractors who fit your project. No ads, no middleman.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
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

              <label className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <input
                  type="checkbox"
                  checked={tcpaConsent}
                  onChange={e => setTcpaConsent(e.target.checked)}
                  className="mt-1 w-4 h-4"
                  style={{ accentColor: 'var(--color-brand)' }}
                />
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  I agree to receive SMS and email updates from Groundwork. Message and data rates may apply. See our{' '}
                  <Link href="/privacy" className="underline" style={{ color: 'var(--color-brand)' }}>
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

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Joining...' : 'Join the Waitlist'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                We'll let you in as soon as your area is live.
              </p>
            </form>
          ) : (
            <div className="max-w-md mx-auto space-y-4 p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
              <CheckCircle2 className="w-16 h-16 mx-auto" style={{ color: 'var(--color-success)' }} />
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                You're on the list!
              </h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Check your email for next steps. In the meantime, share your unique link to move up the queue.
              </p>

              <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-primary)]">
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
                    onClick={() => {
                      navigator.clipboard.writeText(referralLink)
                    }}
                    className="px-3 py-2 rounded text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--color-brand)',
                      color: 'white'
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Share this link with friends and get early access when they join.
              </p>

              <Link href="/">
                <Button variant="secondary" size="lg" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

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
