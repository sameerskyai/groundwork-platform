'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Total entrance budget, hard cap per spec: nobody waits longer than this,
 * and if fonts/assets are already warm the sequence still runs to completion
 * rather than being cut short. Wordmark fade-in is pinned to 60% of this.
 */
const ENTRANCE_DURATION = 1.8
const WORDMARK_START = ENTRANCE_DURATION * 0.6

export interface LoadingScreenRefs {
  container: HTMLDivElement
  roof: SVGPathElement
  walls: SVGPathElement
  windowsDoor: SVGPathElement[]
  interior: SVGLineElement[]
  progressFill: HTMLDivElement
  wordmark: HTMLDivElement
}

/**
 * Named, standalone GSAP timeline for the hand-off exit: blueprint strokes
 * fade while the whole screen lifts/dissolves upward. Exported so a later
 * hero build can `.add()` this into a larger timeline instead of the two
 * being wired together here — this component only ever plays it solo.
 */
export function createLoadingExitTimeline(refs: LoadingScreenRefs) {
  const strokes = [refs.roof, refs.walls, ...refs.windowsDoor, ...refs.interior]

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } })

  tl.to(strokes, { opacity: 0, duration: 0.35 }, 0)
    .to(refs.progressFill.parentElement, { opacity: 0, duration: 0.25 }, 0)
    .to(refs.wordmark, { opacity: 0, y: -12, duration: 0.35 }, 0.05)
    .to(refs.container, { yPercent: -100, opacity: 0, duration: 0.55 }, 0.1)

  return tl
}

interface LoadingScreenProps {
  /** Fires once the exit timeline finishes and the screen has handed off. */
  onComplete?: () => void
  /** Extra hold time (seconds) after drawing finishes, before exit plays. */
  holdDuration?: number
}

