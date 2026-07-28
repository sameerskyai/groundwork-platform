'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useWaitlistSignup } from '@/hooks/useWaitlistSignup'
import { RegistrationMarks, DimensionLine } from '@/components/drawing'
import styles from './WaitlistModal.module.css'

/**
 * The Laywork waitlist modal — the conversion moment, in DRAWING SET language.
 *
 * Signup logic is NOT reimplemented here: this wraps hooks/useWaitlistSignup.ts,
 * the same path /waitlist consumes (same API route, same honeypot, same
 * referral/UTM capture). One signup path, RLS untouched.
 *
 * Look per DESIGN_SYSTEM.md "THE WAITLIST MODAL": a lit panel hovering above
 * the page — layered ambient + contact shadows, blurred backdrop, a lit accent
 * edge with a soft bloom, registration marks at the four corners, and an entry
 * that scales up from the trigger's own position on screen.
 */

const REFERRAL_TIERS = [
  { count: 3, reward: 'Founding Member status' },
  { count: 5, reward: 'Free Home Backstory report at launch' },
  { count: 10, reward: 'Laywork+ locked at $49/yr for life' }
] as const

/* Founder decision 2026-07-28: the first 500 receive three months free of the
   highest homeowner plan at launch. Value conflict with the 10-referral tier
   was reported and is logged in DECISIONS.md; this is the founder's chosen
   wording, not a silent substitution. */
const FOUNDING_REWARD = 'Three months of Laywork+ free at launch'

/* Section 5: one optional question AFTER the reveal, never in the form.
   Skippable in a tap, never blocking, never required. */
const PROJECT_OPTIONS = [
  'Kitchen',
  'Bathroom',
  'Roof',
  'HVAC',
  'Addition',
  'Something else'
] as const

/** A viewport point — the centre of the button that opened the modal. */
export type ModalOrigin = { x: number; y: number }

/** useLayoutEffect that stays quiet during SSR (this file is client-only). */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Counts up to the real position over ~800ms, then settles. Reduced motion
 *  jumps straight to the final number — no count-up at all. */
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
      // Exponential ease-out — fast rise, gentle settle. No overshoot.
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
      {value.toLocaleString()}
    </p>
  )
}

