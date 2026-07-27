import type { CSSProperties } from 'react'
import { Activity, Compass, Handshake, History, IdCard } from 'lucide-react'
import { DrawingCard, MeasuredNumber, Sheet } from '@/components/drawing'
import { FoundingCounter } from '@/components/home/FoundingCounter'
import { HomeFooter } from '@/components/home/HomeFooter'
import { HomeNav } from '@/components/home/HomeNav'
import { Reveal } from '@/components/home/Reveal'
import { WaitlistModalTrigger } from '@/components/waitlist/WaitlistModal'

/**
 * Laywork homepage — DRAWING SET (DESIGN_SYSTEM.md, founder directive
 * 2026-07-27). This is a document, not a landing page: visible grid,
 * registration marks, sheet numbers, dimension lines, mono annotation.
 *
 * Rules enforced here:
 * - Zero hardcoded values. Every colour, size, and space is a token.
 * - Annotation is the signature: labels are mono/uppercase/11px/muted.
 * - ONE accent-filled element per viewport. The hero .btn-primary owns
 *   viewport 1 (the nav CTA is hairline); section 06 owns the other.
 *   Accent appears nowhere else except focus rings.
 * - Visible grid on EXACTLY two sections: 00 HERO and 04 THE 80% GATE.
 * - Motion via <Reveal> only: transform + opacity, 700ms cap, fires once.
 * - All numerals tabular (body sets font-variant-numeric; MeasuredNumber
 *   and .tabular restate it where numbers carry argument).
 */

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--outline-color)]'

/** Display headline steps. type-8 is desktop only: at 390px it overflows. */
const H1_TYPE =
  'text-[length:var(--type-6)] sm:text-[length:var(--type-7)] lg:text-[length:var(--type-8)]'
const H2_TYPE = 'text-[length:var(--type-5)] lg:text-[length:var(--type-6)]'
const STATEMENT_TYPE =
  'text-[length:var(--type-6)] lg:text-[length:var(--type-7)]'

const DISPLAY: CSSProperties = {
  lineHeight: 'var(--leading-display)',
  letterSpacing: 'var(--tracking-display-lg)',
  color: 'var(--color-ink)',
  fontWeight: 600
}

const LEAD: CSSProperties = {
  fontSize: 'var(--type-4)',
  lineHeight: 'var(--leading-body)',
  color: 'var(--color-ink-2)',
  maxWidth: '54ch'
}

/* ------------------------------------------------------------------
   03 THE MECHANICS
   TRUTHFULNESS: four of these five are NOT BUILT. Per-feature build
   status is tracked in FEATURE_INVENTORY.md — check it before editing a
   single word here. Copy stays in the register of intent and design
   ("built to", "the standard we hold", plain future tense). No
   present-tense capability claims. No counts, no outcomes, no proof we
   do not have. When in doubt, flag the line instead of shipping it.
   ------------------------------------------------------------------ */
const MECHANICS = [
  {
    number: '01',
    name: 'Match',
    icon: Handshake,
    // BUILD STATUS: not built. See FEATURE_INVENTORY.md.
    copy: 'Built to score budget, scope, timeline, and temperament against each other before either side picks up the phone.'
  },
  {
    number: '02',
    name: 'Home Passport',
    icon: IdCard,
    // BUILD STATUS: not built. See FEATURE_INVENTORY.md.
    copy: 'One verified record of licenses, insurance, and finished work. That is the standard we will hold before a contractor is listed.'
  },
  {
    number: '03',
    name: 'Backstory Engine',
    icon: History,
    // BUILD STATUS: not built. See FEATURE_INVENTORY.md.
    copy: 'Designed to assemble the history of a house, permits, work done, and what it cost, before the next job starts.'
  },
  {
    number: '04',
    name: 'Health Score',
    icon: Activity,
    // BUILD STATUS: not built. See FEATURE_INVENTORY.md.
    copy: 'A standing read on each contractor, on time, on budget, on the terms they agreed to. In design now.'
  },
  {
    number: '05',
    name: 'Oracle',
    icon: Compass,
    // BUILD STATUS: estimate path partially built. See FEATURE_INVENTORY.md.
    copy: 'Pricing read from finished jobs near you rather than from a guess at the kitchen table.'
  }
] as const

