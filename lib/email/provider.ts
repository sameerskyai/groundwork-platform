/**
 * Provider adapters. Raw fetch against the documented HTTP APIs, no SDK.
 *
 * Why no SDK: `resend` and `postmark` are both thin wrappers over one POST.
 * Adding a dependency to save twenty lines buys a supply-chain surface, a
 * lockfile churn, and a version to keep current, for a module that sends two
 * kinds of email. Documented in DECISIONS.md 2026-07-27.
 *
 * API shapes verified against the live docs on 2026-07-27:
 *   Resend   https://resend.com/docs/api-reference/emails/send-email
 *            https://resend.com/docs/api-reference/errors
 *   Postmark https://postmarkapp.com/developer/api/email-api
 *
 * An adapter NEVER throws and NEVER puts the API key in a return value.
 */

import type {
  EmailConfig
} from './config'
import type {
  EmailMessage,
  EmailProvider,
  SendFailure,
  SendResult
} from './types'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const POSTMARK_ENDPOINT = 'https://api.postmarkapp.com/email'

/** 15s. A slow provider must not hold a signup request open. */
const TIMEOUT_MS = 15_000

function failure(
  provider: SendFailure['provider'],
  code: string,
  message: string,
  httpStatus: number | null = null
): SendFailure {
  return { ok: false, status: 'failed', provider, code, message, httpStatus }
}

/** Truncated so a provider HTML error page cannot blow up a DB column. */
function clip(value: unknown, max = 500): string {
  const s = typeof value === 'string' ? value : JSON.stringify(value)
  return s && s.length > max ? `${s.slice(0, max)}...` : s || ''
}

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown
): Promise<{ status: number; json: unknown; raw: string } | { networkError: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    const raw = await res.text()
    let json: unknown = null
    try {
      json = raw ? JSON.parse(raw) : null
    } catch {
      json = null
    }
    return { status: res.status, json, raw }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? `Request timed out after ${TIMEOUT_MS}ms`
          : err.message
        : 'Unknown network error'
    return { networkError: message }
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------- Resend

interface ResendOk {
  id?: string
}
interface ResendErr {
  name?: string
  message?: string
  statusCode?: number
  error?: string
}

export function resendProvider(config: EmailConfig): EmailProvider {
  return {
    name: 'resend',
    async send(message: EmailMessage): Promise<SendResult> {
      const payload: Record<string, unknown> = {
        from: config.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text
      }
      if (config.replyTo) payload.reply_to = config.replyTo
      if (message.headers) payload.headers = message.headers
      if (message.tag) payload.tags = [{ name: 'kind', value: message.tag }]

      const result = await postJson(
        RESEND_ENDPOINT,
        { Authorization: `Bearer ${config.apiKey}` },
        payload
      )

      if ('networkError' in result) {
        return failure('resend', 'network_error', result.networkError)
      }

      if (result.status >= 200 && result.status < 300) {
        const id = (result.json as ResendOk | null)?.id
        if (!id) {
          return failure(
            'resend',
            'missing_message_id',
            `Resend returned ${result.status} with no id: ${clip(result.raw)}`,
            result.status
          )
        }
        return { ok: true, status: 'sent', provider: 'resend', providerMessageId: id }
      }

      const err = (result.json as ResendErr | null) ?? {}
      return failure(
        'resend',
        err.name || err.error || `http_${result.status}`,
        err.message || clip(result.raw) || `Resend returned ${result.status}`,
        result.status
      )
    }
  }
}

// -------------------------------------------------------------- Postmark

interface PostmarkResponse {
  MessageID?: string
  ErrorCode?: number
  Message?: string
  SubmittedAt?: string
}

export function postmarkProvider(config: EmailConfig): EmailProvider {
  return {
    name: 'postmark',
    async send(message: EmailMessage): Promise<SendResult> {
      const payload: Record<string, unknown> = {
        From: config.from,
        To: message.to,
        Subject: message.subject,
        HtmlBody: message.html,
        TextBody: message.text,
        MessageStream: process.env.POSTMARK_MESSAGE_STREAM || 'outbound'
      }
      if (config.replyTo) payload.ReplyTo = config.replyTo
      if (message.tag) payload.Tag = message.tag
      if (message.headers) {
        payload.Headers = Object.entries(message.headers).map(([Name, Value]) => ({
          Name,
          Value
        }))
      }

      const result = await postJson(
        POSTMARK_ENDPOINT,
        { Accept: 'application/json', 'X-Postmark-Server-Token': config.apiKey },
        payload
      )

      if ('networkError' in result) {
        return failure('postmark', 'network_error', result.networkError)
      }

      const body = (result.json as PostmarkResponse | null) ?? {}

      // Postmark can return HTTP 200 with a non-zero ErrorCode. Treating 2xx
      // as success would record a delivery that never happened.
      if (result.status >= 200 && result.status < 300 && body.ErrorCode === 0) {
        if (!body.MessageID) {
          return failure(
            'postmark',
            'missing_message_id',
            `Postmark returned OK with no MessageID: ${clip(result.raw)}`,
            result.status
          )
        }
        return {
          ok: true,
          status: 'sent',
          provider: 'postmark',
          providerMessageId: body.MessageID
        }
      }

      return failure(
        'postmark',
        body.ErrorCode != null ? `postmark_${body.ErrorCode}` : `http_${result.status}`,
        body.Message || clip(result.raw) || `Postmark returned ${result.status}`,
        result.status
      )
    }
  }
}

export function providerFor(config: EmailConfig): EmailProvider {
  return config.provider === 'postmark'
    ? postmarkProvider(config)
    : resendProvider(config)
}