export function WaitlistModal({
  open,
  onClose,
  origin,
  topLight = true
}: {
  open: boolean
  onClose: () => void
  /** Viewport point the panel grows from — the trigger's own rect centre. */
  origin?: ModalOrigin | null
  /** Faint accent wash across the top edge: light falling from above. */
  topLight?: boolean
}) {
  const {
    name, setName,
    email, setEmail,
    website, setWebsite,
    loading, submitted, error,
    positionNumber, referralLink, referralCode,
    spotsRemaining, isFounding,
    submit
  } = useWaitlistSignup()

  const [stage, setStage] = useState<'form' | 'exiting' | 'done'>('form')
  const [pulsing, setPulsing] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [project, setProject] = useState<string | null>(null)
  const [projectDone, setProjectDone] = useState(false)
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  // The entry originates from the trigger, not screen centre. transform-origin
  // is measured against the panel's own box, so convert the trigger's viewport
  // point into panel-local coordinates. This runs before paint, so the CSS
  // animation starts from the correct origin on its very first frame.
  useIsomorphicLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || !open) return
    if (!origin) {
      panel.style.transformOrigin = '50% 50%'
      return
    }
    const rect = panel.getBoundingClientRect()
    panel.style.transformOrigin = `${Math.round(origin.x - rect.left)}px ${Math.round(
      origin.y - rect.top
    )}px`
  }, [open, mounted, origin])

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
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
    }
  }, [])

  const handleSettled = useCallback(() => {
    // The beat between the number settling and the badge arriving is the
    // whole point of the reveal; reduced motion still reveals, just at once.
    if (prefersReducedMotion()) { setRevealed(true); return }
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
    revealTimerRef.current = setTimeout(() => setRevealed(true), 550)
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

  // Real data only. The counter renders solely from the live stats value; if
  // it is unavailable the whole line is hidden. Never a fabricated number.
  const counterLine =
    typeof spotsRemaining === 'number' && Number.isFinite(spotsRemaining) ? (
      <p className={`annotation ${styles.counter}`}>
        {spotsRemaining > 0
          ? `${spotsRemaining.toLocaleString()} of 500 founding spots remaining`
          : 'Founding 500 is full / general waitlist open'}
      </p>
    ) : null

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
        {/* Crop marks on a drawing sheet — pinned to the panel, not the scroll. */}
        <RegistrationMarks inset="8px" />

        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <X className={styles.closeIcon} strokeWidth={1.25} aria-hidden="true" />
        </button>

        <div className={styles.scroll}>
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
                {counterLine}
                <h2 id={headingId} className={styles.title}>
                  Get your number.
                </h2>
                <p className={styles.subtitle}>
                  Free AI estimates. Contractors matched at 80%+ compatibility.
                  Wherever you own.
                </p>
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
                  className={styles.honeypot}
                />

                <div className={styles.field}>
                  <label className={`annotation ${styles.label}`} htmlFor={nameId}>
                    Name
                  </label>
                  <input
                    ref={nameRef}
                    id={nameId}
                    className="drawing-input"
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
                  <label className={`annotation ${styles.label}`} htmlFor={emailId}>
                    Email
                  </label>
                  <input
                    id={emailId}
                    className="drawing-input"
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
                    carries no role="alert" to avoid double announcement. A mono
                    ERROR tag plus the message names the problem — never colour
                    alone. */}
                <div aria-live="assertive">
                  {error && (
                    <p id={errorId} className={styles.error}>
                      <span className={`annotation ${styles.errorTag}`} aria-hidden="true">
                        Error
                      </span>
                      <span className={styles.errorText}>{error}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`btn-primary ${styles.submit}`}
                  disabled={loading}
                >
                  {loading ? 'Joining' : 'Join the waitlist'}
                </button>

                <p className={`annotation ${styles.finePrint}`}>
                  Name and email only / we reach you by email
                </p>
              </form>
            </div>
          ) : (
            <div className={`${styles.stageEnter} ${styles.success}`}>
              <h2
                id={headingId}
                ref={successHeadingRef}
                tabIndex={-1}
                className={`annotation ${styles.successHeading}`}
              >
                You are on the list
              </h2>

              {/* A number that carries argument: display size, tabular, measured.
                  The honeypot path returns no position — show the confirmation
                  without a fabricated number rather than crashing. */}
              {positionNumber > 0 && (
                <div className={styles.positionBlock}>
                  <PositionCountUp target={positionNumber} onSettled={handleSettled} />
                  <DimensionLine label="Position / Laywork founding waitlist" />
                </div>
              )}

              {/* Section 4 — the reveal. Founding status is never promised in
                  the form; it is revealed here, and only to someone who
                  actually earned it. `revealed` flips one beat after the
                  count-up settles, so the number lands first and the badge
                  arrives as its own moment. Non-founding signups never see
                  this block at all. */}
              {isFounding && revealed && (
                <div className={styles.revealBlock}>
                  <p className={`annotation ${styles.foundingBadge}`}>
                    Founding member / first 500
                  </p>
                  <p className={styles.revealReward}>{FOUNDING_REWARD}</p>
                </div>
              )}

              <p className={styles.confirmCopy}>
                {isFounding && revealed
                  ? 'Check your email. Your confirmation and next steps are on the way. You are in the first wave at launch.'
                  : 'Check your email. Your confirmation and next steps are on the way.'}
              </p>

              {referralLink && (
                <div className={styles.referralBox}>
                  <p className={`annotation ${styles.label}`}>Your referral link</p>
                  <div className={styles.referralRow}>
                    <input
                      className={`drawing-input ${styles.referralInput}`}
                      type="text"
                      readOnly
                      value={referralLink}
                      aria-label="Your referral link"
                      onFocus={e => e.currentTarget.select()}
                    />
                    <button
                      type="button"
                      className={`btn-primary ${styles.copyBtn}`}
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

              {/* Three tiers as a hairline technical table, not marketing cards. */}
              <table className={styles.tiers}>
                <thead>
                  <tr>
                    <th scope="col" className={`annotation ${styles.tierHead}`}>
                      Referrals
                    </th>
                    <th scope="col" className={`annotation ${styles.tierHead}`}>
                      Reward
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REFERRAL_TIERS.map(tier => (
                    <tr key={tier.count}>
                      <td className={styles.tierCount}>{tier.count}</td>
                      <td className={styles.tierReward}>{tier.reward}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Section 5 — ONE optional question, after the reveal, never in
                  the form. Every added field costs conversion, so this is
                  skippable in a single tap and never blocks anything. Stored
                  for email segmentation only. */}
              {!projectDone && (
                <div className={styles.projectQ}>
                  <p className={`annotation ${styles.label}`}>
                    What project are you planning? Optional
                  </p>
                  <div className={styles.projectOptions}>
                    {PROJECT_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={`${styles.projectChip} ${project === opt ? styles.projectChipOn : ''}`}
                        aria-pressed={project === opt}
                        onClick={() => {
                          setProject(opt)
                          void fetch('/api/waitlist/project', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ referralCode, project: opt })
                          }).catch(() => {})
                          setProjectDone(true)
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button type="button" className={styles.projectSkip} onClick={() => setProjectDone(true)}>
                    Skip
                  </button>
                </div>
              )}

              {projectDone && project && (
                <p className={`annotation ${styles.projectThanks}`} aria-live="polite">
                  Noted / {project}
                </p>
              )}

              <p className={`annotation ${styles.finePrint}`}>
                Each verified referral moves you up about 100 spots
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/**
 * The reusable trigger — any CTA site-wide opens the modal through this.
 * Renders a plain button (style it via className), owns the open state, and
 * measures its own rect on click so the panel grows from where the visitor
 * actually clicked rather than from the centre of the screen.
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
  const [origin, setOrigin] = useState<ModalOrigin | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  function handleOpen() {
    const rect = buttonRef.current?.getBoundingClientRect()
    setOrigin(
      rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null
    )
    setOpen(true)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={className}
        aria-haspopup="dialog"
        onClick={handleOpen}
      >
        {children}
      </button>
      {/* Lazy-mounted: the modal (and its stats fetch) only exists while
          open — a page full of triggers costs zero requests until a click. */}
      {open && (
        <WaitlistModal
          open
          onClose={() => setOpen(false)}
          origin={origin}
          topLight={topLight}
        />
      )}
    </>
  )
}
