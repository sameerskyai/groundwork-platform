/**
 * Email module tests. No network, no database, no provider key required.
 *
 * These check the things that are invisible until a real person is looking at
 * a broken email in their inbox: a missing text/plain part, a missing
 * unsubscribe link, an em-dash in copy the design system forbids, an
 * unsubscribe token that can be forged, or an API key leaking into an error
 * string that gets written to the database.
 */

import { describe, expect, it, beforeAll } from 'vitest'
import { renderWelcomeEmail } from '@/lib/email/templates/welcome'
import { renderMilestoneEmail } from '@/lib/email/templates/milestone'
import { MILESTONE_THRESHOLDS, isMilestone } from '@/lib/email/templates/tiers'
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  unsubscribeHeaders
} from '@/lib/email/unsubscribe'
import { send } from '@/lib/email'
import { POSTAL_ADDRESS_PLACEHOLDER } from '@/lib/email/config'

const ID = '11111111-2222-4333-8444-555555555555'

beforeAll(() => {
  process.env.EMAIL_UNSUBSCRIBE_SECRET =
    process.env.EMAIL_UNSUBSCRIBE_SECRET || 'test-secret-not-a-real-key'
  process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
})

const welcomeParams = {
  name: 'Dana Whitfield',
  positionNumber: 412,
  referralLink: 'http://localhost:3000/waitlist?ref=AB12CD',
  isFounding500: true,
  unsubscribeUrl: 'http://localhost:3000/unsubscribe?t=token',
  postalAddress: POSTAL_ADDRESS_PLACEHOLDER,
  siteUrl: 'http://localhost:3000'
}

describe('welcome email', () => {
  const rendered = renderWelcomeEmail(welcomeParams)

  it('confirms the exact position number in subject, html and text', () => {
    expect(rendered.subject).toContain('#412')
    expect(rendered.html).toContain('#412')
    expect(rendered.text).toContain('#412')
  })

  it('includes the referral link in both parts', () => {
    expect(rendered.html).toContain('ref=AB12CD')
    expect(rendered.text).toContain('ref=AB12CD')
  })

  it('has a non-empty plain-text alternative', () => {
    // A transactional email with no text/plain part is a spam signal and is
    // unreadable in text-only clients. This is not decoration.
    expect(rendered.text.trim().length).toBeGreaterThan(400)
  })

  it('is CAN-SPAM complete: identity, reason, postal address, opt-out', () => {
    for (const part of [rendered.html, rendered.text]) {
      expect(part).toContain('LAYWORK')
      expect(part).toMatch(/receiving this because you joined/i)
      expect(part).toContain(POSTAL_ADDRESS_PLACEHOLDER)
      expect(part).toContain('/unsubscribe?t=')
    }
  })

  it('carries no <style> block, because Gmail strips it', () => {
    expect(rendered.html).not.toMatch(/<style/i)
  })

  it('obeys the copy rules: no em-dashes, no banned words', () => {
    const banned = /\b(solutions?|seamless|leverage|revolutioniz\w*|empower\w*)\b/i
    expect(rendered.text).not.toContain('—')
    expect(rendered.text).not.toMatch(banned)
    expect(rendered.subject).not.toContain('—')
  })

  it('does not claim an unbuilt feature is live', () => {
    // FEATURE_INVENTORY.md marks Backstory NOT BUILT. It may only appear in
    // the future/at-launch register.
    const backstoryLines = rendered.text
      .split('\n')
      .filter(l => /backstory/i.test(l))
    expect(backstoryLines.length).toBeGreaterThan(0)
    for (const line of backstoryLines) {
      expect(line).toMatch(/at launch|will|coming/i)
    }
  })

  it('omits the founding block for position 501 and up', () => {
    const later = renderWelcomeEmail({
      ...welcomeParams,
      positionNumber: 900,
      isFounding500: false
    })
    expect(later.text).not.toContain('FIRST 500')
    expect(later.html).not.toContain('FIRST 500')
  })

  it('escapes HTML in the name rather than injecting it', () => {
    const hostile = renderWelcomeEmail({ ...welcomeParams, name: '<script>x</script>' })
    expect(hostile.html).not.toContain('<script>')
    expect(hostile.html).toContain('&lt;script&gt;')
  })
})

