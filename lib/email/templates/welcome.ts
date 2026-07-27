/**
 * Welcome email. Sent once, on signup.
 *
 * It has to do exactly three jobs, in this order, because that is the order
 * the reader cares about:
 *   1. confirm the position number they were just shown in the modal,
 *   2. hand them their referral link,
 *   3. tell them honestly what happens next and when to expect us again.
 *
 * Truthfulness constraint (DESIGN_SYSTEM.md section 03, FEATURE_INVENTORY.md):
 * four of the five mechanics are not built. Nothing here claims a live
 * capability. Rewards are described "at launch" or in plain future tense.
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
import { tierRowsFor, TIERS } from './tiers'
import type { RenderedEmail } from '../types'

export interface WelcomeEmailParams {
  name: string
  positionNumber: number
  referralLink: string
  /** True for the first 500 signups (waitlist.founding_500). */
  isFounding500: boolean
  unsubscribeUrl: string
  postalAddress: string
  siteUrl: string
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there'
}

export function renderWelcomeEmail(params: WelcomeEmailParams): RenderedEmail {
  const position = `#${params.positionNumber.toLocaleString('en-US')}`
  const subject = `You're ${position} on the Laywork waitlist`

  const foundingBlock = params.isFounding500
    ? [
        spacer(24),
        registrationFrame(
          [
            monoLabel('FOUNDING MEMBER / FIRST 500', C.verified),
            spacer(8),
            paragraph(
              'You are inside the first 500. Founding Members get access first, in waves.',
              C.ink2
            )
          ].join(''),
          20
        )
      ].join('')
    : ''

  const body = [
    sheetNumber('00', 'CONFIRMED'),
    spacer(16),
    heading(`You're on the list, ${firstName(params.name)}.`),
    spacer(16),
    paragraph(
      'Laywork is being built so nobody has to hire a contractor blind. Here is exactly where you stand.'
    ),

    spacer(40),
    hairline(),
    spacer(24),
    sheetNumber('01', 'YOUR POSITION'),
    spacer(16),
    registrationFrame(
      [
        // The one number in this message that carries argument.
        `<div style="font-family:'Inter Tight',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:56px;line-height:1.15;letter-spacing:-0.03em;color:${C.accent};font-weight:600;font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1">${esc(position)}</div>`,
        spacer(16),
        dimensionLine('POSITION / LAYWORK FOUNDING WAITLIST', 300)
      ].join('')
    ),
    foundingBlock,

    spacer(40),
    hairline(),
    spacer(24),
    sheetNumber('02', 'YOUR REFERRAL LINK'),
    spacer(16),
    paragraph(
      'Every neighbor who joins through this link moves you up roughly 100 spots. Verified signups only, so it counts when they actually finish.'
    ),
    spacer(16),
    copyBox(params.referralLink),
    spacer(24),
    // One accent-filled element per message. This is it.
    accentButton('Share your link', params.referralLink),

    spacer(40),
    hairline(),
    spacer(24),
    sheetNumber('03', 'WHAT REFERRALS UNLOCK'),
    spacer(16),
    tierTable(tierRowsFor(0)),

    spacer(40),
    hairline(),
    spacer(24),
    sheetNumber('04', 'WHAT HAPPENS NEXT'),
    spacer(16),
    paragraph(
      'We are opening in Northern Virginia first. Access goes out in waves, Founding Members first. You will hear from us when your wave opens, and when you hit a referral tier. Nothing else. We will not email you for the sake of it.'
    )
  ].join('')

  const html = shell({
    preheader: `You're ${position}. Your referral link is inside.`,
    body,
    footer: canSpamFooter({
      postalAddress: params.postalAddress,
      unsubscribeUrl: params.unsubscribeUrl,
      siteUrl: params.siteUrl
    })
  })

  const text = [
    'LAYWORK / FOUNDING WAITLIST',
    TEXT_RULE,
    '',
    `00 / CONFIRMED`,
    '',
    `You're on the list, ${firstName(params.name)}.`,
    '',
    'Laywork is being built so nobody has to hire a contractor blind.',
    'Here is exactly where you stand.',
    '',
    TEXT_RULE,
    '01 / YOUR POSITION',
    '',
    `    ${position}`,
    '    POSITION / LAYWORK FOUNDING WAITLIST',
    '',
    ...(params.isFounding500
      ? [
          'FOUNDING MEMBER / FIRST 500',
          'You are inside the first 500. Founding Members get access first, in waves.',
          ''
        ]
      : []),
    TEXT_RULE,
    '02 / YOUR REFERRAL LINK',
    '',
    params.referralLink,
    '',
    'Every neighbor who joins through this link moves you up roughly 100 spots.',
    'Verified signups only, so it counts when they actually finish.',
    '',
    TEXT_RULE,
    '03 / WHAT REFERRALS UNLOCK',
    '',
    `    03    ${TIERS[3].reward}`,
    `    05    ${TIERS[5].reward}`,
    `    10    ${TIERS[10].reward}`,
    '',
    TEXT_RULE,
    '04 / WHAT HAPPENS NEXT',
    '',
    'We are opening in Northern Virginia first. Access goes out in waves,',
    'Founding Members first. You will hear from us when your wave opens, and',
    'when you hit a referral tier. Nothing else. We will not email you for',
    'the sake of it.',
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
