'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'
import { X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWaitlistSignup } from '@/hooks/useWaitlistSignup'
import styles from './WaitlistModal.module.css'

/**
 * The Laywork waitlist modal — the conversion moment.
 *
 * Wraps the shared Phase 2 signup logic (hooks/useWaitlistSignup.ts — the
 * same path /waitlist consumes; no second signup path, RLS untouched).
 * Look per the 2026-07-24 directive: a lit panel hovering above the page —
 * layered ambient + contact shadows, blurred backdrop, illuminated accent
 * border, two-stage flow with the position number as the hero moment.
 */

const REFERRAL_TIERS = [
  { count: 3, reward: 'Founding Member status' },
  { count: 5, reward: 'Free Home Backstory report at launch' },
  { count: 10, reward: 'Laywork+ locked at $49/yr for life' }
] as const

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Counts up to the real position over ~800ms, then settles. */
function PositionCountUp({
  target,
  onSettled
}: {
  target: number
  onSettled: () => void
}) {
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0)
  const settledRef = useRef(false)

  useEffect(() => {
    if (prefersReducedMotion()) {
      if (!settledRef.current) {
        settledRef.current = true
        onSettled()
      }
      return
    }

    const duration = 800
    let raf = 0
    let start: number | null = null

    const tick = (now: number) => {
      if (start === null) start = now
      const t = Math.min((now - start) / duration, 1)
      // Exponential ease-out — fast rise, gentle settle.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setValue(Math.round(eased * target))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else if (!settledRef.current) {
        settledRef.current = true
        onSettled()
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, onSettled])

  return (
    <p className={styles.positionNumber} aria-hidden="true">
      You&apos;re #{value.toLocaleString()}
    </p>
  )
}

