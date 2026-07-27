import type { Metadata } from 'next'

/**
 * Unsubscribe confirmation.
 *
 * GET never mutates (mail clients and security appliances prefetch links),
 * so this page only confirms intent and POSTs to /api/unsubscribe. It is a
 * plain <form>, not a fetch, so it works with JavaScript disabled and inside
 * the stripped-down browsers some mail clients open links in.
 *
 * All colour comes from the DRAWING SET tokens in app/globals.css. Zero
 * hardcoded values, per DESIGN_SYSTEM.md.
 */

export const metadata: Metadata = {
  title: 'Unsubscribe / Laywork',
  robots: { index: false, follow: false }
}

const mono: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--type-1)',
  letterSpacing: 'var(--tracking-mono)',
  textTransform: 'uppercase',
  color: 'var(--color-muted)'
}

function RegistrationFrame({ children }: { children: React.ReactNode }) {
  const leg = '10px'
  const rule = '1px solid var(--color-line-strong)'
  return (
    <div style={{ position: 'relative', padding: 'var(--space-6)' }}>
      <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, width: leg, height: leg, borderTop: rule, borderLeft: rule }} />
      <span aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: leg, height: leg, borderTop: rule, borderRight: rule }} />
      <span aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, width: leg, height: leg, borderBottom: rule, borderLeft: rule }} />
      <span aria-hidden style={{ position: 'absolute', bottom: 0, right: 0, width: leg, height: leg, borderBottom: rule, borderRight: rule }} />
      {children}
    </div>
  )
}

export default async function UnsubscribePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const token = typeof params.t === 'string' ? params.t : ''
  const state = typeof params.state === 'string' ? params.state : ''

  const sheet: React.CSSProperties = {
    maxWidth: '560px',
    margin: '0 auto',
    padding: 'var(--section-y-mobile) var(--space-3)'
  }

  const body: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--type-3)',
    lineHeight: 'var(--leading-body)',
    color: 'var(--color-ink-2)',
    margin: 0
  }

  const headline: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--type-5)',
    lineHeight: 'var(--leading-display)',
    letterSpacing: 'var(--tracking-display)',
    color: 'var(--color-ink)',
    fontWeight: 600,
    margin: 0
  }

  let sheetNumber: string
  let title: string
  let message: string
  let showForm = false

  if (state === 'done') {
    sheetNumber = '00 / UNSUBSCRIBED'
    title = 'Done. You are off the list.'
    message =
      'We will not send you any more email about the Laywork founding waitlist. Your place on the list is unchanged, so if you asked to be removed by mistake you have not lost your position. Reply to any earlier message and we will put you back on.'
  } else if (state === 'error' || !token) {
    sheetNumber = '00 / LINK NOT VALID'
    title = 'That link did not work.'
    message =
      'The unsubscribe link is missing or has been altered in transit, which some email clients do to long links. Open the original message and click Unsubscribe again, or reply to it and we will remove you by hand.'
  } else {
    sheetNumber = '00 / CONFIRM'
    title = 'Stop email from Laywork?'
    message =
      'One click and we stop emailing you about the founding waitlist. Your position on the list stays exactly where it is.'
    showForm = true
  }

  return (
    <main style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <div style={sheet}>
        <div style={{ ...mono, marginBottom: 'var(--space-2)' }}>LAYWORK / FOUNDING WAITLIST</div>
        <div style={{ borderTop: '1px solid var(--color-line)', marginBottom: 'var(--space-5)' }} />

        <RegistrationFrame>
          <div style={{ ...mono, marginBottom: 'var(--space-2)' }}>{sheetNumber}</div>
          <h1 style={headline}>{title}</h1>
          <div style={{ height: 'var(--space-2)' }} />
          <p style={body}>{message}</p>

          {showForm ? (
            <form method="post" action="/api/unsubscribe" style={{ marginTop: 'var(--space-4)' }}>
              <input type="hidden" name="t" value={token} />
              <button
                type="submit"
                style={{
                  minHeight: '44px',
                  padding: '0 var(--space-3)',
                  background: 'var(--color-accent)',
                  color: 'var(--color-base)',
                  border: 'none',
                  borderRadius: 'var(--radius-control)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--type-3)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Unsubscribe me
              </button>
            </form>
          ) : null}
        </RegistrationFrame>

        <div style={{ borderTop: '1px solid var(--color-line)', margin: 'var(--space-5) 0 var(--space-2)' }} />
        <div style={mono}>LAYWORK / NORTHERN VIRGINIA</div>
      </div>
    </main>
  )
}