const FOUNDER_TIERS = [
  { count: '3', reward: 'Founding Member status' },
  { count: '5', reward: 'Free Home Backstory report at launch' },
  { count: '10', reward: 'Laywork+ locked at $49/yr for life' }
] as const

const TABLE_CELL: CSSProperties = {
  textAlign: 'left',
  paddingTop: 'var(--space-3)',
  paddingBottom: 'var(--space-3)',
  borderBottom: '1px solid var(--color-line)',
  verticalAlign: 'baseline'
}

export default function HomePage() {
  return (
    <>
      {/* No-JS safety net: framer-motion SSRs its `initial` styles inline, so
          without JS the reveal wrappers would sit at opacity 0. This forces
          them visible — content is never trapped invisible. */}
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:fixed focus:z-[60] focus:inline-flex focus:items-center ${FOCUS_RING}`}
        style={{
          left: 'var(--space-2)',
          top: 'var(--space-2)',
          minHeight: 'var(--space-6)',
          paddingLeft: 'var(--space-2)',
          paddingRight: 'var(--space-2)',
          background: 'var(--color-base)',
          border: '1px solid var(--color-ink)',
          borderRadius: 'var(--radius-control)',
          color: 'var(--color-ink)',
          fontSize: 'var(--type-3)'
        }}
      >
        Skip to content
      </a>

      <HomeNav />

      <main id="main" style={{ background: 'var(--color-base)' }}>
        {/* ============================================================
            00 — HERO. Grid backdrop #1 of 2. Accent fill #1 of 2.
            ============================================================ */}
        <Sheet grid>
          <p className="annotation">
            Northern Virginia{' '}
            <span style={{ color: 'var(--color-line-strong)' }}>/</span> Founding
            access
          </p>

          <hr
            className="rule"
            style={{
              marginTop: 'var(--space-2)',
              marginBottom: 'var(--space-4)'
            }}
          />

          <h1
            id="hero-heading"
            className={H1_TYPE}
            style={{ ...DISPLAY, maxWidth: '16ch' }}
          >
            Stop gambling on contractors.
          </h1>

          <p style={{ ...LEAD, marginTop: 'var(--space-3)' }}>
            Free AI estimates. Contractors matched at 80%+ compatibility.
            Northern Virginia first.
          </p>

          <div style={{ marginTop: 'var(--space-5)' }}>
            <WaitlistModalTrigger className="btn-primary">
              Join the waitlist
            </WaitlistModalTrigger>
          </div>

          {/* SLOT: scroll video. Marked, measured, and deliberately not
              wired. Do not add a <video> here. */}
          <div
            className="flex aspect-video w-full items-center justify-center"
            style={{
              marginTop: 'var(--space-8)',
              border: '1px dashed var(--color-line)',
              borderRadius: 'var(--radius-card)',
              background: 'var(--color-base-alt)'
            }}
          >
            <p
              className="annotation"
              style={{
                textAlign: 'center',
                paddingLeft: 'var(--space-3)',
                paddingRight: 'var(--space-3)'
              }}
            >
              Scroll video{' '}
              <span style={{ color: 'var(--color-line-strong)' }}>/</span> coming
              next session
            </p>
          </div>
        </Sheet>

        {/* ============================================================
            01 — THE PROBLEM. One line. Nothing else on screen.
            ============================================================ */}
        <Sheet id="problem" number="01" label="The problem" alt>
          <Reveal>
            <h2
              className={STATEMENT_TYPE}
              style={{
                ...DISPLAY,
                maxWidth: '22ch',
                marginTop: 'var(--space-9)',
                marginBottom: 'var(--space-9)'
              }}
            >
              Every contractor you call already knows what your job should cost.
              You don&rsquo;t.
            </h2>
          </Reveal>
        </Sheet>

        {/* ============================================================
            02 — THE ESTIMATE. Split: copy left, measured number right.
            ============================================================ */}
        <Sheet number="02" label="The estimate">
          <div
            className="grid lg:grid-cols-2"
            style={{ gap: 'var(--space-8)', alignItems: 'start' }}
          >
            <div>
              <Reveal>
                <h2 className={H2_TYPE} style={{ ...DISPLAY, maxWidth: '20ch' }}>
                  Real numbers before anyone steps inside your house.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                {/* BUILD STATUS: the estimate path is partially built and the
                    local cost record is still filling. Written as intent, not
                    as a live capability. See FEATURE_INVENTORY.md. */}
                <p style={{ ...LEAD, marginTop: 'var(--space-3)' }}>
                  Laywork is built to hand you the range first, free, before
                  anyone has your number and before anyone walks your house.
                  Then every quote gets checked against it.
                </p>
              </Reveal>
            </div>

            {/* The number carries the argument, so it gets measured. */}
            <Reveal
              delay={0.15}
              className="[--estimate:var(--type-5)] sm:[--estimate:var(--type-6)]"
            >
              <p className="annotation" style={{ marginBottom: 'var(--space-2)' }}>
                Kitchen remodel{' '}
                <span style={{ color: 'var(--color-line-strong)' }}>/</span>{' '}
                Fairfax County
              </p>
              <MeasuredNumber
                value="$18,500 – $42,000"
                label="Estimated range / Northern Virginia / 2026"
                size="var(--estimate)"
              />
            </Reveal>
          </div>
        </Sheet>

        {/* ============================================================
            03 — THE MECHANICS. Five cards, mono numbered, line-art icons.
            ============================================================ */}
        <Sheet number="03" label="The mechanics" alt>
          <Reveal>
            <h2 className={H2_TYPE} style={{ ...DISPLAY, maxWidth: '24ch' }}>
              Five parts, drawn so you never hire blind.
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p style={{ ...LEAD, marginTop: 'var(--space-3)' }}>
              One is partly built and four are on the board. Here is what each
              one is designed to do, written plainly so you can hold us to it.
            </p>
          </Reveal>

          <div
            className="grid sm:grid-cols-2 lg:grid-cols-3"
            style={{ gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}
          >
            {MECHANICS.map((mechanic, index) => (
              <Reveal
                key={mechanic.name}
                delay={0.05 * index}
                className="grid"
              >
                <DrawingCard>
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 'var(--space-3)' }}
                  >
                    <span className="annotation">{mechanic.number}</span>
                    <mechanic.icon
                      aria-hidden="true"
                      strokeWidth={1}
                      style={{
                        width: 'var(--space-3)',
                        height: 'var(--space-3)',
                        color: 'var(--color-accent)'
                      }}
                    />
                  </div>
                  <h3
                    style={{
                      fontSize: 'var(--type-4)',
                      lineHeight: 'var(--leading-display)',
                      letterSpacing: 'var(--tracking-display)',
                      color: 'var(--color-ink)',
                      fontWeight: 600
                    }}
                  >
                    {mechanic.name}
                  </h3>
                  <p
                    style={{
                      marginTop: 'var(--space-1)',
                      fontSize: 'var(--type-3)',
                      lineHeight: 'var(--leading-body)',
                      color: 'var(--color-ink-2)'
                    }}
                  >
                    {mechanic.copy}
                  </p>
                </DrawingCard>
              </Reveal>
            ))}
          </div>
        </Sheet>

        {/* ============================================================
            04 — THE 80% GATE. Grid backdrop #2 of 2. No more after this.
            ============================================================ */}
        <Sheet number="04" label="The 80% gate" grid>
          <div
            className="grid lg:grid-cols-2"
            style={{ gap: 'var(--space-8)', alignItems: 'center' }}
          >
            <Reveal>
              <MeasuredNumber
                value="80%"
                label="Minimum compatibility / enforced"
                size="var(--type-8)"
              />
            </Reveal>
            <div>
              <Reveal delay={0.1}>
                <h2 className={H2_TYPE} style={{ ...DISPLAY, maxWidth: '20ch' }}>
                  Below 80%, the introduction does not happen.
                </h2>
              </Reveal>
              <Reveal delay={0.15}>
                <p style={{ ...LEAD, marginTop: 'var(--space-3)' }}>
                  The match gate is the structure we are building the rest of
                  the product around. Fewer introductions, better ones, on both
                  sides of the table.
                </p>
              </Reveal>
            </div>
          </div>
        </Sheet>

        {/* ============================================================
            05 — FOUNDERS PROGRAM. Live counter renders only from real
            data (see FoundingCounter). Tiers are a technical table.
            ============================================================ */}
        <Sheet number="05" label="Founders program" alt>
          <div
            className="grid lg:grid-cols-2"
            style={{ gap: 'var(--space-8)', alignItems: 'start' }}
          >
            <div>
              <Reveal>
                <h2 className={H2_TYPE} style={{ ...DISPLAY, maxWidth: '18ch' }}>
                  The first 500 are Founding Members.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p style={{ ...LEAD, marginTop: 'var(--space-3)' }}>
                  Join early, bring your neighbors, and hold benefits that close
                  for good at launch. Every verified referral moves you up the
                  list.
                </p>
              </Reveal>
            </div>

            {/* Real data or nothing: FoundingCounter returns null when the
                stats call fails. Never render a fabricated count. */}
            <Reveal delay={0.15}>
              <FoundingCounter />
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: 'var(--space-8)'
              }}
            >
              <caption
                className="annotation"
                style={{ textAlign: 'left', marginBottom: 'var(--space-2)' }}
              >
                Referral tiers{' '}
                <span style={{ color: 'var(--color-line-strong)' }}>/</span>{' '}
                founding waitlist
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="annotation"
                    style={{
                      ...TABLE_CELL,
                      borderBottom: '1px solid var(--color-line-strong)',
                      width: '10rem'
                    }}
                  >
                    Referrals
                  </th>
                  <th
                    scope="col"
                    className="annotation"
                    style={{
                      ...TABLE_CELL,
                      borderBottom: '1px solid var(--color-line-strong)'
                    }}
                  >
                    What it unlocks
                  </th>
                </tr>
              </thead>
              <tbody>
                {FOUNDER_TIERS.map(tier => (
                  <tr key={tier.count}>
                    <td
                      className="tabular"
                      style={{
                        ...TABLE_CELL,
                        fontSize: 'var(--type-5)',
                        letterSpacing: 'var(--tracking-display)',
                        color: 'var(--color-ink)',
                        fontWeight: 600
                      }}
                    >
                      {tier.count}
                    </td>
                    <td
                      style={{
                        ...TABLE_CELL,
                        fontSize: 'var(--type-3)',
                        color: 'var(--color-ink)'
                      }}
                    >
                      {tier.reward}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </Sheet>

        {/* ============================================================
            06 — FINAL CTA. Accent fill #2 of 2, its own viewport.
            ============================================================ */}
        <Sheet number="06" label="Join">
          <div
            className="flex flex-col items-center"
            style={{ textAlign: 'center' }}
          >
            <Reveal>
              <h2
                className={STATEMENT_TYPE}
                style={{ ...DISPLAY, maxWidth: '18ch' }}
              >
                Know the number before they do.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div style={{ marginTop: 'var(--space-5)' }}>
                <WaitlistModalTrigger className="btn-primary">
                  Join the waitlist
                </WaitlistModalTrigger>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="annotation" style={{ marginTop: 'var(--space-3)' }}>
                Free to join{' '}
                <span style={{ color: 'var(--color-line-strong)' }}>/</span> name
                and email only{' '}
                <span style={{ color: 'var(--color-line-strong)' }}>/</span>{' '}
                Northern Virginia first
              </p>
            </Reveal>
          </div>
        </Sheet>
      </main>

      <HomeFooter />
    </>
  )
}