export function WaitlistModal({
  open,
  onClose,
  topLight = true
}: {
  open: boolean
  onClose: () => void
  /** Variant A (true): faint accent gradient across the top edge, light falling from above. */
  topLight?: boolean
}) {
  const {
    name, setName,
    email, setEmail,
    website, setWebsite,
    loading, submitted, error,
    positionNumber, referralLink,
    spotsRemaining, isFounding,
    submit
  } = useWaitlistSignup()

  const [stage, setStage] = useState<'form' | 'exiting' | 'done'>('form')
  const [pulsing, setPulsing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const openerRef = useRef<Element | null>(null)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Consumers pass inline onClose arrows; keep the identity in a ref so the
  // focus-management effect only tears down on an actual open→closed
  // transition, never on a parent re-render mid-typing.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const headingId = useId()
  const nameId = useId()
  const emailId = useId()
  const errorId = useId()

  useEffect(() => setMounted(true), [])

  // Keep the stage machine in sync with the shared hook: when the signup
  // succeeds, Stage 1 slides out, then Stage 2 slides in — never an
  // instant swap (reduced motion: instant, opacity only via CSS).
  // Keyed on `submitted` alone: with `stage` in the deps, our own
  // setStage('exiting') re-ran the effect and its cleanup cancelled the
  // timer that completes the swap — Stage 2 never appeared.
  useEffect(() => {
    if (!submitted) return
    if (prefersReducedMotion()) {
      setStage('done')
      return
    }
    setStage('exiting')
    const t = setTimeout(() => setStage('done'), 200)
    return () => clearTimeout(t)
  }, [submitted])

  // Focus management + scroll lock + Esc while open.
  useEffect(() => {
    if (!open) return

    openerRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = setTimeout(() => {
      nameRef.current?.focus()
    }, 60)

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return

      // Focus trap: Tab cycles inside the panel.
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el.offsetParent !== null || el === document.activeElement)
      if (focusables.length === 0) {
        // Nothing focusable — park focus on the panel so Tab can't escape.
        e.preventDefault()
        panel.focus()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      // Esc/close returns focus to the trigger.
      if (openerRef.current instanceof HTMLElement) {
        openerRef.current.focus()
      }
    }
  }, [open])

  // On the stage swap, Stage 1 unmounts with the focused submit button —
  // move focus to the Stage 2 heading so keyboard/SR users land somewhere.
  useEffect(() => {
    if (stage === 'done') {
      successHeadingRef.current?.focus()
    }
  }, [stage])

  // Timers owned by refs so unmount can't fire setState afterwards.
  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  const handleSettled = useCallback(() => {
    if (prefersReducedMotion()) return
    setPulsing(true)
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    pulseTimerRef.current = setTimeout(() => setPulsing(false), 950)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit()
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — select the text so manual copy works.
      const input = panelRef.current?.querySelector<HTMLInputElement>(
        `.${styles.referralInput}`
      )
      input?.select()
    }
  }

  if (!open || !mounted) return null

  const counterLine =
    spotsRemaining === null ? null : spotsRemaining > 0 ? (
      <p className={styles.counter}>
        {spotsRemaining.toLocaleString()} of 500 founding spots remaining.
      </p>
    ) : (
      <p className={styles.counter}>
        Founding 500 is full — the general waitlist is open.
      </p>
    )

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className={[
          styles.panel,
          topLight ? styles.topLight : '',
          pulsing ? styles.panelPulse : ''
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Persistent live region — must exist in the DOM before its content
            changes, or the position announcement is missed by most SRs. */}
        <p className="sr-only" aria-live="polite">
          {stage === 'done'
            ? positionNumber > 0
              ? `You're number ${positionNumber.toLocaleString()} on the waitlist.`
              : "You're on the waitlist."
            : ''}
        </p>

        {stage !== 'done' ? (
          <div className={stage === 'exiting' ? styles.stageExit : undefined}>
            <header className={styles.header}>
              <h2 id={headingId} className={styles.title}>
                Get your number.
              </h2>
              <p className={styles.subtitle}>
                Free AI estimates. Contractors matched at 80%+ compatibility.
                Northern Virginia first.
              </p>
              {counterLine}
            </header>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {/* Honeypot — real users never see or fill this field. */}
              <input
                type="text"
                name="website"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  width: '1px',
                  height: '1px',
                  opacity: 0
                }}
              />

              <div className={styles.field}>
                <label className={styles.label} htmlFor={nameId}>
                  Name
                </label>
                <input
                  ref={nameRef}
                  id={nameId}
                  className={styles.input}
                  type="text"
                  autoComplete="name"
                  placeholder="Sarah Johnson"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={error ? errorId : undefined}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor={emailId}>
                  Email
                </label>
                <input
                  id={emailId}
                  className={styles.input}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="sarah@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={error ? errorId : undefined}
                />
              </div>

              {/* Persistent aria-live wrapper announces errors; the inner <p>
                  carries no role="alert" to avoid double announcement. Text
                  names the problem — never color alone. */}
              <div aria-live="assertive">
                {error && (
                  <p id={errorId} className={styles.error}>
                    <span aria-hidden="true">✕</span>
                    <span>{error}</span>
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" isLoading={loading} className="w-full">
                {loading ? 'Joining…' : 'Join the waitlist'}
              </Button>

              <p className={styles.finePrint}>
                Name and email only. We&apos;ll reach you by email when your
                area opens.
              </p>
            </form>
          </div>
        ) : (
          <div className={`${styles.stageEnter} ${styles.success}`}>
            <header>
              <h2
                id={headingId}
                ref={successHeadingRef}
                tabIndex={-1}
                className={styles.positionLabel}
              >
                You&apos;re on the list
              </h2>
            </header>

            {positionNumber > 0 && (
              <PositionCountUp target={positionNumber} onSettled={handleSettled} />
            )}

            {isFounding && (
              <span className={styles.foundingBadge}>
                <Check className="w-4 h-4" aria-hidden="true" />
                Founding Member — first 500
              </span>
            )}

            <p className={styles.confirmCopy}>
              Check your email — your confirmation and next steps are on the
              way. Founding Members get first access at launch, in waves.
            </p>

            {referralLink && (
            <div className={styles.referralBox}>
              <p className={styles.referralLabel}>Your referral link</p>
              <div className={styles.referralRow}>
                <input
                  className={styles.referralInput}
                  type="text"
                  readOnly
                  value={referralLink}
                  aria-label="Your referral link"
                  onFocus={e => e.currentTarget.select()}
                />
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={handleCopy}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="sr-only" aria-live="polite">
                {copied ? 'Referral link copied to clipboard.' : ''}
              </p>
            </div>
            )}

            <div className={styles.tiers}>
              {REFERRAL_TIERS.map(tier => (
                <p key={tier.count} className={styles.tier}>
                  <span className={styles.tierCount}>{tier.count}</span>
                  <span>{tier.reward}</span>
                </p>
              ))}
            </div>

            <p className={styles.finePrint}>
              Each verified referral moves you up ~100 spots.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

/**
 * The reusable trigger — any CTA site-wide opens the modal through this.
 * Renders a plain button (style it via className) and handles open state
 * plus focus return.
 */
export function WaitlistModalTrigger({
  children,
  className,
  topLight = true
}: {
  children: ReactNode
  className?: string
  topLight?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={className}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      {/* Lazy-mounted: the modal (and its stats fetch) only exists while
          open — a page full of triggers costs zero requests until a click. */}
      {open && (
        <WaitlistModal open onClose={() => setOpen(false)} topLight={topLight} />
      )}
    </>
  )
}