export function LoadingScreen({ onComplete, holdDuration = 0.3 }: LoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const roofRef = useRef<SVGPathElement>(null)
  const wallsRef = useRef<SVGPathElement>(null)
  const doorRef = useRef<SVGPathElement>(null)
  const windowLeftRef = useRef<SVGPathElement>(null)
  const windowRightRef = useRef<SVGPathElement>(null)
  const partitionVRef = useRef<SVGLineElement>(null)
  const partitionHRef = useRef<SVGLineElement>(null)
  const progressTrackRef = useRef<HTMLDivElement>(null)
  const progressFillRef = useRef<HTMLDivElement>(null)
  const wordmarkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const roof = roofRef.current
    const walls = wallsRef.current
    const door = doorRef.current
    const windowLeft = windowLeftRef.current
    const windowRight = windowRightRef.current
    const partitionV = partitionVRef.current
    const partitionH = partitionHRef.current
    const progressFill = progressFillRef.current
    const wordmark = wordmarkRef.current

    if (!container || !roof || !walls || !door || !windowLeft || !windowRight ||
        !partitionV || !partitionH || !progressFill || !wordmark) {
      return
    }

    const refs: LoadingScreenRefs = {
      container,
      roof,
      walls,
      windowsDoor: [door, windowLeft, windowRight],
      interior: [partitionV, partitionH],
      progressFill,
      wordmark
    }

    const drawEls = [roof, walls, door, windowLeft, windowRight, partitionV, partitionH]
    const lengths = drawEls.map((el) => el.getTotalLength())

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      gsap.set(drawEls, { strokeDasharray: (i: number) => lengths[i], strokeDashoffset: 0 })
      gsap.set(wordmark, { opacity: 1, y: 0 })
      gsap.set(progressFill, { scaleX: 1 })
      container.dataset.loadingState = 'wordmark-visible'

      const staticExit = gsap.timeline({ delay: 0.4 })
      staticExit.call(() => { container.dataset.loadingState = 'exiting' })
        .to(container, { opacity: 0, duration: 0.25, ease: 'power1.out' })
        .call(() => {
          container.dataset.loadingState = 'complete'
          onComplete?.()
        })

      return () => {
        staticExit.kill()
      }
    }

    gsap.set(drawEls, { strokeDasharray: (i: number) => lengths[i], strokeDashoffset: (i: number) => lengths[i] })
    gsap.set(wordmark, { opacity: 0, y: 8 })
    gsap.set(progressFill, { scaleX: 0, transformOrigin: 'left center' })
    container.dataset.loadingState = 'drawing'

    const entrance = gsap.timeline()

    // Roofline first.
    entrance.to(roof, { strokeDashoffset: 0, duration: 0.42, ease: 'power1.inOut' }, 0)
      // Then walls (slight overlap keeps the draw feeling continuous, not stepped).
      .to(walls, { strokeDashoffset: 0, duration: 0.42, ease: 'power1.inOut' }, 0.32)
      // Then windows + door together.
      .to([door, windowLeft, windowRight], { strokeDashoffset: 0, duration: 0.36, ease: 'power1.inOut' }, 0.64)
      // Then interior partition lines.
      .to([partitionV, partitionH], { strokeDashoffset: 0, duration: 0.28, ease: 'power1.inOut' }, 0.9)
      // Progress line fills across the whole entrance budget.
      .to(progressFill, { scaleX: 1, duration: ENTRANCE_DURATION, ease: 'none' }, 0)
      // Wordmark fades in at 60% through.
      .to(wordmark, { opacity: 1, y: 0, duration: 0.3, ease: 'power1.out' }, WORDMARK_START)
      .call(() => { container.dataset.loadingState = 'wordmark-visible' }, [], WORDMARK_START)

    entrance.eventCallback('onComplete', () => {
      const exit = createLoadingExitTimeline(refs)
      gsap.delayedCall(holdDuration, () => {
        container.dataset.loadingState = 'exiting'
        exit.play().eventCallback('onComplete', () => {
          container.dataset.loadingState = 'complete'
          onComplete?.()
        })
      })
    })

    return () => {
      entrance.kill()
    }
  }, [onComplete, holdDuration])

  return (
    <div
      ref={containerRef}
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--color-surface-primary, #FBF8F4)' }}
    >
      <span className="sr-only">Loading Groundwork</span>

      <svg
        width="280"
        height="200"
        viewBox="0 0 400 280"
        fill="none"
        aria-hidden="true"
      >
        {/* Roofline */}
        <path
          ref={roofRef}
          d="M70,110 L200,20 L330,110"
          stroke="#B87333"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Walls: left, base, right */}
        <path
          ref={wallsRef}
          d="M100,110 L100,240 L300,240 L300,110"
          stroke="#B87333"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Door (bottom edge omitted -- coincides with the wall base already drawn) */}
        <path
          ref={doorRef}
          d="M180,240 L180,165 L220,165 L220,240"
          stroke="#B87333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Left window */}
        <path
          ref={windowLeftRef}
          d="M125,155 L155,155 L155,185 L125,185 Z"
          stroke="#B87333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right window */}
        <path
          ref={windowRightRef}
          d="M245,155 L275,155 L275,185 L245,185 Z"
          stroke="#B87333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interior partition -- vertical wall */}
        <line
          ref={partitionVRef}
          x1="200" y1="110" x2="200" y2="240"
          stroke="#B87333"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Interior partition -- floor joist line */}
        <line
          ref={partitionHRef}
          x1="100" y1="200" x2="300" y2="200"
          stroke="#B87333"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <div ref={progressTrackRef} className="mt-6 h-[2px] w-40 overflow-hidden" style={{ backgroundColor: 'rgba(184, 115, 51, 0.18)' }}>
        <div ref={progressFillRef} className="h-full w-full" style={{ backgroundColor: '#B87333' }} />
      </div>

      <div
        ref={wordmarkRef}
        className="mt-6 text-sm md:text-base"
        style={{
          color: '#2B2320',
          fontFamily: 'var(--font-serif)',
          letterSpacing: '0.3em',
          fontWeight: 500,
          textTransform: 'uppercase'
        }}
      >
        Groundwork
      </div>
    </div>
  )
}
