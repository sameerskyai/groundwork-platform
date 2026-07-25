'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight, Link2, UserPlus } from 'lucide-react'
import { HomeFooter } from '@/components/home/HomeFooter'
import { HomeNav } from '@/components/home/HomeNav'
import { Reveal } from '@/components/home/Reveal'
import { WaitlistModalTrigger } from '@/components/waitlist/WaitlistModal'

/**
 * The Founders Program page — /founders. Explains the founding-500 canon
 * (DECISIONS.md 2026-07-24): first 500 signups are Founding Members
 * automatically, anyone can earn it with 3 verified referrals, tier rewards
 * at 3/5/10, ~100 spots per verified referral, first access in waves.
 *
 * Same conventions as app/page.tsx: Blue/White/Black tokens only, Reveal for
 * motion, WaitlistModalTrigger for CTAs, one solid-blue element per viewport
 * (hero CTA and final CTA — separate viewports; everything between stays
 * outlined or plain).
 *
 * The live counter fetches /api/waitlist/stats client-side and renders only
 * when `spots_remaining` is a real number — on fetch failure or a null/absent
 * value the line is hidden entirely. Never a fabricated number.
 */

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--outline-color)]'

const EYEBROW =
  'text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]'

const SECTION_HEADING =
  'text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]'

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

/**
 * Fetches the founding-spot counter. Returns a number only when the API
 * responded with a real numeric `spots_remaining`; null in every other case
 * (loading, network failure, API error, missing/non-numeric field) so the
 * caller can hide the line instead of showing a fabricated value.
 */
function useSpotsRemaining(): number | null {
  const [spots, setSpots] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/waitlist/stats')
      .then(res => (res.ok ? res.json() : null))
      .then((data: { spots_remaining?: unknown } | null) => {
        if (cancelled || data === null) return
        if (
          typeof data.spots_remaining === 'number' &&
          Number.isFinite(data.spots_remaining)
        ) {
          setSpots(data.spots_remaining)
        }
      })
      .catch(() => {
        /* hide the counter — never guess */
      })

    return () => {
      cancelled = true
    }
  }, [])

  return spots
}

const TIERS = [
  {
    count: '3',
    reward: 'Founding Member status',
    // PLACEHOLDER COPY
    detail:
      'Three verified referrals and you’re a Founding Member — no matter where you joined the list.'
  },
  {
    count: '5',
    reward: 'Free Home Backstory report at launch',
    // PLACEHOLDER COPY
    detail:
      'The full assembled history of your home, on us, the day Laywork opens in your area.'
  },
  {
    count: '10',
    reward: 'Laywork+ locked at $49/yr for life',
    // PLACEHOLDER COPY
    detail:
      'The founding rate, held for as long as you keep the membership. It never comes back after launch.'
  }
] as const

