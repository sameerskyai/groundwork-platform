/**
 * Email configuration, read from process.env and nowhere else.
 *
 * Hard rules enforced here:
 *   - The API key is read from process.env at call time, never at module
 *     scope, never cached in an exported value, never logged, never
 *     interpolated into an error message.
 *   - Nothing in this file has a secret default. A missing key produces a
 *     typed failure, not a silent no-op and not a fallback provider.
 */

import type { EmailProviderName } from './types'

/**
 * Names of the two secret variables. Read below as literal
 * `process.env.RESEND_API_KEY` member expressions, never `process.env[name]`:
 * Next.js only performs its build-time env inlining on the literal form, and
 * the computed form silently yields undefined in any bundled context.
 * These constants exist only so error messages can name the missing variable.
 */
const RESEND_KEY_VAR = 'RESEND_API_KEY'
const POSTMARK_KEY_VAR = 'POSTMARK_SERVER_TOKEN'

export interface EmailConfig {
  provider: EmailProviderName
  /** Never log, never store, never render. */
  apiKey: string
  /** RFC 5322 sender, e.g. `Laywork <hello@laywork.com>`. */
  from: string
  replyTo: string | null
  /**
   * CAN-SPAM 15 U.S.C. 7704(a)(5)(A)(iii) requires a valid physical postal
   * address in every commercial message. Unset means we render a visibly
   * marked placeholder rather than quietly omitting a legal requirement.
   */
  postalAddress: string | null
  /** Absolute origin for referral and unsubscribe links. No trailing slash. */
  appUrl: string
}

export class EmailConfigError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'EmailConfigError'
    this.code = code
  }
}

export const DEFAULT_FROM = 'Laywork <onboarding@resend.dev>'

/**
 * FOUNDER ACTION marker rendered into the footer when EMAIL_POSTAL_ADDRESS
 * is unset. Deliberately ugly and deliberately shipped: an email that
 * silently drops the legally required address looks fine and is not
 * compliant, which is the worse failure.
 */
export const POSTAL_ADDRESS_PLACEHOLDER =
  '[FOUNDER ACTION REQUIRED: set EMAIL_POSTAL_ADDRESS to a valid physical mailing address before public launch]'

export function appUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

/**
 * Resolve the active provider from whichever key is present.
 *
 * If both keys are set, EMAIL_PROVIDER decides; without it we prefer Resend
 * (the documented default, see DECISIONS.md 2026-07-27) rather than picking
 * arbitrarily based on env iteration order.
 */
export function resolveEmailConfig(): EmailConfig {
  const resendKey = process.env.RESEND_API_KEY
  const postmarkKey = process.env.POSTMARK_SERVER_TOKEN
  const forced = process.env.EMAIL_PROVIDER as EmailProviderName | undefined

  let provider: EmailProviderName
  let apiKey: string | undefined

  if (forced === 'postmark' || (!forced && !resendKey && postmarkKey)) {
    provider = 'postmark'
    apiKey = postmarkKey
  } else if (forced === 'resend' || (!forced && resendKey)) {
    provider = 'resend'
    apiKey = resendKey
  } else if (forced) {
    throw new EmailConfigError(
      'unknown_provider',
      `EMAIL_PROVIDER is "${forced}"; expected "resend" or "postmark".`
    )
  } else {
    throw new EmailConfigError(
      'missing_api_key',
      `No email provider key found. Set ${RESEND_KEY_VAR} (or ${POSTMARK_KEY_VAR}) in the environment.`
    )
  }

  if (!apiKey) {
    const varName = provider === 'resend' ? RESEND_KEY_VAR : POSTMARK_KEY_VAR
    throw new EmailConfigError(
      'missing_api_key',
      `EMAIL_PROVIDER is "${provider}" but ${varName} is not set.`
    )
  }

  return {
    provider,
    apiKey,
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    replyTo: process.env.EMAIL_REPLY_TO || null,
    postalAddress: process.env.EMAIL_POSTAL_ADDRESS || null,
    appUrl: appUrl()
  }
}

/**
 * HMAC key for unsubscribe tokens.
 *
 * Falls back to the service-role key so unsubscribe links work the moment
 * email is switched on, but that coupling has a real cost: rotating the
 * Supabase service-role key silently invalidates every unsubscribe link
 * already sitting in someone's inbox, which is a CAN-SPAM problem, not just
 * an inconvenience. Set EMAIL_UNSUBSCRIBE_SECRET explicitly in production.
 */
export function unsubscribeSecret(): string {
  const secret =
    process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new EmailConfigError(
      'missing_unsubscribe_secret',
      'Set EMAIL_UNSUBSCRIBE_SECRET (or SUPABASE_SERVICE_ROLE_KEY) so unsubscribe tokens can be signed.'
    )
  }
  return secret
}
