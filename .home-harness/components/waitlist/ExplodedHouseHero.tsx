'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

// Home Passport metaphor: the house arrives on screen "exploded" into its
// five layers (roof, upper floor, lower floor, systems, foundation) and
// assembles into one solid house as the visitor scrolls through the hero.
// The systems layer is rendered as literal copper pipe/wire runs -- a
// direct visual tie to the palette rationale (copper is the actual
// material of the trades, not just a brand color). Built as flat-color
// SVG shapes animated with Framer Motion's scroll progress -- no video,
// no generated frames, no external asset pipeline.
export function ExplodedHouseHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })

  // Each layer travels a different distance so they don't move in lockstep
  // -- roof travels furthest (it started highest), foundation travels least.
  // Offsets are sized to stay within the viewBox at full explosion (progress 0)
  // so nothing clips: roof top is at y=60, so -55 keeps it just inside y=5.
  const roofY = useTransform(scrollYProgress, [0, 0.6], [-55, 0])
  const upperY = useTransform(scrollYProgress, [0, 0.6], [-28, 0])
  const lowerY = useTransform(scrollYProgress, [0, 0.6], [24, 0])
  const systemsY = useTransform(scrollYProgress, [0, 0.6], [38, 0])
  const foundationY = useTransform(scrollYProgress, [0, 0.6], [50, 0])
  const layerOpacity = useTransform(scrollYProgress, [0, 0.15, 0.6], [0.55, 0.85, 1])

  const staticStyle = { y: 0 }

  return (
    <div ref={containerRef} className="relative" style={{ height: prefersReducedMotion ? 'auto' : '160vh' }}>
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 400 400"
          className="w-full max-w-md mx-auto"
          style={{ filter: 'drop-shadow(0 20px 40px rgba(60, 30, 10, 0.15))' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="roofGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand)" />
              <stop offset="100%" stopColor="var(--color-brand-light)" />
            </linearGradient>
          </defs>

          {/* Foundation */}
          <motion.g style={prefersReducedMotion ? staticStyle : { y: foundationY, opacity: layerOpacity }}>
            <rect x="60" y="310" width="280" height="30" rx="4" fill="var(--color-surface-tertiary)" />
          </motion.g>

          {/* Systems: copper pipe + wire runs -- the trade material made literal */}
          <motion.g style={prefersReducedMotion ? staticStyle : { y: systemsY, opacity: layerOpacity }}>
            <path
              d="M 100 300 L 100 285 L 160 285 L 160 300 M 220 300 L 220 280 L 300 280 L 300 300"
              stroke="var(--color-brand)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 140 300 L 140 292 L 260 292 L 260 300"
              stroke="var(--color-brand-text)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="1 7"
              fill="none"
            />
            <circle cx="100" cy="285" r="4" fill="var(--color-brand)" />
            <circle cx="300" cy="280" r="4" fill="var(--color-brand)" />
          </motion.g>

          {/* Lower floor: door + windows */}
          <motion.g style={prefersReducedMotion ? staticStyle : { y: lowerY, opacity: layerOpacity }}>
            <rect x="80" y="220" width="240" height="90" fill="var(--color-brand-lighter)" />
            <rect x="185" y="250" width="30" height="60" rx="2" fill="var(--color-surface-primary)" />
            <rect x="110" y="240" width="40" height="40" rx="2" fill="var(--color-surface-primary)" />
            <rect x="250" y="240" width="40" height="40" rx="2" fill="var(--color-surface-primary)" />
          </motion.g>

          {/* Upper floor: two windows */}
          <motion.g style={prefersReducedMotion ? staticStyle : { y: upperY, opacity: layerOpacity }}>
            <rect x="95" y="150" width="210" height="70" fill="var(--color-brand-light)" />
            <rect x="130" y="170" width="35" height="35" rx="2" fill="var(--color-surface-primary)" />
            <rect x="235" y="170" width="35" height="35" rx="2" fill="var(--color-surface-primary)" />
          </motion.g>

          {/* Roof */}
          <motion.g style={prefersReducedMotion ? staticStyle : { y: roofY, opacity: layerOpacity }}>
            <polygon points="200,60 380,150 20,150" fill="url(#roofGradient)" />
          </motion.g>
        </svg>
      </div>
    </div>
  )
}