export function FoundersContent() {
  const spotsRemaining = useSpotsRemaining()

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
            HERO — the viewport's one solid blue is the CTA
            ============================================================ */}
        <section
          aria-labelledby="founders-hero-heading"
          className="px-4 pb-24 pt-16 sm:px-6 sm:pt-20 md:pb-32 md:pt-28"
        >
          <div className="mx-auto max-w-5xl">
            {/* PLACEHOLDER COPY (eyebrow) */}
            <p className={EYEBROW}>For the first believers</p>

            <h1
              id="founders-hero-heading"
              className="mt-6 max-w-[14ch] text-[clamp(2.75rem,8vw,5rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[var(--color-ink)]"
            >
              The Founders Program
            </h1>

            {/* PLACEHOLDER COPY */}
            <p className="mt-6 max-w-xl text-[length:var(--text-lg)] leading-relaxed text-[var(--color-text-muted)]">
              The first 500 people on the Laywork waitlist become Founding
              Members — with rewards that never come back after launch.
            </p>

            {/* Live counter — real data only. Hidden entirely unless the
                stats API returned a numeric spots_remaining. */}
            {spotsRemaining !== null && (
              <p className="mt-5 text-sm text-[var(--color-text-muted)]">
                <span className="font-semibold tabular-nums text-[var(--color-ink)]">
                  {spotsRemaining.toLocaleString()}
                </span>{' '}
                of 500 founding spots remaining.
              </p>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <SolidWaitlistCta />
              <a
                href="#two-ways-in"
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-[var(--color-ink)] transition-colors duration-300 ease-[var(--ease-out-expo)] hover:text-[var(--color-text-muted)] motion-reduce:transition-none ${FOCUS_RING}`}
              >
                See how it works
                <ArrowDown
                  className="h-4 w-4"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================
            1 · TWO WAYS IN
            ============================================================ */}
        <section
          id="two-ways-in"
          aria-labelledby="two-ways-heading"
          className="scroll-mt-24 bg-[var(--color-base-alt)] px-4 py-24 sm:px-6 md:py-32"
        >
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <p className={EYEBROW}>Two ways in</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                id="two-ways-heading"
                className={`mt-6 max-w-2xl ${SECTION_HEADING}`}
              >
                Be early, or bring your neighbors. Both doors open.
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-4 md:grid-cols-2">
              <Reveal className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-base)] p-8 md:p-10">
                <UserPlus
                  className="h-5 w-5 text-[var(--color-ink)]"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h3 className="mt-5 text-[length:var(--text-xl)] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
                  Be one of the first 500
                </h3>
                {/* PLACEHOLDER COPY */}
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
                  Join the waitlist while founding spots remain and Founding
                  Member status is yours automatically. Nothing to do, nothing
                  to earn — you were here first.
                </p>
              </Reveal>

              <Reveal
                delay={0.05}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-base)] p-8 md:p-10"
              >
                <Link2
                  className="h-5 w-5 text-[var(--color-ink)]"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h3 className="mt-5 text-[length:var(--text-xl)] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
                  Earn it with 3 referrals
                </h3>
                {/* PLACEHOLDER COPY */}
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
                  Missed the first 500? Three verified referrals earn Founding
                  Member status from any position on the list — and each
                  verified referral moves you up about 100 spots.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============================================================
            2 · THE TIER REWARDS — blue tier numbers, full-width list
            ============================================================ */}
        <section
          aria-labelledby="tiers-heading"
          className="px-4 py-24 sm:px-6 md:py-32"
        >
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <p className={EYEBROW}>The rewards</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                id="tiers-heading"
                className={`mt-6 max-w-2xl ${SECTION_HEADING}`}
              >
                Three tiers. Each one locked in for good.
              </h2>
            </Reveal>

            <div className="mt-14 border-t border-[var(--color-line)]">
              {TIERS.map((tier, index) => (
                <Reveal key={tier.count} delay={0.05 * index}>
                  <div className="grid grid-cols-[4.5rem_1fr] items-baseline gap-4 border-b border-[var(--color-line)] py-8 sm:grid-cols-[7rem_1fr]">
                    <p className="text-[clamp(2rem,4vw,2.75rem)] font-semibold tabular-nums tracking-[-0.02em] text-[var(--color-accent)]">
                      {tier.count}
                      <span className="ml-1 block text-sm font-medium tracking-normal text-[var(--color-text-muted)] sm:ml-0">
                        referrals
                      </span>
                    </p>
                    <div>
                      <p className="text-[length:var(--text-lg)] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
                        {tier.reward}
                      </p>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                        {tier.detail}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* PLACEHOLDER COPY */}
            <Reveal delay={0.15}>
              <p className="mt-8 text-sm text-[var(--color-text-muted)]">
                Referrals count when they&rsquo;re verified — a real neighbor,
                not a duplicate.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ============================================================
            3 · FIRST ACCESS, IN WAVES
            ============================================================ */}
        <section
          aria-labelledby="waves-heading"
          className="bg-[var(--color-base-alt)] px-4 py-24 sm:px-6 md:py-32"
        >
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-12">
            <Reveal className="md:col-span-3">
              <p className={EYEBROW}>At launch</p>
            </Reveal>
            <div className="md:col-span-8 md:col-start-5">
              <Reveal>
                <h2 id="waves-heading" className={SECTION_HEADING}>
                  First access, in waves.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                {/* PLACEHOLDER COPY */}
                <p className="mt-6 max-w-xl text-[length:var(--text-base)] leading-relaxed text-[var(--color-text-muted)]">
                  When Laywork opens in your area, Founding Members get in
                  first — invitations go out in waves, in waitlist order, so
                  every early match gets real attention. The general list
                  follows once the founding waves are through.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============================================================
            4 · FINAL CTA (its own viewport — second solid blue is allowed)
            ============================================================ */}
        <section
          aria-labelledby="founders-cta-heading"
          className="px-4 py-24 sm:px-6 md:py-32"
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <Reveal>
              {/* PLACEHOLDER COPY */}
              <h2
                id="founders-cta-heading"
                className="max-w-[16ch] text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--color-ink)]"
              >
                500 spots. Then it&rsquo;s earned.
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
                Free to join. Name and email only. Northern Virginia first.
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <HomeFooter />
    </>
  )
}
