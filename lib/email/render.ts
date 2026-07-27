/**
 * DRAWING SET rendering primitives for email.
 *
 * Constraints this file exists to satisfy:
 *   - Gmail strips <style> and <head>, so every rule is an inline attribute.
 *   - Outlook (Word rendering engine) ignores flex, grid, float, and most
 *     margin. Structure is tables. Not nostalgia: correctness.
 *   - Outlook also ignores CSS `border` on divs inconsistently, so hairlines
 *     are table cell borders on zero-height cells.
 *
 * The design language is unchanged from the site: white paper, ink type, one
 * accent, hairline rules, mono annotation labels, registration marks,
 * dimension lines under numbers that carry argument.
 */

import {
  EMAIL_COLOR as C,
  EMAIL_FONT_DISPLAY,
  EMAIL_FONT_MONO,
  EMAIL_LEADING_BODY,
  EMAIL_LEADING_DISPLAY,
  EMAIL_TRACKING_MONO,
  EMAIL_WIDTH
} from './tokens'

/** Escape for HTML text nodes and double-quoted attribute values. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const TABLE_OPEN = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%">`
const SPACER_CELL = `<td style="font-size:0;line-height:0">&nbsp;</td>`

/** Mono annotation. Labels a thing; it is never the thing itself. */
export function monoLabel(text: string, color: string = C.muted): string {
  return `<div style="font-family:${EMAIL_FONT_MONO};font-size:11px;line-height:1.4;letter-spacing:${EMAIL_TRACKING_MONO};text-transform:uppercase;color:${color}">${esc(text)}</div>`
}

/** `01 / YOUR POSITION`. Tells the reader where they are in the set. */
export function sheetNumber(number: string, title: string): string {
  return monoLabel(`${number} / ${title}`)
}

/** 1px hairline in --color-line. A primary element, not a last resort. */
export function hairline(color: string = C.line): string {
  return `${TABLE_OPEN}<tr><td height="1" style="height:1px;font-size:0;line-height:0;border-top:1px solid ${color}">&nbsp;</td></tr></table>`
}

export function spacer(height: number): string {
  return `<div style="line-height:${height}px;height:${height}px;font-size:0">&nbsp;</div>`
}

export function heading(text: string): string {
  return `<div style="font-family:${EMAIL_FONT_DISPLAY};font-size:32px;line-height:${EMAIL_LEADING_DISPLAY};letter-spacing:-0.02em;color:${C.ink};font-weight:600;margin:0">${esc(text)}</div>`
}

export function paragraph(text: string, color: string = C.ink2): string {
  return `<div style="font-family:${EMAIL_FONT_DISPLAY};font-size:15px;line-height:${EMAIL_LEADING_BODY};color:${color};margin:0">${esc(text)}</div>`
}

/**
 * A number that carries argument: display size, tabular, accent.
 * `font-variant-numeric` is ignored by most clients, so `font-feature-settings`
 * is set alongside it. Where neither lands the digits are still legible.
 */
export function bigNumber(value: string): string {
  return `<div style="font-family:${EMAIL_FONT_DISPLAY};font-size:56px;line-height:${EMAIL_LEADING_DISPLAY};letter-spacing:-0.03em;color:${C.accent};font-weight:600;font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1;margin:0">${esc(value)}</div>`
}

/**
 * Dimension line: a thin rule with end ticks and a mono unit label beneath.
 * If a number matters, it gets measured.
 */
export function dimensionLine(label: string, width = 240): string {
  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:${width}px">`,
    `<tr>`,
    `<td width="1" height="9" style="width:1px;height:9px;font-size:0;line-height:0;border-left:1px solid ${C.lineStrong}">&nbsp;</td>`,
    `<td height="9" style="height:9px;font-size:0;line-height:0;border-bottom:1px solid ${C.lineStrong}">&nbsp;</td>`,
    `<td width="1" height="9" style="width:1px;height:9px;font-size:0;line-height:0;border-right:1px solid ${C.lineStrong}">&nbsp;</td>`,
    `</tr>`,
    `</table>`,
    spacer(8),
    monoLabel(label)
  ].join('')
}

