'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Wordmark } from '@/components/ui/logo'
import { WaitlistModalTrigger } from '@/components/waitlist/WaitlistModal'

/**
 * DRAWING SET nav — a floating hairline frame, not a glass pill.
 * See DESIGN_SYSTEM.md. Tokens only; spacing on the 8px unit.
 *
 * Accent discipline (founder-locked): the hero's .btn-primary owns the single
 * accent fill in viewport 1, so this nav CTA is the quiet hairline variant.
 * The mobile-overlay CTA stays hairline for the same reason.
 *
 * Nav labels are annotation: mono, uppercase, 11px. They label destinations
 * rather than being the destination, so they are mono by the rule in §TYPE.
 */

const NAV_LINKS = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Founders', href: '/founders' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' }
] as const

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--outline-color)]'

export function HomeNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className="sticky z-50"
      style={{
        top: 'var(--space-2)',
        paddingLeft: 'var(--space-3)',
        paddingRight: 'var(--space-3)',
        paddingTop: 'var(--space-2)'
      }}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex items-center justify-between backdrop-blur-xl"
        style={{
          maxWidth: 'var(--max-width-section)',
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--radius-control)',
          background: 'color-mix(in srgb, var(--color-base) 88%, transparent)',
          paddingLeft: 'var(--space-2)',
          paddingRight: 'var(--space-2)',
          paddingTop: 'var(--space-1)',
          paddingBottom: 'var(--space-1)'
        }}
      >
        <Link
          href="/"
          aria-label="Laywork, home"
          className={`inline-flex items-center ${FOCUS_RING}`}
          style={{ minHeight: 'var(--space-6)' }}
        >
          <Wordmark dark size="sm" />
        </Link>

        <div
          className="hidden items-center md:flex"
          style={{ gap: 'var(--space-1)' }}
        >
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`annotation inline-flex items-center transition-colors hover:text-[var(--color-ink)] ${FOCUS_RING}`}
              style={{
                minHeight: 'var(--space-6)',
                paddingLeft: 'var(--space-2)',
                paddingRight: 'var(--space-2)',
                transitionDuration: 'var(--dur-fast)',
                transitionTimingFunction: 'var(--ease-precise)'
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
          <WaitlistModalTrigger className="btn-secondary hidden sm:inline-flex">
            Join the waitlist
          </WaitlistModalTrigger>

          {/* Hamburger — two hairlines that morph into an X. Transform only. */}
          <button
            type="button"
            onClick={() => setOpen(value => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className={`relative flex items-center justify-center md:hidden ${FOCUS_RING}`}
            style={{
              width: 'var(--space-6)',
              height: 'var(--space-6)',
              color: 'var(--color-ink)',
              borderRadius: 'var(--radius-control)'
            }}
          >
            <span
              aria-hidden="true"
              className="absolute transition-transform motion-reduce:transition-none"
              style={{
                width: 'var(--space-3)',
                height: 'var(--hairline)',
                background: 'currentColor',
                /* half-unit offsets are glyph metrics, not layout spacing */
                transform: open
                  ? 'rotate(45deg)'
                  : 'translateY(calc(var(--space-1) / -2))',
                transitionDuration: 'var(--dur-fast)',
                transitionTimingFunction: 'var(--ease-precise)'
              }}
            />
            <span
              aria-hidden="true"
              className="absolute transition-transform motion-reduce:transition-none"
              style={{
                width: 'var(--space-3)',
                height: 'var(--hairline)',
                background: 'currentColor',
                transform: open
                  ? 'rotate(-45deg)'
                  : 'translateY(calc(var(--space-1) / 2))',
                transitionDuration: 'var(--dur-fast)',
                transitionTimingFunction: 'var(--ease-precise)'
              }}
            />
          </button>
        </div>
      </nav>

      {/* Full-screen overlay — sits beneath the bar so the X stays visible. */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`fixed inset-0 -z-10 flex flex-col justify-center backdrop-blur-xl transition-opacity motion-reduce:transition-none md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{
          background: 'color-mix(in srgb, var(--color-base) 96%, transparent)',
          paddingLeft: 'var(--space-5)',
          paddingRight: 'var(--space-5)',
          transitionDuration: 'var(--dur-base)',
          transitionTimingFunction: 'var(--ease-precise)'
        }}
      >
        <p className="annotation" style={{ marginBottom: 'var(--space-3)' }}>
          Index
        </p>
        <hr className="rule" />

        {NAV_LINKS.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            style={{
              transitionDelay: open ? `${80 + index * 40}ms` : '0ms',
              transitionDuration: 'var(--dur-base)',
              transitionTimingFunction: 'var(--ease-precise)',
              minHeight: 'var(--space-8)',
              borderBottom: '1px solid var(--color-line)',
              color: 'var(--color-ink)'
            }}
            className={`flex items-baseline transition-[transform,opacity] motion-reduce:transition-none ${
              open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            } ${FOCUS_RING}`}
          >
            <span
              className="annotation"
              aria-hidden="true"
              style={{ width: 'var(--space-5)', flexShrink: 0 }}
            >
              {`0${index + 1}`}
            </span>
            <span
              style={{
                fontSize: 'var(--type-5)',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-display)',
                paddingTop: 'var(--space-3)',
                paddingBottom: 'var(--space-3)'
              }}
            >
              {link.label}
            </span>
          </Link>
        ))}

        <div
          style={{
            marginTop: 'var(--space-5)',
            transitionDelay: open ? '240ms' : '0ms',
            transitionDuration: 'var(--dur-base)',
            transitionTimingFunction: 'var(--ease-precise)'
          }}
          className={`transition-[transform,opacity] motion-reduce:transition-none ${
            open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <WaitlistModalTrigger className="btn-secondary w-full">
            Join the waitlist
          </WaitlistModalTrigger>
        </div>
      </div>
    </header>
  )
}
