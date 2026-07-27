'use client'

/**
 * Shared feedback primitives for the authenticated app.
 *
 * Two rules this file exists to enforce:
 *  1. An error is never colour-alone (WCAG 1.4.1). Every <Notice> carries an
 *     icon glyph AND the word for what happened AND body text, so it reads the
 *     same to someone who cannot see the alert red.
 *  2. An empty state is never a dead end. <EmptyState> requires an action --
 *     the prop is not optional.
 *
 * Colour comes only from the eleven tokens in app/globals.css. These surfaces
 * are all light (base / base-alt), so --color-muted and --color-ink-2 are legal
 * here; nothing in this file sits on a dark background.
 */

import Link from 'next/link'
import type { ReactNode } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import type { FriendlyError } from '../_lib/errors'

// ---------------------------------------------------------------- Notice

export function Notice({ error, tone = 'alert' }: { error: FriendlyError; tone?: 'alert' | 'info' }) {
  const isAlert = tone === 'alert'
  const Icon = isAlert ? AlertTriangle : Info
  const edge = isAlert ? 'var(--color-alert)' : 'var(--color-line-strong)'

  return (
    <div
      role={isAlert ? 'alert' : 'status'}
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        alignItems: 'flex-start',
        padding: 'var(--space-2)',
        background: 'var(--color-base-alt)',
        border: '1px solid var(--color-line)',
        borderLeft: `3px solid ${edge}`,
        borderRadius: 'var(--radius-card)'
      }}
    >
      <Icon
        aria-hidden="true"
        style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2, color: edge }}
      />
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--type-3)',
            fontWeight: 600,
            color: 'var(--color-ink)'
          }}
        >
          {/* The glyph is decorative; this word is what actually names the state. */}
          {isAlert ? 'Problem: ' : 'Heads up: '}
          {error.title}
        </p>
        <p
          style={{
            margin: 'var(--space-1) 0 0 0',
            fontSize: 'var(--type-2)',
            lineHeight: 'var(--leading-body)',
            color: 'var(--color-ink-2)'
          }}
        >
          {error.detail}
        </p>
      </div>
    </div>
  )
}

// ------------------------------------------------------------ EmptyState

export type EmptyAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never }

function ActionButton({ action, variant }: { action: EmptyAction; variant: 'btn-primary' | 'btn-secondary' }) {
  if (action.href) {
    return (
      <Link href={action.href} className={variant} style={{ textDecoration: 'none' }}>
        {action.label}
      </Link>
    )
  }
  return (
    <button type="button" onClick={action.onClick} className={variant} style={{ border: variant === 'btn-primary' ? 'none' : undefined, cursor: 'pointer' }}>
      {action.label}
    </button>
  )
}

/**
 * `action` is required on purpose: an empty state with no way forward is the
 * dead end this rewrite exists to remove.
 */
export function EmptyState({
  glyph,
  title,
  why,
  action,
  secondary
}: {
  glyph: ReactNode
  /** What is empty, said plainly. */
  title: string
  /** WHY it is empty. Not decoration -- this is the whole point. */
  why: string
  action: EmptyAction
  secondary?: EmptyAction
}) {
  return (
    <div
      style={{
        background: 'var(--color-base)',
        border: '1px solid var(--color-line)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-6) var(--space-4)',
        textAlign: 'center'
      }}
    >
      <div
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-card)',
          background: 'var(--color-accent-wash)',
          color: 'var(--color-accent)',
          marginBottom: 'var(--space-2)'
        }}
      >
        {glyph}
      </div>
      <h2
        style={{
          fontSize: 'var(--type-4)',
          fontWeight: 600,
          color: 'var(--color-ink)',
          margin: '0 0 var(--space-1) 0',
          letterSpacing: 'var(--tracking-display)'
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 'var(--type-3)',
          lineHeight: 'var(--leading-body)',
          color: 'var(--color-ink-2)',
          maxWidth: '44ch',
          margin: '0 auto var(--space-3) auto'
        }}
      >
        {why}
      </p>
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-1)',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}
      >
        <ActionButton action={action} variant="btn-primary" />
        {secondary && <ActionButton action={secondary} variant="btn-secondary" />}
      </div>
    </div>
  )
}

// -------------------------------------------------------------- Loading

export function Loading({ what }: { what: string }) {
  return (
    <div
      role="status"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        background: 'var(--color-base)'
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '2px solid var(--color-line)',
          borderTopColor: 'var(--color-accent)',
          animation: 'spin 800ms linear infinite'
        }}
      />
      <p className="annotation" style={{ margin: 0 }}>{what}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// --------------------------------------------------------------- Avatar

/**
 * profiles.avatar_url is owner-only under RLS and is never written by the app
 * (FEATURE_INVENTORY.md), so an image is the exception, not the rule. The
 * monogram is the real avatar for almost every participant -- it must look
 * deliberate, not like a broken image.
 */
export function Avatar({
  name,
  src,
  size = 40
}: {
  name: string
  src?: string | null
  size?: number
}) {
  const initials = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--radius-card)',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1px solid var(--color-line)'
        }}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-accent-wash)',
        color: 'var(--color-accent)',
        border: '1px solid var(--color-line)',
        fontFamily: 'var(--font-mono)',
        fontSize: Math.max(11, Math.round(size * 0.36)),
        fontWeight: 600,
        letterSpacing: '0.04em'
      }}
    >
      {initials || '?'}
    </span>
  )
}

// ------------------------------------------------------------ Page shell

export function PageHeader({
  back,
  title,
  trailing
}: {
  /** Where "back" actually goes, and what we promise it does. */
  back: { href: string; label: string }
  title: string
  trailing?: ReactNode
}) {
  return (
    <header
      style={{
        background: 'var(--color-base)',
        borderBottom: '1px solid var(--color-line)',
        padding: 'var(--space-2) var(--space-3)',
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}
      >
        <Link
          href={back.href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 44,
            fontSize: 'var(--type-2)',
            color: 'var(--color-accent)',
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <span aria-hidden="true">&larr;</span> {back.label}
        </Link>
        <h1
          style={{
            flex: 1,
            margin: 0,
            fontSize: 'var(--type-4)',
            fontWeight: 600,
            color: 'var(--color-ink)',
            letterSpacing: 'var(--tracking-display)',
            textAlign: 'center'
          }}
        >
          {title}
        </h1>
        <div style={{ minWidth: 64, textAlign: 'right' }}>{trailing}</div>
      </div>
    </header>
  )
}

/** Relative time for inbox rows. Absolute time is always shown in the thread. */
export function relativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  if (mins < 10080) return `${Math.floor(mins / 1440)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Full, unambiguous timestamp for a single message. */
export function messageTimestamp(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today ${time}`
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`
}
