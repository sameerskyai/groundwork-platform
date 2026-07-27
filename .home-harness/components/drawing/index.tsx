/**
 * DRAWING SET — the five signature elements.
 * See DESIGN_SYSTEM.md. Tokens only; no hardcoded values.
 */

import type { ReactNode } from 'react'

/* ------------------------------------------------------------------
   1. REGISTRATION MARKS — L-shaped corner ticks, crop marks on a sheet.
   This one detail carries the aesthetic.
   ------------------------------------------------------------------ */

export function RegistrationMarks({ inset = '0px' }: { inset?: string }) {
  const leg = '10px'
  const common: React.CSSProperties = {
    position: 'absolute',
    width: leg,
    height: leg,
    borderColor: 'var(--color-line-strong)',
    borderStyle: 'solid',
    pointerEvents: 'none'
  }
  return (
    <span aria-hidden="true">
      <span style={{ ...common, top: inset, left: inset, borderWidth: '1px 0 0 1px' }} />
      <span style={{ ...common, top: inset, right: inset, borderWidth: '1px 1px 0 0' }} />
      <span style={{ ...common, bottom: inset, left: inset, borderWidth: '0 0 1px 1px' }} />
      <span style={{ ...common, bottom: inset, right: inset, borderWidth: '0 1px 1px 0' }} />
    </span>
  )
}

/* ------------------------------------------------------------------
   2. SHEET NUMBERING — "01 / THE PROBLEM". Numbered like drawings.
   ------------------------------------------------------------------ */

export function SheetNumber({ number, label }: { number: string; label: string }) {
  return (
    <p className="annotation" style={{ marginBottom: 'var(--space-3)' }}>
      {number} <span style={{ color: 'var(--color-line-strong)' }}>/</span> {label}
    </p>
  )
}

/* ------------------------------------------------------------------
   3. DIMENSION LINE — a thin rule with end-ticks under a number that
   carries argument, plus its mono unit label. Data feels measured.
   ------------------------------------------------------------------ */

export function DimensionLine({
  label,
  width = '100%'
}: {
  label: string
  width?: string
}) {
  return (
    <div style={{ width, marginTop: 'var(--space-2)' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          height: '8px',
          borderTop: '1px solid var(--color-line-strong)'
        }}
      >
        {/* end ticks */}
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '1px',
            height: '8px',
            background: 'var(--color-line-strong)'
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '1px',
            height: '8px',
            background: 'var(--color-line-strong)'
          }}
        />
      </div>
      <p className="annotation" style={{ marginTop: 'var(--space-1)' }}>
        {label}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------
   4. VISIBLE GRID — faint 8px grid behind at most two sections.
   Decorative only, aria-hidden, pointer-events none.
   ------------------------------------------------------------------ */

export function GridBackdrop({ fade = true }: { fade?: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage:
          'linear-gradient(to right, var(--color-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)',
        backgroundSize: '8px 8px',
        opacity: 0.04,
        maskImage: fade
          ? 'linear-gradient(to bottom, var(--color-ink) 0%, transparent 92%)'
          : undefined,
        WebkitMaskImage: fade
          ? 'linear-gradient(to bottom, var(--color-ink) 0%, transparent 92%)'
          : undefined
      }}
    />
  )
}

/* ------------------------------------------------------------------
   Sheet — a major block: registration marks + optional sheet number.
   ------------------------------------------------------------------ */

export function Sheet({
  number,
  label,
  children,
  alt = false,
  grid = false,
  id
}: {
  number?: string
  label?: string
  children: ReactNode
  alt?: boolean
  grid?: boolean
  id?: string
}) {
  return (
    <section
      id={id}
      style={{
        position: 'relative',
        background: alt ? 'var(--color-base-alt)' : 'var(--color-base)',
        paddingTop: 'var(--section-y-responsive, var(--section-y))',
        paddingBottom: 'var(--section-y-responsive, var(--section-y))',
        paddingLeft: 'var(--space-3)',
        paddingRight: 'var(--space-3)',
        overflow: 'hidden'
      }}
    >
      {grid && <GridBackdrop />}
      <div
        style={{
          position: 'relative',
          maxWidth: 'var(--max-width-section)',
          margin: '0 auto',
          padding: 'var(--space-3)'
        }}
      >
        <RegistrationMarks />
        {number && label && <SheetNumber number={number} label={label} />}
        {children}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------
   Card — white, hairline border, 4px radius, registration marks.
   ------------------------------------------------------------------ */

export function DrawingCard({
  children,
  interactive = false
}: {
  children: ReactNode
  interactive?: boolean
}) {
  return (
    <div
      className={interactive ? 'drawing-card drawing-card--interactive' : 'drawing-card'}
      style={{
        position: 'relative',
        background: 'var(--color-base)',
        border: '1px solid var(--color-line)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-4)'
      }}
    >
      <RegistrationMarks inset="6px" />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------
   MeasuredNumber — a number that carries argument: display size,
   tabular, dimension line, mono unit label.
   ------------------------------------------------------------------ */

export function MeasuredNumber({
  value,
  label,
  size = 'var(--type-7)'
}: {
  value: string
  label: string
  size?: string
}) {
  return (
    <div>
      <p
        className="tabular"
        style={{
          fontSize: size,
          lineHeight: 'var(--leading-display)',
          letterSpacing: 'var(--tracking-display-lg)',
          color: 'var(--color-ink)',
          fontWeight: 600,
          margin: 0
        }}
      >
        {value}
      </p>
      <DimensionLine label={label} />
    </div>
  )
}
