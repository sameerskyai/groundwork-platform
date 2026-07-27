/**
 * Live provider send. Skipped by default so `npm test` never spends quota or
 * mails a real person.
 *
 *   EMAIL_LIVE_TEST=1 EMAIL_TEST_TO=you@example.com \
 *     npx vitest run scripts/email-live-send.test.ts
 *
 * It renders through the SAME template functions the signup path uses, so a
 * pass here means the real welcome email reached the provider, not a
 * simplified stand-in. It prints the provider's actual response (message id
 * on success, error name and message on failure) and never prints the API key.
 *
 * Re-run this after verifying the sending domain in the Resend dashboard.
 */

import { describe, expect, it } from 'vitest'
import { send, resolveEmailConfig } from '@/lib/email'
import { renderWelcomeEmail } from '@/lib/email/templates/welcome'
import { renderMilestoneEmail } from '@/lib/email/templates/milestone'
import { unsubscribeHeaders, unsubscribePageUrl } from '@/lib/email/unsubscribe'
import { POSTAL_ADDRESS_PLACEHOLDER } from '@/lib/email/config'

const LIVE = process.env.EMAIL_LIVE_TEST === '1'
const TO = process.env.EMAIL_TEST_TO || 'ryan.baz+laywork-email-test@outlook.com'

// A stable fake waitlist id: this test must not write to the waitlist table.
const FAKE_ID = '00000000-0000-4000-8000-00000000dead'

describe.skipIf(!LIVE)('live provider send', () => {
  it('sends the real welcome email and reports the provider response', async () => {
    const config = resolveEmailConfig()
    // Provider and sender only. The key is never read into a log line.
    console.log(
      `[live] provider=${config.provider} from=${config.from} to=${TO} appUrl=${config.appUrl}`
    )

    const rendered = renderWelcomeEmail({
      name: 'Ryan Baz',
      positionNumber: 127,
      referralLink: `${config.appUrl}/waitlist?ref=TEST01`,
      isFounding500: true,
      unsubscribeUrl: unsubscribePageUrl(FAKE_ID),
      postalAddress: config.postalAddress || POSTAL_ADDRESS_PLACEHOLDER,
      siteUrl: config.appUrl
    })

    const result = await send({
      to: TO,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tag: 'welcome',
      headers: unsubscribeHeaders(FAKE_ID)
    })

    console.log('[live] welcome result:', JSON.stringify(result, null, 2))
    expect(result.ok, JSON.stringify(result)).toBe(true)
  }, 30_000)

  it('sends the tier 10 milestone email', async () => {
    const config = resolveEmailConfig()
    const rendered = renderMilestoneEmail({
      name: 'Ryan Baz',
      threshold: 10,
      verifiedReferrals: 10,
      positionNumber: 27,
      referralLink: `${config.appUrl}/waitlist?ref=TEST01`,
      unsubscribeUrl: unsubscribePageUrl(FAKE_ID),
      postalAddress: config.postalAddress || POSTAL_ADDRESS_PLACEHOLDER,
      siteUrl: config.appUrl
    })

    const result = await send({
      to: TO,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tag: 'milestone_10',
      headers: unsubscribeHeaders(FAKE_ID)
    })

    console.log('[live] milestone_10 result:', JSON.stringify(result, null, 2))
    expect(result.ok, JSON.stringify(result)).toBe(true)
  }, 30_000)
})

describe.skipIf(LIVE)('live provider send (skipped)', () => {
  it('is skipped without EMAIL_LIVE_TEST=1', () => {
    expect(LIVE).toBe(false)
  })
})
