import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'

const FOOTER_LINKS = [
  { label: 'Founders Program', href: '/founders' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Check your status', href: '/status' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' }
] as const

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--outline-color)]'

export function HomeFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-base)] px-4 py-14 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <Link
            href="/"
            aria-label="Laywork — home"
            className={`inline-flex min-h-11 items-center rounded-full ${FOCUS_RING}`}
          >
            <Wordmark dark size="sm" />
          </Link>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {FOOTER_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors duration-300 ease-[var(--ease-out-expo)] hover:text-[var(--color-ink)] ${FOCUS_RING}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="text-sm text-[var(--color-text-muted)]">
          &copy; 2026 Laywork. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