/**
 * Registration marks: L-shaped 10px corner ticks in --color-line-strong.
 * The cheapest and most legible signal that the page was drawn rather than
 * assembled, and the one detail that carries the aesthetic into the inbox.
 */
export function registrationFrame(inner: string, padding = 24): string {
  const leg = `width="10" height="10" style="width:10px;height:10px;font-size:0;line-height:0"`
  const s = `1px solid ${C.lineStrong}`
  return [
    TABLE_OPEN,
    `<tr>`,
    `<td ${leg.replace('line-height:0', `line-height:0;border-top:${s};border-left:${s}`)}>&nbsp;</td>`,
    SPACER_CELL,
    `<td ${leg.replace('line-height:0', `line-height:0;border-top:${s};border-right:${s}`)}>&nbsp;</td>`,
    `</tr>`,
    `<tr>`,
    SPACER_CELL,
    `<td style="padding:${padding}px">${inner}</td>`,
    SPACER_CELL,
    `</tr>`,
    `<tr>`,
    `<td ${leg.replace('line-height:0', `line-height:0;border-bottom:${s};border-left:${s}`)}>&nbsp;</td>`,
    SPACER_CELL,
    `<td ${leg.replace('line-height:0', `line-height:0;border-bottom:${s};border-right:${s}`)}>&nbsp;</td>`,
    `</tr>`,
    `</table>`
  ].join('')
}

/**
 * The one accent-filled element in the message. Two compete and both lose,
 * so there is exactly one call site per template.
 * `<a>` styled as a block, not a <button>: buttons do not work in email.
 */
export function accentButton(label: string, href: string): string {
  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">`,
    `<tr><td style="background-color:${C.accent};border-radius:2px">`,
    `<a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${EMAIL_FONT_DISPLAY};font-size:15px;font-weight:600;line-height:1;color:${C.base};text-decoration:none">${esc(label)}</a>`,
    `</td></tr></table>`
  ].join('')
}

/** Filled --color-base-alt panel holding a long value the reader will copy. */
export function copyBox(value: string): string {
  return `<div style="background-color:${C.baseAlt};border-radius:2px;padding:16px;font-family:${EMAIL_FONT_MONO};font-size:13px;line-height:1.5;color:${C.ink};word-break:break-all">${esc(value)}</div>`
}

export interface TierRow {
  count: string
  reward: string
  /** Reached rows sit in --color-verified. Never decorative. */
  reached?: boolean
}

/**
 * The referral tiers as a hairline-ruled technical table, not marketing
 * cards. Counts are mono and tabular; rewards are prose.
 */
export function tierTable(rows: TierRow[]): string {
  const cells = rows
    .map((row, i) => {
      const top = i === 0 ? '' : `border-top:1px solid ${C.line};`
      const color = row.reached ? C.verified : C.ink2
      const countColor = row.reached ? C.verified : C.muted
      return [
        `<tr>`,
        `<td width="56" style="${top}width:56px;padding:12px 0;vertical-align:top;font-family:${EMAIL_FONT_MONO};font-size:13px;line-height:1.4;letter-spacing:${EMAIL_TRACKING_MONO};color:${countColor};font-variant-numeric:tabular-nums">${esc(row.count)}</td>`,
        `<td style="${top}padding:12px 0;vertical-align:top;font-family:${EMAIL_FONT_DISPLAY};font-size:14px;line-height:1.45;color:${color}">${esc(row.reward)}</td>`,
        `</tr>`
      ].join('')
    })
    .join('')
  return `${TABLE_OPEN}${cells}</table>`
}

export interface ShellOptions {
  /** Inbox preview text. Not visible in the body. */
  preheader: string
  body: string
  footer: string
}

