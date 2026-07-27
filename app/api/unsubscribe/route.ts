import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'

/**
 * Unsubscribe. POST only, by design.
 *
 * Two things are deliberate here:
 *
 * 1. The token carries an HMAC of the waitlist row id, not the email address.
 *    An address in a query string leaks through Referer headers, proxy logs,
 *    corporate link scanners, and every forward of the message, and it would
 *    let anyone unsubscribe anyone by editing the URL.
 *
 * 2. GET does not unsubscribe. Outlook, Gmail, and most security appliances
 *    prefetch links in email; a GET that mutates would silently unsubscribe
 *    people who never clicked anything. GET returns 405 and points at the
 *    confirmation page, which is what the visible footer link goes to.
 *
 * POST serves both callers: the RFC 8058 one-click header (a bare POST from
 * the mail client, no body, no cookies) and the form on /unsubscribe. The
 * form path asks for HTML back and gets a redirect; the mail client path asks
 * for nothing and gets JSON.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function tokenFromRequest(request: Request, formToken?: string | null): string | null {
  const url = new URL(request.url)
  return formToken || url.searchParams.get('t')
}

export async function POST(request: Request) {
  const wantsHtml = (request.headers.get('accept') || '').includes('text/html')
  const origin = new URL(request.url).origin

  const fail = (status: number, error: string) =>
    wantsHtml
      ? Response.redirect(`${origin}/unsubscribe?state=error`, 303)
      : Response.json({ error }, { status })

  let formToken: string | null = null
  const contentType = request.headers.get('content-type') || ''
  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    try {
      const form = await request.formData()
      const value = form.get('t')
      formToken = typeof value === 'string' ? value : null
    } catch {
      // One-click POSTs from mail clients send List-Unsubscribe=One-Click as a
      // form body we do not need; a parse failure here is not an error.
    }
  }

  const waitlistId = verifyUnsubscribeToken(tokenFromRequest(request, formToken))
  if (!waitlistId) {
    return fail(400, 'Invalid or expired unsubscribe link')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Idempotent: unsubscribing twice is a success, not an error. Mail clients
  // retry one-click POSTs and users click the footer link more than once.
  const { error } = await supabase
    .from('waitlist')
    .update({ email_unsubscribed_at: new Date().toISOString() })
    .eq('id', waitlistId)
    .is('email_unsubscribed_at', null)

  if (error) {
    console.error('Unsubscribe update failed:', error)
    return fail(500, 'Could not process unsubscribe. Please try again.')
  }

  if (wantsHtml) {
    return Response.redirect(`${origin}/unsubscribe?state=done`, 303)
  }
  return Response.json({ success: true, unsubscribed: true }, { status: 200 })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('t')
  const target = token
    ? `${url.origin}/unsubscribe?t=${encodeURIComponent(token)}`
    : `${url.origin}/unsubscribe`
  return Response.json(
    { error: 'Use POST to unsubscribe.', confirm: target },
    { status: 405, headers: { Allow: 'POST' } }
  )
}
