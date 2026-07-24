'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Shared waitlist signup logic — extracted from app/waitlist/page.tsx so the
 * /waitlist route and WaitlistModal consume ONE signup path (same API route,
 * same honeypot, same referral/UTM capture). Per DECISIONS.md 2026-07-23:
 * name + email only, no phone, no SMS surface.
 *
 * Referral code and UTM params are read from window.location at submit time
 * (not useSearchParams) so consumers don't need a Suspense boundary.
 */
export function useWaitlistSignup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot — never shown to real users
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [positionNumber, setPositionNumber] = useState(0)
  const [referralLink, setReferralLink] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      try {
        const res = await fetch('/api/waitlist/stats')
        if (res.ok && !cancelled) {
          const data = await res.json()
          setSpotsRemaining(data.spots_remaining)
        }
      } catch {
        // Non-critical — counter just won't render if this fails
      }
    }
    loadStats()
    return () => {
      cancelled = true
    }
  }, [])

  const submit = useCallback(async (): Promise<boolean> => {
    setError('')

    if (!name.trim()) {
      setError('Please enter your name')
      return false
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return false
    }

    setLoading(true)
    try {
      const params = new URLSearchParams(window.location.search)
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          referral_code: params.get('ref'),
          utm_source: params.get('utm_source'),
          utm_medium: params.get('utm_medium'),
          utm_campaign: params.get('utm_campaign'),
          utm_content: params.get('utm_content'),
          website
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to join waitlist')
        return false
      }

      setSubmitted(true)
      // The honeypot path returns a bare success with no position/referral
      // fields (deliberately, so bots learn nothing). Autofill can trip it
      // for a real user — degrade to a generic success, never crash.
      setPositionNumber(data.position_number ?? 0)
      setReferralCode(data.referralCode ?? '')
      setReferralLink(data.referralLink ?? '')
      return true
    } catch {
      setError('An error occurred. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [name, email, website])

  return {
    name,
    setName,
    email,
    setEmail,
    website,
    setWebsite,
    loading,
    submitted,
    error,
    positionNumber,
    referralCode,
    referralLink,
    spotsRemaining,
    isFounding: positionNumber > 0 && positionNumber <= 500,
    submit
  }
}