/**
 * The sheet: 600px, white, centred, hairline-ruled masthead.
 *
 * The `dir="ltr"` and explicit background on both <body> and the wrapper
 * table are there because Outlook.com and Apple Mail dark mode will
 * otherwise invert the paper and leave the ink black on black.
 */
export function shell({ preheader, body, footer }: ShellOptions): string {
  const masthead = [
    `${TABLE_OPEN}<tr>`,
    `<td style="vertical-align:middle;font-family:${EMAIL_FONT_DISPLAY};font-size:15px;font-weight:700;letter-spacing:0.02em;color:${C.ink}">LAYWORK</td>`,
    `<td align="right" style="vertical-align:middle">${monoLabel('FOUNDING WAITLIST')}</td>`,
    `</tr></table>`
  ].join('')

  return [
    `<div dir="ltr" style="margin:0;padding:0;background-color:${C.baseAlt};color-scheme:light only;supported-color-schemes:light only">`,
    // Preheader: pulled by the client into the list preview, hidden in body.
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;visibility:hidden;mso-hide:all">${esc(preheader)}</div>`,
    `${TABLE_OPEN}<tr><td align="center" style="padding:32px 16px;background-color:${C.baseAlt}">`,
    `<table role="presentation" width="${EMAIL_WIDTH}" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;max-width:${EMAIL_WIDTH}px;background-color:${C.base}">`,
    `<tr><td style="padding:32px 32px 0 32px">${masthead}</td></tr>`,
    `<tr><td style="padding:16px 32px 0 32px">${hairline()}</td></tr>`,
    `<tr><td style="padding:32px">${body}</td></tr>`,
    `<tr><td style="padding:0 32px">${hairline()}</td></tr>`,
    `<tr><td style="padding:24px 32px 32px 32px">${footer}</td></tr>`,
    `</table>`,
    `</td></tr></table>`,
    `</div>`
  ].join('')
}

/**
 * CAN-SPAM footer. Four things, all required:
 *   1. honest identification of the sender,
 *   2. why this person is receiving the message,
 *   3. a valid physical postal address,
 *   4. a working, no-cost opt-out.
 */
export function canSpamFooter(opts: {
  postalAddress: string
  unsubscribeUrl: string
  siteUrl: string
}): string {
  const line = (text: string) =>
    `<div style="font-family:${EMAIL_FONT_MONO};font-size:11px;line-height:1.6;letter-spacing:0.06em;color:${C.muted}">${esc(text)}</div>`

  return [
    line('LAYWORK / NORTHERN VIRGINIA'),
    line(opts.postalAddress),
    spacer(12),
    `<div style="font-family:${EMAIL_FONT_DISPLAY};font-size:12px;line-height:1.55;color:${C.muted}">You are receiving this because you joined the Laywork founding waitlist at ${esc(opts.siteUrl)}. We will not sell or share your address.</div>`,
    spacer(12),
    `<a href="${esc(opts.unsubscribeUrl)}" style="font-family:${EMAIL_FONT_MONO};font-size:11px;letter-spacing:${EMAIL_TRACKING_MONO};text-transform:uppercase;color:${C.accent};text-decoration:underline">Unsubscribe</a>`
  ].join('')
}

/** Plain-text footer. Same four obligations, no markup. */
export function canSpamFooterText(opts: {
  postalAddress: string
  unsubscribeUrl: string
  siteUrl: string
}): string {
  return [
    'LAYWORK / NORTHERN VIRGINIA',
    opts.postalAddress,
    '',
    `You are receiving this because you joined the Laywork founding waitlist at ${opts.siteUrl}.`,
    'We will not sell or share your address.',
    '',
    `Unsubscribe: ${opts.unsubscribeUrl}`
  ].join('\n')
}

/** Plain-text horizontal rule, 60 columns. The text sheet has lines too. */
export const TEXT_RULE = '-'.repeat(60)
