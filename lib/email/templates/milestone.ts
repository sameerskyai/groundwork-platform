/**
 * Referral milestone emails, at 3 / 5 / 10 verified referrals.
 *
 * Sent from the signup path when credit_referral() reports the referrer's
 * new count landing exactly on a threshold. One email per tier per person,
 * enforced by a partial unique index on email_events (migration 040), not by
 * hoping the count only crosses a threshold once.
 *
 * A verified referral means the referred person completed signup. There is
 * no separate confirmation step in this product, so the signup succeeding IS
 * the verification (see the comment in app/api/waitlist/route.ts).
 */

import { EMAIL_COLOR as C } from '../tokens'
import {
  accentButton,
  canSpamFooter,
  canSpamFooterText,
  copyBox,
  dimensionLine,
  esc,
  hairline,
  heading,
  monoLabel,
  paragraph,
  registrationFrame,
  sheetNumber,
  shell,
  spacer,
  tierTable,
  TEXT_RULE
} from '../render'
import { tierRowsFor, TIERS, type MilestoneThreshold } from './tiers'
import type { RenderedEmail } from '../types'

export interface MilestoneEmailParams {
  name: string
  threshold: MilestoneThreshold
  /** Actual verified count. Equals threshold in normal operation. */
  verifiedReferrals: number
  positionNumber: number
  referralLink: string
  unsubscribeUrl: string
  postalAddress: string
  siteUrl: string
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there'
}

/** What is still ahead, phrased without pressure. Null at the top tier. */
function nextTierLine(threshold: MilestoneThreshold): string | null {
  if (threshold === 3) return `Two more and your Home Backstory report is free at launch.`
  if (threshold === 5) return `Five more and Laywork+ locks at $49 a year for life.`
  return null
}

export function renderMilestoneEmail(params: MilestoneEmailParams): RenderedEmail {
  const tier = TIERS[params.threshold]
  const count = String(params.verifiedReferrals)
  const subject = `${params.threshold} referrals. ${tier.headline}`
  const next = nextTierLine(params.threshold)

  const body = [
    sheetNumber('00', `TIER ${String(params.threshold).padStart(2, '0')} / EARNED`),
    spacer(16),
    heading(tier.headline),
    spacer(16),
    paragraph(
      `${firstName(params.name)}, ${count} ${params.verifiedReferrals === 1 ? 'neighbor has' : 'neighbors have'} joined Laywork through your link. That is the tier.`
    ),

    spacer(40),
    hairline(),
    spacer(24),
    sheetNumber('01', 'VERIFIED REFERRALS'),
    spacer(16),
    registrationFrame(
      [
        `<div style="font-family:'Inter Tight',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:56px;line-height:1.15;letter-spacing:-0.03em;color:${C.accent};font-weight:600;font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1">${esc(count)}</div>`,
        spacer(16),
        dimensionLine('VERIFIED REFERRALS / LAYWORK FOUNDING WAITLIST', 320),
        spacer(20),
        monoLabel('EARNED', C.verified),
        spacer(8),
        paragraph(tier.detail, C.ink2)
      ].join('')
    ),

    spacer(40),
    hairline(),
    spacer(24),
    sheetNumber('02', 'THE LADDER'),
    spacer(16),
    tierTable(tierRowsFor(params.verifiedReferrals)),
    ...(next ? [spacer(16), paragraph(next, C.ink2)] : []),

    spacer(40),
    hairline(),
    spacer(24),
    sheetNumber('03', 'YOUR POSITION AND LINK'),
    spacer(16),
    paragraph(
      `You are now #${params.positionNumber.toLocaleString('en-US')} on the founding waitlist. Same link as before.`
    ),
    spacer(16),
    copyBox(params.referralLink),
    spacer(24),
    accentButton('Share your link', params.referralLink)
  ].join('')

  const html = shell({
    preheader: `${count} verified referrals. ${tier.reward}.`,
    body,
    footer: canSpamFooter({
      postalAddress: params.postalAddress,
      unsubscribeUrl: params.unsubscribeUrl,
      siteUrl: params.siteUrl
    })
  })

  const rows = tierRowsFor(params.verifiedReferrals)
    .map(r => `    ${r.count}    ${r.reward}${r.reached ? '   [EARNED]' : ''}`)
    .join('\n')

  const text = [
    'LAYWORK / FOUNDING WAITLIST',
    TEXT_RULE,
    '',
    `00 / TIER ${String(params.threshold).padStart(2, '0')} / EARNED`,
    '',
    tier.headline,
    '',
    `${firstName(params.name)}, ${count} ${params.verifiedReferrals === 1 ? 'neighbor has' : 'neighbors have'} joined Laywork through your link.`,
    'That is the tier.',
    '',
    TEXT_RULE,
    '01 / VERIFIED REFERRALS',
    '',
    `    ${count}`,
    '    VERIFIED REFERRALS / LAYWORK FOUNDING WAITLIST',
    '',
    tier.detail,
    '',
    TEXT_RULE,
    '02 / THE LADDER',
    '',
    rows,
    ...(next ? ['', next] : []),
    '',
    TEXT_RULE,
    '03 / YOUR POSITION AND LINK',
    '',
    `You are now #${params.positionNumber.toLocaleString('en-US')} on the founding waitlist.`,
    'Same link as before.',
    '',
    params.referralLink,
    '',
    TEXT_RULE,
    canSpamFooterText({
      postalAddress: params.postalAddress,
      unsubscribeUrl: params.unsubscribeUrl,
      siteUrl: params.siteUrl
    })
  ].join('\n')

  return { subject, html, text }
}
