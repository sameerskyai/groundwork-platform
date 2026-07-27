/**
 * Unsubscribe tokens.
 *
 * The requirement is a working one-click unsubscribe that does NOT put the
 * recipient's email address in a URL. Email addresses in query strings leak
 * through Referer headers, proxy logs, link scanners, and anyone the
 * recipient forwards the message to, and they let anyone unsubscribe anyone
 * by guessing.
 *
 * So the link carries `<waitlist.id>.<HMAC-SHA256(id)>` instead: opaque, not
 * guessable without the server secret, and it identifies exactly one row.
 * No address, no enumeration (the id is a v4 UUID), no database lookup
 * needed to reject a forged token.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import { appUrl, unsubscribeSecret } from './config'

const SEPARATOR = '.'

function signature(id: string, secret: string): string {
  return createHmac('sha256', secret).update(`unsubscribe:${id}`).digest('base64url')
}

/** `<uuid>.<base64url hmac>` */
export function createUnsubscribeToken(waitlistId: string): string {
  return `${waitlistId}${SEPARATOR}${signature(waitlistId, unsubscribeSecret())}`
}

/** Returns the waitlist row id, or null if the token is absent or forged. */
export function verifyUnsubscribeToken(token: string | null | undefined): string | null {
  if (!token) return null
  const index = token.lastIndexOf(SEPARATOR)
  if (index <= 0) return null

  const id = token.slice(0, index)
  const provided = token.slice(index + 1)
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) return null

  let expected: string
  try {
    expected = signature(id, unsubscribeSecret())
  } catch {
    return null
  }

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  // timingSafeEqual throws on length mismatch, so check length first. The
  // length of an HMAC digest is not secret, so this leaks nothing.
  if (a.length !== b.length) return null
  return timingSafeEqual(a, b) ? id : null
}

/** Human-facing confirmation page. GET is safe: it never unsubscribes. */
export function unsubscribePageUrl(waitlistId: string): string {
  return `${appUrl()}/unsubscribe?t=${encodeURIComponent(createUnsubscribeToken(waitlistId))}`
}

/** RFC 8058 one-click endpoint. POST only. */
export function unsubscribePostUrl(waitlistId: string): string {
  return `${appUrl()}/api/unsubscribe?t=${encodeURIComponent(createUnsubscribeToken(waitlistId))}`
}

/**
 * List-Unsubscribe + List-Unsubscribe-Post per RFC 2369 / RFC 8058.
 *
 * Gmail and Yahoo require these on bulk mail and reward them on
 * transactional mail: a recipient who uses the client's own unsubscribe
 * button never files a spam complaint, and complaints are what destroy a
 * new sending domain's reputation.
 */
export function unsubscribeHeaders(waitlistId: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${unsubscribePostUrl(waitlistId)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
  }
}
