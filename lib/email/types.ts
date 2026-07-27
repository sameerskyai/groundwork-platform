/**
 * Typed results for the email module.
 *
 * The whole point of these types is that a caller cannot mistake "we tried"
 * for "it arrived". `send()` never throws and never returns void: it returns
 * a discriminated union that forces the caller to look at `ok`, and carries
 * enough detail (provider code, HTTP status, message) to store the failure
 * rather than log it into the void.
 */

export type EmailProviderName = 'resend' | 'postmark'

/** Every distinct email this module can send. Doubles as `email_events.kind`. */
export type EmailKind =
  | 'welcome'
  | 'milestone_3'
  | 'milestone_5'
  | 'milestone_10'

/** Mirrors the CHECK constraint in supabase/migrations/040_email_delivery.sql. */
export type EmailDeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped'

export interface EmailMessage {
  to: string
  subject: string
  /** Full HTML body. Inline CSS only: Gmail and Outlook strip <style>. */
  html: string
  /**
   * Plain-text alternative. REQUIRED, not optional — a transactional email
   * with no text/plain part is a spam signal and is unreadable in text-only
   * clients. The type makes it impossible to forget.
   */
  text: string
  /** Extra RFC headers, e.g. List-Unsubscribe. */
  headers?: Record<string, string>
  /** Provider-side categorisation. Resend `tags`, Postmark `Tag`. */
  tag?: string
}

export interface SendSuccess {
  ok: true
  status: 'sent'
  provider: EmailProviderName
  /** Resend `id`, Postmark `MessageID`. Stored so a bounce can be traced. */
  providerMessageId: string
}

export interface SendFailure {
  ok: false
  status: 'failed'
  /** 'none' when we never reached a provider (missing config, bad input). */
  provider: EmailProviderName | 'none'
  /** Provider error name where available, otherwise one of ours. */
  code: string
  /** Human-readable. Safe to store; never contains the API key. */
  message: string
  httpStatus: number | null
}

export type SendResult = SendSuccess | SendFailure

export interface EmailProvider {
  readonly name: EmailProviderName
  send(message: EmailMessage): Promise<SendResult>
}

/** A rendered template: both parts, produced together, never separately. */
export interface RenderedEmail {
  subject: string
  html: string
  text: string
}
