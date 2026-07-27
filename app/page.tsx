import {
  Activity,
  ArrowDown,
  ArrowRight,
  Compass,
  Handshake,
  History,
  IdCard
} from 'lucide-react'
import { HomeFooter } from '@/components/home/HomeFooter'
import { HomeNav } from '@/components/home/HomeNav'
import { Reveal } from '@/components/home/Reveal'
import { WaitlistModalTrigger } from '@/components/waitlist/WaitlistModal'

/**
 * Laywork homepage shell — pre-launch. One job: convert visitors into
 * waitlist signups. Mobile-first (90% of traffic arrives from Instagram
 * on a phone). Blue/White/Black palette, tokens only — see
 * app/styles/design-tokens.css and DECISIONS.md 2026-07-24.
 *
 * Accent discipline: one solid-blue element per viewport. The hero CTA owns
 * the first viewport's fill (the nav CTA is outlined); the final-CTA section
 * carries the only other solid fill. Blue otherwise appears solely on the
 * two numeric anchors ($18,500–$42,000 and 80%).
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

const MECHANICS = [
  {
    name: 'Match',
    icon: Handshake,
    // PLACEHOLDER COPY
    copy: 'Compatibility scored across budget, scope, timeline, and temperament — before either side picks up the phone.',
    className:
      'md:col-span-4 bg-[var(--color-base-alt)] p-8 md:p-10 md:min-h-[16rem]'
  },
  {
    name: 'Passport',
    icon: IdCard,
    // PLACEHOLDER COPY
    copy: 'One verified record of licenses, insurance, and finished work.',
    className: 'md:col-span-2 bg-[var(--color-base)] p-8'
  },
  {
    name: 'Backstory',
    icon: History,
    // PLACEHOLDER COPY
    copy: 'The full history of your home, assembled before work begins.',
    className: 'md:col-span-2 bg-[var(--color-base)] p-8'
  },
  {
    name: 'Health Score',
    icon: Activity,
    // PLACEHOLDER COPY
    copy: 'A living read on every contractor: on-time, on-budget, on-record.',
    className: 'md:col-span-2 bg-[var(--color-base)] p-8'
  },
  {
    name: 'Oracle',
    icon: Compass,
    // PLACEHOLDER COPY
    copy: 'Pricing intelligence from real jobs, not contractor guesswork.',
    className: 'md:col-span-2 bg-[var(--color-base-alt)] p-8'
  }
] as const

const FOUNDER_TIERS = [
  { count: '3', reward: 'Founding Member status' },
  { count: '5', reward: 'Free Home Backstory report at launch' },
  { count: '10', reward: 'Laywork+ locked at $49/yr for life' }
] as const

export default function HomePage() {
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
            HERO
            ============================================================ */}
        <section
          aria-labelledby="hero-heading"
          className="px-4 pb-24 pt-16 sm:px-6 sm:pt-20 md:pb-32 md:pt-28"
        >
          <div className="mx-auto max-w-5xl">
            {/* PLACEHOLDER COPY (eyebrow) */}
            <p className={EYEBROW}>The trust layer for home renovation</p>

            <h1
              id="hero-heading"
              className="mt-6 max-w-[14ch] text-[clamp(2.75rem,8vw,5rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[var(--color-ink)]"
            >
              Stop gambling on contractors.
            </h1>

            <p className="mt-6 max-w-xl text-[length:var(--text-lg)] leading-relaxed text-[var(--color-text-muted)]">
              Free AI estimates. Contractors matched at 80%+ compatibility.
              Northern Virginia first.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <SolidWaitlistCta />
              <a
                href="#problem"
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

            {/* SLOT: scroll video — do not wire video here */}
            <div
              aria-hidden="true"
              className="mt-16 flex aspect-video w-full items-center justify-center rounded-[2rem] border border-dashed border-[var(--color-line)] bg-[var(--color-base-alt)] md:mt-20"
            >
              <p className="px-6 text-center text-sm text-[var(--color-text-muted)]">
                Scroll video &mdash; coming next session
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            1 · THE PROBLEM
            ============================================================ */}
        <section
          id="problem"
          aria-labelledby="problem-heading"
          className="scroll-mt-24 px-4 py-24 sm:px-6 md:py-32"
        >
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-12">
            <Reveal className="md:col-span-3">
              <p className={EYEBROW}>The problem</p>
            </Reveal>
            <div className="md:col-span-8 md:col-start-5">
              <Reveal>
                <h2 id="problem-heading" className={SECTION_HEADING}>
                  Every contractor you call already knows what your job should
                  cost. You don&rsquo;t.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                {/* PLACEHOLDER COPY */}
                <p className="mt-6 max-w-xl text-[length:var(--text-base)] leading-relaxed text-[var(--color-text-muted)]">
                  Three quotes, three wildly different numbers, and no way to
                  tell which one is honest. Hiring for your biggest asset
                  shouldn&rsquo;t start from a position of blindness.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============================================================
            2 · THE ESTIMATE
            ============================================================ */}
        <section
          aria-labelledby="estimate-heading"
          className="bg-[var(--color-base-alt)] px-4 py-24 sm:px-6 md:py-32"
        >
          <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Reveal>
                <p className={EYEBROW}>The estimate</p>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 id="estimate-heading" className={`mt-6 ${SECTION_HEADING}`}>
                  Real numbers before anyone steps inside your house.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                {/* PLACEHOLDER COPY */}
                <p className="mt-6 max-w-lg text-[length:var(--text-base)] leading-relaxed text-[var(--color-text-muted)]">
                  Describe the job and get a free AI estimate built from real
                  local project data. Walk into every conversation already
                  knowing the honest range.
                </p>
              </Reveal>
            </div>

            {/* Numeric anchor panel — nested double-bezel card */}
            <Reveal delay={0.15}>
              <div className="rounded-[2rem] border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-base)_55%,var(--color-base-alt))] p-2">
                <div className="rounded-[calc(2rem-0.5rem)] border border-[var(--color-line)] bg-[var(--color-base)] px-8 py-10 shadow-[var(--shadow-lg)]">
                  {/* PLACEHOLDER COPY (example job label) */}
                  <p className={EYEBROW}>Kitchen remodel &middot; Fairfax County</p>
                  <p className="mt-4 text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.02em] text-[var(--color-accent)]">
                    $18,500&ndash;$42,000
                  </p>
                  {/* PLACEHOLDER COPY */}
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
                    A defensible range, not a lowball hook. Free, and yours
                    before a single contractor has your number.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============================================================
            3 · FIVE MECHANICS (asymmetric — no same-size card grid)
            ============================================================ */}
        <section
          aria-labelledby="mechanics-heading"
          className="px-4 py-24 sm:px-6 md:py-32"
        >
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <p className={EYEBROW}>How Laywork works</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                id="mechanics-heading"
                className={`mt-6 max-w-2xl ${SECTION_HEADING}`}
              >
                Five mechanics, one outcome: you stop guessing.
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-4 md:grid-cols-6">
              {MECHANICS.map((mechanic, index) => (
                <Reveal
                  key={mechanic.name}
                  delay={0.05 * index}
                  className={`rounded-2xl border border-[var(--color-line)] ${mechanic.className}`}
                >
                  <mechanic.icon
                    className="h-5 w-5 text-[var(--color-ink)]"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <h3 className="mt-5 text-[length:var(--text-xl)] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
                    {mechanic.name}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {mechanic.copy}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            4 · THE 80% GATE
            ============================================================ */}
        <section
          aria-labelledby="gate-heading"
          className="bg-[var(--color-base-alt)] px-4 py-24 sm:px-6 md:py-32"
        >
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              {/* Numeric anchor — one of the two places blue appears outside CTAs */}
              <p
                aria-hidden="true"
                className="text-[clamp(6rem,18vw,11rem)] font-semibold leading-none tracking-[-0.04em] text-[var(--color-accent)]"
              >
                80%
              </p>
            </Reveal>
            <div>
              <Reveal delay={0.05}>
                <p className={EYEBROW}>The gate</p>
              </Reveal>
              <Reveal delay={0.1}>
                <h2 id="gate-heading" className={`mt-6 ${SECTION_HEADING}`}>
                  If the match isn&rsquo;t above 80%, it doesn&rsquo;t happen.
                </h2>
              </Reveal>
              <Reveal delay={0.15}>
                {/* PLACEHOLDER COPY */}
                <p className="mt-6 max-w-lg text-[length:var(--text-base)] leading-relaxed text-[var(--color-text-muted)]">
                  Laywork only introduces you to contractors who clear the
                  compatibility threshold. Fewer introductions, better ones
                  &mdash; on both sides of the table.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============================================================
            5 · THE FOUNDERS PROGRAM (static stub — no live counter,
            no fabricated numbers)
            ============================================================ */}
        <section
          aria-labelledby="founders-heading"
          className="px-4 py-24 sm:px-6 md:py-32"
        >
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <p className={EYEBROW}>The Founders Program</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                id="founders-heading"
                className={`mt-6 max-w-2xl ${SECTION_HEADING}`}
              >
                The first 500 are Founding Members.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              {/* PLACEHOLDER COPY */}
              <p className="mt-6 max-w-xl text-[length:var(--text-base)] leading-relaxed text-[var(--color-text-muted)]">
                Join early, bring your neighbors, and lock in benefits that
                never come back after launch. Every verified referral moves you
                up the list.
              </p>
            </Reveal>

            <div className="mt-14 border-t border-[var(--color-line)]">
              {FOUNDER_TIERS.map((tier, index) => (
                <Reveal key={tier.count} delay={0.05 * index}>
                  <div className="grid grid-cols-[4.5rem_1fr] items-baseline gap-4 border-b border-[var(--color-line)] py-7 sm:grid-cols-[7rem_1fr]">
                    <p className="text-[length:var(--text-2xl)] font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                      {tier.count}
                      <span className="ml-1 text-sm font-medium text-[var(--color-text-muted)]">
                        referrals
                      </span>
                    </p>
                    <p className="text-[length:var(--text-base)] text-[var(--color-ink)]">
                      {tier.reward}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            6 · FINAL CTA (its own viewport — second solid blue is allowed)
            ============================================================ */}
        <section
          aria-labelledby="final-cta-heading"
          className="bg-[var(--color-base-alt)] px-4 py-24 sm:px-6 md:py-32"
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <Reveal>
              {/* PLACEHOLDER COPY */}
              <h2
                id="final-cta-heading"
                className="max-w-[16ch] text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--color-ink)]"
              >
                Know the number before they do.
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
                Free to join. Northern Virginia first.
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <HomeFooter />
    </>
  )
}
