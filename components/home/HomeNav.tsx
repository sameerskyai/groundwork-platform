'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Wordmark } from '@/components/ui/logo'
import { WaitlistModalTrigger } from '@/components/waitlist/WaitlistModal'

const NAV_LINKS = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Founders', href: '/founders' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' }
] as const

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--outline-color)]'

/**
 * Floating detached nav bar — glass pill, sticky with a small top offset.
 *
 * CTA rule (founder-locked): the hero's solid blue button owns the single
 * accent fill in the first viewport, so this nav CTA is deliberately the
 * quiet outlined variant (1px accent border, accent text, fills on hover).
 * The mobile-menu CTA stays outlined for the same reason.
 */
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
    <header className="sticky top-3 z-50 px-4 sm:top-4 sm:px-6">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-5xl items-center justify-between rounded-full border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-base)_82%,transparent)] py-2 pl-4 pr-2 backdrop-blur-xl sm:pl-5"
      >
        <Link
          href="/"
          aria-label="Laywork — home"
          className={`flex min-h-11 items-center rounded-full ${FOCUS_RING}`}
        >
          <Wordmark dark size="sm" />
        </Link>

        <div className="hidden items-center md:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-[var(--color-ink)] transition-colors duration-300 ease-[var(--ease-out-expo)] hover:text-[var(--color-accent)] ${FOCUS_RING}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <WaitlistModalTrigger
            className={`hidden min-h-11 items-center rounded-full border border-[var(--color-accent)] px-5 text-sm font-medium text-[var(--color-accent)] transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-[var(--color-accent)] hover:text-[var(--color-base)] active:scale-[0.98] sm:inline-flex ${FOCUS_RING}`}
          >
            Join the waitlist
          </WaitlistModalTrigger>

          {/* Hamburger — two spans that morph into an X */}
          <button
            type="button"
            onClick={() => setOpen(value => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className={`relative flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-ink)] md:hidden ${FOCUS_RING}`}
          >
            <span
              aria-hidden="true"
              className={`absolute h-[1.5px] w-5 rounded-full bg-current transition-transform duration-300 ease-[var(--ease-out-expo)] motion-reduce:transition-none ${
                open ? 'rotate-45' : '-translate-y-[3.5px]'
              }`}
            />
            <span
              aria-hidden="true"
              className={`absolute h-[1.5px] w-5 rounded-full bg-current transition-transform duration-300 ease-[var(--ease-out-expo)] motion-reduce:transition-none ${
                open ? '-rotate-45' : 'translate-y-[3.5px]'
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Full-screen mobile menu — sits beneath the pill so the X stays visible */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`fixed inset-0 -z-10 flex flex-col items-center justify-center gap-1 bg-[color-mix(in_srgb,var(--color-base)_88%,transparent)] backdrop-blur-2xl transition-opacity duration-500 ease-[var(--ease-out-expo)] motion-reduce:transition-none md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {NAV_LINKS.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? `${100 + index * 50}ms` : '0ms' }}
            className={`inline-flex min-h-11 items-center rounded-full px-6 py-2 text-[length:var(--text-3xl)] font-semibold tracking-[-0.02em] text-[var(--color-ink)] transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)] motion-reduce:transition-none ${
              open ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            } ${FOCUS_RING}`}
          >
            {link.label}
          </Link>
        ))}

        <WaitlistModalTrigger
          className={`mt-8 inline-flex min-h-12 items-center rounded-full border border-[var(--color-accent)] px-7 text-base font-medium text-[var(--color-accent)] transition-[transform,opacity,background-color,color] duration-500 ease-[var(--ease-out-expo)] hover:bg-[var(--color-accent)] hover:text-[var(--color-base)] motion-reduce:transition-none ${
            open ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          } ${FOCUS_RING}`}
        >
          Join the waitlist
        </WaitlistModalTrigger>
      </div>
    </header>
  )
}
