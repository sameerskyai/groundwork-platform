/**
 * Delivery: render, send, and record the outcome against the waitlist row.
 *
 * The reason this file exists separately from index.ts is the recording. A
 * send that fails must be visible in the database, not just in a log line
 * nobody reads. `waitlist.welcome_email_status` and the `email_events` table
 * (migration 040) are what make "we told 4,000 people to check their email"
 * a checkable claim instead of an assumption.
 *
 * Every function here is best-effort and never throws: the caller is the
 * signup path, and a signup must never fail because email did.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveEmailConfig, POSTAL_ADDRESS_PLACEHOLDER } from './config'
import { send } from './index'
import { renderWelcomeEmail } from './templates/welcome'
import { renderMilestoneEmail } from './templates/milestone'
import type { MilestoneThreshold } from './templates/tiers'
import { unsubscribeHeaders, unsubscribePageUrl } from './unsubscribe'
import type { EmailKind, SendResult } from './types'

/** The waitlist columns every template needs. Kept narrow on purpose. */
export interface WaitlistRecipient {
  id: string
  name: string
  email: string
  position_number: number
  referral_code: string
  founding_500?: boolean | null
  verified_referral_count?: number | null
}

/** Anything the recipient could have set that means "stop emailing me". */
function isUnsubscribed(row: { email_unsubscribed_at?: string | null }): boolean {
  return Boolean(row.email_unsubscribed_at)
}

function siteUrl(): string {
  try {
    return resolveEmailConfig().appUrl
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }
}

function postalAddress(): string {
  try {
    return resolveEmailConfig().postalAddress || POSTAL_ADDRESS_PLACEHOLDER
  } catch {
    return process.env.EMAIL_POSTAL_ADDRESS || POSTAL_ADDRESS_PLACEHOLDER
  }
}

function referralLink(code: string): string {
  return `${siteUrl()}/waitlist?ref=${encodeURIComponent(code)}`
}

/**
 * Append to email_events. Best-effort: if migration 040 has not been applied
 * yet the insert fails with 42P01 and we log rather than break the send path.
 */
async function recordEvent(
  supabase: SupabaseClient,
  waitlistId: string,
  kind: EmailKind,
  result: SendResult
): Promise<void> {
  const { error } = await supabase.from('email_events').insert({
    waitlist_id: waitlistId,
    kind,
    status: result.status,
    provider: result.provider,
    provider_message_id: result.ok ? result.providerMessageId : null,
    error_code: result.ok ? null : result.code,
    error_message: result.ok ? null : result.message
  })
  if (error) {
    console.error(`[email] could not record ${kind} event:`, error.message)
  }
}

/**
 * Welcome email.
 *
 * Called from app/api/waitlist/route.ts after the insert succeeds. The row is
 * already committed at this point, so the worst case is a signup with
 * `welcome_email_status = 'failed'` and a reason attached, which is exactly
 * the visibility we want.
 */
export async function deliverWelcomeEmail(
  supabase: SupabaseClient,
  recipient: WaitlistRecipient
): Promise<SendResult> {
  let result: SendResult

  try {
    const rendered = renderWelcomeEmail({
      name: recipient.name,
      positionNumber: recipient.position_number,
      referralLink: referralLink(recipient.referral_code),
      isFounding500: Boolean(recipient.founding_500),
      unsubscribeUrl: unsubscribePageUrl(recipient.id),
      postalAddress: postalAddress(),
      siteUrl: siteUrl()
    })

    result = await send({
      to: recipient.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tag: 'welcome',
      headers: unsubscribeHeaders(recipient.id)
    })
  } catch (err) {
    // Rendering or token signing blew up. Still record it.
    result = {
      ok: false,
      status: 'failed',
      provider: 'none',
      code: 'render_error',
      message: err instanceof Error ? err.message : 'Unknown render error',
      httpStatus: null
    }
  }

  if (!result.ok) {
    console.error(
      `[email] welcome send failed for waitlist ${recipient.id}: ${result.code} ${result.message}`
    )
  }

  const { error } = await supabase
    .from('waitlist')
    .update({
      welcome_email_status: result.status,
      welcome_email_sent_at: result.ok ? new Date().toISOString() : null,
      welcome_email_provider_id: result.ok ? result.providerMessageId : null,
      welcome_email_error: result.ok ? null : `${result.code}: ${result.message}`.slice(0, 500)
    })
    .eq('id', recipient.id)

  if (error) {
    console.error('[email] could not record welcome status:', error.message)
  }

  await recordEvent(supabase, recipient.id, 'welcome', result)
  return result
}

/**
 * Milestone email at 3 / 5 / 10 verified referrals.
 *
 * Idempotency is the partial unique index on email_events (migration 040):
 * a second successful send of the same kind to the same person cannot be
 * recorded, so we check for an existing 'sent' row BEFORE sending rather
 * than discovering the duplicate after the message has left.
 */
export async function deliverMilestoneEmail(
  supabase: SupabaseClient,
  referrerId: string,
  threshold: MilestoneThreshold
): Promise<SendResult> {
  const kind = `milestone_${threshold}` as EmailKind

  const { data: row, error: fetchError } = await supabase
    .from('waitlist')
    .select(
      'id, name, email, position_number, referral_code, verified_referral_count, email_unsubscribed_at'
    )
    .eq('id', referrerId)
    .single()

  if (fetchError || !row) {
    const result: SendResult = {
      ok: false,
      status: 'failed',
      provider: 'none',
      code: 'recipient_not_found',
      message: fetchError?.message || `No waitlist row ${referrerId}`,
      httpStatus: null
    }
    console.error(`[email] ${kind} send skipped: ${result.message}`)
    return result
  }

  if (isUnsubscribed(row)) {
    const result: SendResult = {
      ok: false,
      status: 'failed',
      provider: 'none',
      code: 'unsubscribed',
      message: 'Recipient has unsubscribed.',
      httpStatus: null
    }
    await recordEvent(supabase, referrerId, kind, result)
    return result
  }

  const { data: already } = await supabase
    .from('email_events')
    .select('id')
    .eq('waitlist_id', referrerId)
    .eq('kind', kind)
    .eq('status', 'sent')
    .maybeSingle()

  if (already) {
    return {
      ok: false,
      status: 'failed',
      provider: 'none',
      code: 'already_sent',
      message: `${kind} was already sent to this recipient.`,
      httpStatus: null
    }
  }

  let result: SendResult
  try {
    const rendered = renderMilestoneEmail({
      name: row.name,
      threshold,
      verifiedReferrals: row.verified_referral_count ?? threshold,
      positionNumber: row.position_number,
      referralLink: referralLink(row.referral_code),
      unsubscribeUrl: unsubscribePageUrl(row.id),
      postalAddress: postalAddress(),
      siteUrl: siteUrl()
    })

    result = await send({
      to: row.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tag: kind,
      headers: unsubscribeHeaders(row.id)
    })
  } catch (err) {
    result = {
      ok: false,
      status: 'failed',
      provider: 'none',
      code: 'render_error',
      message: err instanceof Error ? err.message : 'Unknown render error',
      httpStatus: null
    }
  }

  if (!result.ok) {
    console.error(`[email] ${kind} send failed for ${referrerId}: ${result.code} ${result.message}`)
  }

  await recordEvent(supabase, referrerId, kind, result)
  return result
}
