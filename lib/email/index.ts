/**
 * lib/email — the only place this codebase sends email from.
 *
 * Provider-agnostic on purpose: `send()` takes a rendered message and returns
 * a typed result. Swapping Resend for Postmark is an env change plus an
 * adapter, not a rewrite of every call site.
 *
 * Nothing in this module throws at a caller. Configuration problems, network
 * problems, and provider rejections all come back as `SendFailure`, because
 * the calling path is a signup request that must succeed whether or not the
 * email does.
 */

import { EmailConfigError, resolveEmailConfig } from './config'
import { providerFor } from './provider'
import type { EmailMessage, SendResult } from './types'

export * from './types'
export { resolveEmailConfig, appUrl, EmailConfigError } from './config'
export {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  unsubscribeHeaders,
  unsubscribePageUrl,
  unsubscribePostUrl
} from './unsubscribe'
export { renderWelcomeEmail } from './templates/welcome'
export { renderMilestoneEmail } from './templates/milestone'
export {
  TIERS,
  MILESTONE_THRESHOLDS,
  isMilestone,
  type MilestoneThreshold
} from './templates/tiers'

/** True when a provider key is configured. Never reveals the key itself. */
export function isEmailConfigured(): boolean {
  try {
    resolveEmailConfig()
    return true
  } catch {
    return false
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Send one message. Never throws.
 *
 * Both `html` and `text` are required by the type, and both are checked here
 * as well, because a missing text/plain part is the single most common cause
 * of transactional mail landing in spam and it is invisible until it happens.
 */
export async function send(message: EmailMessage): Promise<SendResult> {
  if (!EMAIL_RE.test(message.to || '')) {
    return {
      ok: false,
      status: 'failed',
      provider: 'none',
      code: 'invalid_recipient',
      message: 'Recipient is not a valid email address.',
      httpStatus: null
    }
  }
  if (!message.html?.trim() || !message.text?.trim()) {
    return {
      ok: false,
      status: 'failed',
      provider: 'none',
      code: 'missing_body_part',
      message: 'Both html and text bodies are required.',
      httpStatus: null
    }
  }

  let config
  try {
    config = resolveEmailConfig()
  } catch (err) {
    const e = err as EmailConfigError
    return {
      ok: false,
      status: 'failed',
      provider: 'none',
      code: e.code || 'config_error',
      message: e.message || 'Email is not configured.',
      httpStatus: null
    }
  }

  try {
    return await providerFor(config).send(message)
  } catch (err) {
    // Adapters are written not to throw; this is the belt to that braces.
    return {
      ok: false,
      status: 'failed',
      provider: config.provider,
      code: 'unexpected_error',
      message: err instanceof Error ? err.message : 'Unexpected send error',
      httpStatus: null
    }
  }
}
