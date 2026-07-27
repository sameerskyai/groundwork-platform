'use client'

import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { HomeFooter } from '@/components/home/HomeFooter'
import { HomeNav } from '@/components/home/HomeNav'
import { Reveal } from '@/components/home/Reveal'
import { WaitlistModalTrigger } from '@/components/waitlist/WaitlistModal'

/**
 * Public referral leaderboard — top 25 waitlist referrers, first name +
 * last initial only (PII rule: a full last name is never rendered).
 * Blue/White/Black tokens only — see app/styles/design-tokens.css and
 * DECISIONS.md 2026-07-24.
 *
 * Accent discipline: one solid-blue element per viewport. When the list has
 * data, the hero carries no solid fill and the final CTA section owns the
 * only one. In the empty/unavailable state the hero CTA takes its viewport's
 * fill and the final CTA sits in its own viewport below.
 */

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--outline-color)]'

const EYEBROW =
  'text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]'

/** The solid blue CTA — the one accent-filled element its viewport is allowed. */
function SolidWaitlistCta() {
  return (
    <WaitlistModalTrigger
      className={`group inline-flex min-h-14 items-center gap-3 rounded-full bg-[var(--color-accent)] py-2 pl-7 pr-2 text-base font-medium text-[var(--color-base)] transition-[background-color,transform] duration-300 ease-[var(--ease-out-expo)] hover:bg-[var(--color-interactive-hover)] active:scale-[0.98] motion-reduce:transition-none ${FOCUS_RING}`}
    >
      Join the waitlist
      <span
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-base)_16%,transparent)] transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 motion-reduce:transition-none"
      >
        <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
      </span>
    </WaitlistModalTrigger>
  )
}

type LeaderboardRow = {
  display_name: string
  verified_referral_count: number
}

type LoadState = 'loading' | 'loaded' | 'error'

/**
 * PII guard: whatever shape display_name arrives in, only the first name and
 * the last initial ever render. "Sarah Mitchell" → "Sarah M."; an already
 * formatted "Sarah M." passes through unchanged; a single word is returned
 * as-is.
 */
function formatDisplayName(raw: string): string {
  const parts = raw.trim().split(/\s+/)
  if (parts.length === 0 || parts[0] === '') return ''
  if (parts.length === 1) return parts[0]
  const first = parts[0]
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${first} ${lastInitial}.`
}

export function LeaderboardContent() {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [state, setState] = useState<LoadState>('loading')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/waitlist/leaderboard')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: { leaderboard?: LeaderboardRow[] } = await res.json()
        if (cancelled) return
        const data = Array.isArray(json.leaderboard) ? json.leaderboard : []
        // Canon: top 25 — hard cap client-side regardless of API behavior.
        setRows(data.slice(0, 25))
        setState('loaded')
      } catch {
        if (!cancelled) setState('error')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const hasRows = state === 'loaded' && rows.length > 0
  const isEmpty = state === 'loaded' && rows.length === 0

  return (
    <>
      {/* No-JS safety net: framer-motion SSRs its `initial` styles inline, so
          without JS the reveal wrappers would sit at opacity 0. This forces
          them visible. */}
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:border focus:border-[var(--color-line)] focus:bg-[var(--color-base)] focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-[var(--color-ink)] ${FOCUS_RING}`}
      >
        Skip to content
      </a>

      <HomeNav />

      <main id="main" className="bg-[var(--color-base)]">
        {/* ============================================================
            LEADERBOARD
            ============================================================ */}
        <section
          aria-labelledby="leaderboard-heading"
          className="px-4 pb-24 pt-16 sm:px-6 sm:pt-20 md:pb-32 md:pt-28"
        >
          <div className="mx-auto max-w-3xl">
            <Reveal>
              {/* PLACEHOLDER COPY (eyebrow) */}
              <p className={EYEBROW}>The Founders Program</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1
                id="leaderboard-heading"
                className="mt-6 text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--color-ink)]"
              >
                Top referrers
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              {/* PLACEHOLDER COPY */}
              <p className="mt-6 max-w-xl text-[length:var(--text-base)] leading-relaxed text-[var(--color-text-muted)]">
                Every verified referral moves you up the waitlist &mdash; and
                the top 25 earn their place here.
              </p>
            </Reveal>

            {/* Dynamic region: loading / list / empty / unavailable.
                aria-live announces the state change once data arrives. */}
            <div aria-live="polite" className="mt-14">
              {state === 'loading' && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Loading the leaderboard&hellip;
                </p>
              )}

              {hasRows && (
                <Reveal>
                  <ol className="border-t border-[var(--color-line)]">
                    {rows.map((row, index) => (
                      <li
                        key={`${row.display_name}-${index}`}
                        className="grid min-h-11 grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-[var(--color-line)] py-3.5 sm:grid-cols-[4rem_1fr_auto]"
                      >
                        <span
                          aria-hidden="true"
                          className="text-sm tabular-nums text-[var(--color-text-muted)]"
                        >
                          {index + 1}
                        </span>
                        <span className="sr-only">{`Rank ${index + 1}:`}</span>
                        <span className="text-[length:var(--text-base)] font-medium text-[var(--color-ink)]">
                          {formatDisplayName(row.display_name)}
                        </span>
                        <span className="text-[length:var(--text-base)] font-semibold tabular-nums text-[var(--color-accent)]">
                          {row.verified_referral_count}
                          <span className="sr-only">
                            {row.verified_referral_count === 1
                              ? ' verified referral'
                              : ' verified referrals'}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </Reveal>
              )}

              {isEmpty && (
                <Reveal>
                  <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-base-alt)] px-8 py-14 text-center">
                    <p className="mx-auto max-w-md text-[length:var(--text-lg)] leading-relaxed text-[var(--color-ink)]">
                      No referrals yet &mdash; yours could be the first.
                    </p>
                    <div className="mt-8 flex justify-center">
                      <SolidWaitlistCta />
                    </div>
                  </div>
                </Reveal>
              )}

              {state === 'error' && (
                <Reveal>
                  {/* Real data only — no fabricated standings when the API
                      is unreachable. */}
                  <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-base-alt)] px-8 py-14 text-center">
                    <p className="mx-auto max-w-md text-[length:var(--text-lg)] leading-relaxed text-[var(--color-ink)]">
                      The leaderboard isn&rsquo;t available right now. Check
                      back soon.
                    </p>
                    <div className="mt-8 flex justify-center">
                      <SolidWaitlistCta />
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================
            FINAL CTA (its own viewport — its solid blue is allowed)
            ============================================================ */}
        <section
          aria-labelledby="leaderboard-cta-heading"
          className="bg-[var(--color-base-alt)] px-4 py-24 sm:px-6 md:py-32"
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <Reveal>
              {/* PLACEHOLDER COPY */}
              <h2
                id="leaderboard-cta-heading"
                className="max-w-[18ch] text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--color-ink)]"
              >
                Bring your neighbors. Climb the list.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-10 flex justify-center">
                <SolidWaitlistCta />
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              {/* PLACEHOLDER COPY */}
              <p className="mt-6 text-sm text-[var(--color-text-muted)]">
                3 verified referrals make you a Founding Member.
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <HomeFooter />
    </>
  )
}
