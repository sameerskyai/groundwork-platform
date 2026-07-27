import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'

/**
 * DRAWING SET footer — hairline top rule, mono links, wordmark, one legal
 * line. The title block at the bottom of a drawing sheet.
 * See DESIGN_SYSTEM.md. Tokens only; spacing on the 8px unit.
 */

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
    <footer
      style={{
        borderTop: '1px solid var(--color-line)',
        background: 'var(--color-base)',
        paddingTop: 'var(--space-8)',
        paddingBottom: 'var(--space-8)',
        paddingLeft: 'var(--space-3)',
        paddingRight: 'var(--space-3)'
      }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 'var(--max-width-section)' }}
      >
        <div
          className="flex flex-col items-start justify-between sm:flex-row sm:items-center"
          style={{ gap: 'var(--space-4)' }}
        >
          <Link
            href="/"
            aria-label="Laywork, home"
            className={`inline-flex items-center ${FOCUS_RING}`}
            style={{ minHeight: 'var(--space-6)' }}
          >
            <Wordmark dark size="sm" />
          </Link>

          <nav aria-label="Footer">
            <ul
              className="flex flex-wrap items-center"
              style={{ gap: 'var(--space-1)' }}
            >
              {FOOTER_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`annotation inline-flex items-center transition-colors hover:text-[var(--color-ink)] ${FOCUS_RING}`}
                    style={{
                      minHeight: 'var(--space-6)',
                      paddingLeft: 'var(--space-1)',
                      paddingRight: 'var(--space-1)',
                      transitionDuration: 'var(--dur-fast)',
                      transitionTimingFunction: 'var(--ease-precise)'
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <hr
          className="rule"
          style={{
            marginTop: 'var(--space-4)',
            marginBottom: 'var(--space-3)'
          }}
        />

        <p className="annotation">&copy; 2026 Laywork. All rights reserved.</p>
      </div>
    </footer>
  )
}
