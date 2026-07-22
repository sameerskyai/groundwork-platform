'use client'

import { motion } from 'framer-motion'
import { CountUpStat } from './CountUpStat'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
}

function Section({ children, style, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <motion.div
      className={`max-w-2xl mx-auto px-6 text-center ${className}`}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// Beat 2: the problem. One line, heavy, enormous whitespace. No form, no
// distraction -- just the fear that makes the free-estimate offer land.
export function Problem() {
  return (
    <Section style={{ backgroundColor: 'var(--color-surface-secondary)', paddingTop: '8rem', paddingBottom: '8rem' }}>
      <p className="text-2xl md:text-4xl font-bold" style={{ color: 'var(--color-text-primary)', lineHeight: 1.25 }}>
        Everyone has a contractor horror story.
      </p>
    </Section>
  )
}

// Beat 3: the shift. Free AI estimate before anyone calls -- the dollar
// range is the numeric anchor the eye should land on.
export function Shift() {
  return (
    <Section style={{ paddingTop: '7rem', paddingBottom: '7rem' }}>
      <p className="text-sm font-medium mb-4" style={{ color: 'var(--color-brand-text)' }}>
        The fix
      </p>
      <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>
        Get the real number first. Free.
      </h2>
      <div
        className="text-5xl md:text-6xl font-bold mb-4"
        style={{ color: 'var(--color-brand)', fontVariantNumeric: 'tabular-nums' }}
      >
        <CountUpStat from={0} to={18500} prefix="$" duration={1.2} />
        <span style={{ color: 'var(--color-text-tertiary)' }}> – </span>
        <CountUpStat from={0} to={42000} prefix="$" duration={1.6} />
      </div>
      <p className="text-lg max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
        A real cost estimate built from regional job data, before a single contractor calls you.
      </p>
    </Section>
  )
}

interface Mechanic {
  name: string
  tagline: string
  description: string
  disclaimer?: string
}

const mechanics: Mechanic[] = [
  {
    name: 'Match',
    tagline: 'Contractors matched, not cold-called',
    description: 'See only contractors matched to your project at 80%+ compatibility — budget, timeline, and trade all fit before you ever talk to one.'
  },
  {
    name: 'Home Passport',
    tagline: 'Carfax for your house, and we also do the repairs',
    description: 'Every project, contractor, dollar spent, and warranty gets verified and timestamped. It transfers with the house when you sell.'
  },
  {
    name: 'Backstory',
    tagline: 'Your home\'s cost history, automatically',
    description: 'Import old receipts and documents and we build your home\'s full maintenance and cost history. No more guessing what was already done.'
  },
  {
    name: 'Home Health Score',
    tagline: 'A number that moves with how you maintain your home',
    description: 'A 0–100 score tracks your home\'s maintenance behavior. Skip a service, it drops. Stay ahead of things, it climbs.'
  },
  {
    name: 'The Oracle',
    tagline: 'It speaks before things break',
    description: 'Homes like yours typically need a water heater replaced at 12–15 years. Yours is 11. We tell you before it fails, with a real cost range.',
    disclaimer: 'Patterns from homes like yours in your area. Your situation may differ.'
  }
]

export function MechanicsPanels() {
  return (
    <div className="py-24" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
      <div className="max-w-2xl mx-auto px-6 text-center mb-14">
        <p className="text-sm font-medium mb-4" style={{ color: 'var(--color-brand-text)' }}>
          What you actually get
        </p>
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Five things no other contractor app has
        </h2>
      </div>

      <div className="max-w-2xl mx-auto px-6 space-y-5">
        {mechanics.map((m, i) => (
          <motion.div
            key={m.name}
            className="p-7 rounded-2xl"
            style={{ backgroundColor: 'var(--color-surface-primary)', border: '1px solid var(--color-border)' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold"
                style={{ backgroundColor: 'var(--color-brand-lighter)', color: 'var(--color-brand-text)' }}
              >
                {i + 1}
              </div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {m.name}
                </h3>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-brand-text)' }}>
                  {m.tagline}
                </p>
                <p style={{ color: 'var(--color-text-secondary)' }}>{m.description}</p>
                {m.disclaimer && (
                  <p className="text-xs mt-3 italic" style={{ color: 'var(--color-text-tertiary)' }}>
                    {m.disclaimer}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Beat 5: the 80% gate. Our matching threshold as an engineering claim,
// not a marketing number -- same numeric-anchor treatment as the estimate.
export function EightyGate() {
  return (
    <Section style={{ paddingTop: '7rem', paddingBottom: '7rem' }}>
      <p className="text-sm font-medium mb-4" style={{ color: 'var(--color-brand-text)' }}>
        Our matching standard
      </p>
      <div
        className="text-7xl md:text-8xl font-bold mb-6"
        style={{ color: 'var(--color-brand)', fontVariantNumeric: 'tabular-nums' }}
      >
        <CountUpStat from={0} to={80} suffix="%" formatThousands={false} duration={1.2} />
      </div>
      <p className="text-lg max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
        The minimum compatibility score before a contractor ever appears in your matches — budget, timeline, and trade all have to fit.
      </p>
    </Section>
  )
}

interface ReferralTier {
  count: number
  reward: string
}

const referralTiers: ReferralTier[] = [
  { count: 3, reward: 'Founding Member badge' },
  { count: 5, reward: 'Free Home Backstory report at launch' },
  { count: 10, reward: 'Homeowner+ locked at $49/yr for life' }
]

export function FoundingTiers() {
  return (
    <div className="py-24" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-medium mb-4" style={{ color: 'var(--color-brand-text)' }}>
            Referral rewards
          </p>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Share your link, unlock more
          </h2>
        </div>
        <div className="space-y-3">
          {referralTiers.map((t, i) => (
            <motion.div
              key={t.count}
              className="flex items-center gap-4 p-5 rounded-xl"
              style={{ backgroundColor: 'var(--color-surface-primary)', border: '1px solid var(--color-border)' }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: 'var(--color-brand-lighter)', color: 'var(--color-brand-text)' }}
              >
                {t.count}
              </div>
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.reward}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