describe('milestone emails', () => {
  it.each(MILESTONE_THRESHOLDS)('renders tier %i with both parts', threshold => {
    const rendered = renderMilestoneEmail({
      name: 'Dana Whitfield',
      threshold,
      verifiedReferrals: threshold,
      positionNumber: 12,
      referralLink: 'http://localhost:3000/waitlist?ref=AB12CD',
      unsubscribeUrl: 'http://localhost:3000/unsubscribe?t=token',
      postalAddress: POSTAL_ADDRESS_PLACEHOLDER,
      siteUrl: 'http://localhost:3000'
    })
    expect(rendered.subject).toContain(`${threshold} referrals`)
    expect(rendered.text).toContain('[EARNED]')
    expect(rendered.text).toContain('/unsubscribe?t=')
    expect(rendered.html).toContain('/unsubscribe?t=')
    expect(rendered.text).not.toContain('—')
  })

  it('names the reward each tier actually grants', () => {
    const t3 = renderMilestoneEmail({
      name: 'D', threshold: 3, verifiedReferrals: 3, positionNumber: 1,
      referralLink: 'x', unsubscribeUrl: 'y', postalAddress: 'z', siteUrl: 'w'
    })
    const t10 = renderMilestoneEmail({
      name: 'D', threshold: 10, verifiedReferrals: 10, positionNumber: 1,
      referralLink: 'x', unsubscribeUrl: 'y', postalAddress: 'z', siteUrl: 'w'
    })
    expect(t3.text).toMatch(/Founding Member/i)
    expect(t10.text).toContain('$49')
  })

  it('only fires on 3, 5 and 10', () => {
    expect([1, 2, 4, 6, 9, 11, 100].some(isMilestone)).toBe(false)
    expect(MILESTONE_THRESHOLDS.every(isMilestone)).toBe(true)
  })
})

describe('unsubscribe tokens', () => {
  it('round-trips a valid token', () => {
    expect(verifyUnsubscribeToken(createUnsubscribeToken(ID))).toBe(ID)
  })

  it('rejects a forged signature', () => {
    const token = createUnsubscribeToken(ID)
    const forged = `${token.slice(0, -1)}${token.slice(-1) === 'A' ? 'B' : 'A'}`
    expect(verifyUnsubscribeToken(forged)).toBeNull()
  })

  it('rejects another row id signed for a different row', () => {
    const other = '99999999-2222-4333-8444-555555555555'
    const token = createUnsubscribeToken(ID)
    const swapped = `${other}.${token.split('.')[1]}`
    expect(verifyUnsubscribeToken(swapped)).toBeNull()
  })

  it('rejects empty, malformed and non-uuid tokens', () => {
    for (const bad of ['', null, undefined, 'nodot', '.', 'x.y', 'not-a-uuid.abc']) {
      expect(verifyUnsubscribeToken(bad as string)).toBeNull()
    }
  })

  it('never puts an email address in the link', () => {
    const headers = unsubscribeHeaders(ID)
    const link = headers['List-Unsubscribe']
    expect(link).toContain('/api/unsubscribe?t=')
    expect(link).not.toContain('@')
    expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
  })
})

describe('send() guard rails', () => {
  it('returns a typed failure instead of throwing when unconfigured', async () => {
    const saved = {
      resend: process.env.RESEND_API_KEY,
      postmark: process.env.POSTMARK_SERVER_TOKEN,
      provider: process.env.EMAIL_PROVIDER
    }
    delete process.env.RESEND_API_KEY
    delete process.env.POSTMARK_SERVER_TOKEN
    delete process.env.EMAIL_PROVIDER
    try {
      const result = await send({
        to: 'someone@example.com',
        subject: 's',
        html: '<p>h</p>',
        text: 't'
      })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('missing_api_key')
        expect(result.provider).toBe('none')
        // The failure message is stored in the DB. It must never carry a key.
        expect(result.message).not.toMatch(/re_|[A-Za-z0-9]{32,}/)
      }
    } finally {
      if (saved.resend) process.env.RESEND_API_KEY = saved.resend
      if (saved.postmark) process.env.POSTMARK_SERVER_TOKEN = saved.postmark
      if (saved.provider) process.env.EMAIL_PROVIDER = saved.provider
    }
  })

  it('refuses an invalid recipient before touching the network', async () => {
    const result = await send({ to: 'not-an-email', subject: 's', html: 'h', text: 't' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('invalid_recipient')
  })

  it('refuses a message with a missing text part', async () => {
    const result = await send({ to: 'a@b.co', subject: 's', html: '<p>h</p>', text: '  ' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('missing_body_part')
  })
})
