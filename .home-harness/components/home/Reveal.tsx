'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Scroll-reveal wrapper for the homepage — the repo's standard framer-motion
 * entry: fade-up 24px over 0.6s on the expo-out curve, fired once when the
 * element crosses 80px into the viewport.
 *
 * Accessibility / resilience:
 * - useReducedMotion() → renders a plain static div, no animation at all.
 * - Every animated wrapper carries data-reveal; app/page.tsx ships a
 *   <noscript> override forcing [data-reveal] visible, so content is never
 *   trapped at opacity 0 when JS is unavailable.
 */
export function Reveal({
  children,
  className,
  delay = 0
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  // 600ms, not 700: DESIGN_SYSTEM.md caps every transition at --dur-slow.
  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
