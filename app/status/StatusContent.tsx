'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface StatusResult {
  firstName: string
  position_number: number
  verified_referral_count: number
  founding_500: boolean
}

// Mirrors the server-side rule in app/api/waitlist/status/route.ts —
// codes are stored uppercase alphanumeric, max 12 chars.
const CODE_PATTERN = /^[A-Z0-9]{1,12}$/

// Founders Program canon (DECISIONS.md 2026-07-24).
const TIERS = [
  { threshold: 3, reward: 'Founding Member status' },
  { threshold: 5, reward: 'free Home Backstory report at launch' },
  { threshold: 10, reward: 'Laywork+ locked at $49/yr for life' }
] as const

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--outline-color)]'

/**
 * /status — referral status lookup.
 *
 * Reads ?code= from window.location inside an effect (deliberately NOT
 * useSearchParams, which would force a Suspense boundary) and auto-loads.
 * The lookup button is the single solid-blue element of this viewport, so
 * the copy button uses the quiet outlined-accent variant (same rule as the
 * HomeNav CTA).
 */
export function StatusContent() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<StatusResult | null>(null)
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyAnnouncement, setCopyAnnouncement] = useState('')
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lookup = useCallback(async (raw: string) => {
    const normalized = raw.trim().toUpperCase()

    if (!CODE_PATTERN.test(normalized)) {
      setResult(null)
      setError(
        'That code doesn’t look right — codes are letters and numbers only, up to 12 characters.'
      )
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/waitlist/status?code=${encodeURIComponent(normalized)}`
      )

      if (res.status === 404) {
        setResult(null)
        setError(
          'We couldn’t find that code. Double-check it against your signup confirmation.'
        )
        return
      }

      if (!res.ok) {
        setResult(null)
        setError('Something went wrong loading your status. Please try again.')
        return
      }

      const data: StatusResult = await res.json()
      setResult(data)
      // Rebuilt client-side from the current origin — the API never has to
      // know the deployment URL.
      setReferralLink(`${window.location.origin}/waitlist?ref=${normalized}`)
    } catch {
      setResult(null)
      setError('Something went wrong loading your status. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-load from /status?code=… — window.location read at effect time
  // keeps this a plain client component (no Suspense requirement).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('code')
    if (param) {
      const normalized = param.trim().toUpperCase()
      setCode(normalized)
      lookup(normalized)
    }
  }, [lookup])

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current)
    }
  }, [])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    lookup(code)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setCopyAnnouncement('Referral link copied to clipboard.')
      if (copyResetRef.current) clearTimeout(copyResetRef.current)
      copyResetRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyAnnouncement(
        'Copy failed — select the link text and copy it manually.'
      )
    }
  }

  return (
    <main
      id="main"
      className="mx-auto w-full max-w-xl flex-1 px-4 pb-24 pt-16 sm:px-6 sm:pt-20"
    >
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
        Check your status
      </h1>
      <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
        Enter the referral code from your signup confirmation to see your
        waitlist position and Founders Program progress.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="status-code"
            className="text-sm font-medium text-[var(--color-ink)]"
          >
            Your referral code
          </label>
          {/* Soft-filled field, borderless at rest — same pattern as the
              waitlist modal inputs. 16px so iOS doesn't zoom. */}
          <input
            id="status-code"
            name="code"
            type="text"
            value={code}
            onChange={event => setCode(event.target.value)}
            placeholder="e.g. X4Z8AZ"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            className={`h-12 rounded-[var(--radius-md)] border border-transparent bg-[var(--color-base-alt)] px-4 text-[16px] uppercase text-[var(--color-ink)] transition-colors placeholder:normal-case placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:bg-[var(--color-base)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_15%,transparent)] focus:outline-none`}
          />
        </div>

        {/* The one solid-blue element in this viewport. */}
        <button
          type="submit"
          disabled={loading}
          className={`inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-6 text-sm font-semibold text-[var(--color-base)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent)_85%,var(--color-ink))] disabled:opacity-60 ${FOCUS_RING}`}
        >
          {loading ? 'Looking up…' : 'Look up my status'}
        </button>
      </form>

      {/* Persistent live region — errors are announced without a re-mount.
          Glyph + text carry the meaning; color is reinforcement only. */}
      <div aria-live="polite" className="mt-4 min-h-6">
        {error && (
          <p className="flex items-start gap-2 text-sm text-[var(--color-alert)]">
            <span aria-hidden="true">{'⚠'}</span>
            <span>{error}</span>
          </p>
        )}
      </div>

      {result && (
        <section
          aria-label="Your waitlist status"
          className="mt-10 flex flex-col gap-8 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-base)] p-6 sm:p-8"
        >
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm font-medium text-[var(--color-text-muted)]">
              {result.firstName
                ? `${result.firstName}, here’s where you stand.`
                : 'Here’s where you stand.'}
            </p>
            <p className="text-5xl font-bold leading-none tracking-tight text-[var(--color-ink)] tabular-nums sm:text-6xl">
              You&apos;re #{result.position_number}
            </p>

            {result.founding_500 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-accent)_30%,var(--color-line))] bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-base))] px-4 py-1.5 text-sm font-semibold text-[var(--color-accent)]">
                <span aria-hidden="true">{'◆'}</span>
                Founding Member
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 rounded-[var(--radius-lg)] bg-[var(--color-base-alt)] p-4 sm:p-5">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              Your referral link
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                aria-label="Your referral link"
                onFocus={event => event.currentTarget.select()}
                className={`h-11 min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base)] px-3 text-[16px] text-[var(--color-ink)] ${FOCUS_RING}`}
              />
              {/* Outlined accent — the solid blue of this viewport belongs
                  to the lookup button above. */}
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex h-11 min-w-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-base))] ${FOCUS_RING}`}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <span aria-live="polite" className="sr-only">
              {copyAnnouncement}
            </span>
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
              Each verified referral moves you up about 100 spots.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">
              Referral rewards
            </h2>
            <ul className="flex flex-col">
              {TIERS.map(tier => {
                const reached = result.verified_referral_count >= tier.threshold
                const shown = Math.min(
                  result.verified_referral_count,
                  tier.threshold
                )
                return (
                  <li
                    key={tier.threshold}
                    className="flex min-h-11 items-center gap-3 border-b border-[var(--color-line)] py-2 text-sm leading-relaxed text-[var(--color-ink)] last:border-b-0"
                  >
                    <span
                      aria-hidden="true"
                      className={`w-5 flex-none text-center font-semibold ${
                        reached
                          ? 'text-[var(--color-verified)]'
                          : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      {reached ? '✓' : '·'}
                    </span>
                    <span>
                      <span className="font-semibold tabular-nums">
                        {shown} of {tier.threshold}
                      </span>
                      {' — '}
                      {tier.reward}
                      {reached && <span className="sr-only"> (reached)</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}
    </main>
  )
}
