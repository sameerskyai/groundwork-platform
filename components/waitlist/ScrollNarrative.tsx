'use client'

import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
}

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div
      className="max-w-2xl mx-auto px-6 py-20 text-center"
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

export function HorrorStory() {
  return (
    <Section style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
      <p className="text-sm font-medium mb-4" style={{ color: 'var(--color-brand)' }}>
        Sound familiar?
      </p>
      <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
        Three quotes. Three different prices. Zero idea who's actually right.
      </h2>
      <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
        One contractor quotes $4,000. Another quotes $11,000 for the same job. You have no
        pricing data, no way to check their work, and no idea if you're about to get ripped off —
        so you either overpay out of fear, or go with the cheapest bid and hope.
      </p>
    </Section>
  )
}

export function EstimateTeaser() {
  return (
    <Section>
      <p className="text-sm font-medium mb-4" style={{ color: 'var(--color-brand)' }}>
        The fix
      </p>
      <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
        Get the real number first. Free.
      </h2>
      <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
        Describe your project and get an AI-powered cost estimate built from real regional job
        data — before a single contractor calls you. Now you're negotiating from data, not hope.
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
    tagline: 'Carfax for your house — except we also do the repairs',
    description: "Every project, contractor, dollar spent, and warranty gets verified and timestamped. It's a permanent record that transfers with the house when you sell."
  },
  {
    name: 'Backstory',
    tagline: 'Your home\'s cost history, automatically',
    description: 'Import old receipts and documents and we build your home\'s full maintenance and cost history — no more guessing what was already done, or when.'
  },
  {
    name: 'Home Health Score',
    tagline: 'A number that moves with how you maintain your home',
    description: 'A 0–100 score tracks your home\'s maintenance behavior. Skip a service, it drops. Stay ahead of things, it climbs.'
  },
  {
    name: 'The Oracle',
    tagline: 'It speaks before things break',
    description: 'Homes like yours typically need a water heater replaced at 12–15 years — yours is 11. We tell you before it fails, with a real cost range, not a scare tactic.',
    disclaimer: 'Patterns from homes like yours in your area. Your situation may differ.'
  }
]

export function MechanicsPanels() {
  return (
    <div className="py-20" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
      <div className="max-w-2xl mx-auto px-6 text-center mb-12">
        <p className="text-sm font-medium mb-4" style={{ color: 'var(--color-brand)' }}>
          What you actually get
        </p>
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Five things no other contractor app has
        </h2>
      </div>

      <div className="max-w-2xl mx-auto px-6 space-y-4">
        {mechanics.map((m, i) => (
          <motion.div
            key={m.name}
            className="p-6 rounded-2xl border text-left"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-primary)' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
          >
            <p className="text-xs font-mono mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
              0{i + 1}
            </p>
            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {m.name}
            </h3>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-brand)' }}>
              {m.tagline}
            </p>
            <p style={{ color: 'var(--color-text-secondary)' }}>{m.description}</p>
            {m.disclaimer && (
              <p className="text-xs mt-3 italic" style={{ color: 'var(--color-text-tertiary)' }}>
                {m.disclaimer}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
