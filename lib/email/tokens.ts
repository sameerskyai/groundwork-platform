/**
 * DRAWING SET tokens, mirrored as literals for email.
 *
 * Email clients strip <style> blocks and do not resolve CSS custom
 * properties, so `var(--color-ink)` is unusable here. This file is the ONE
 * permitted place outside `app/globals.css` where these hex values are
 * written out, for the same reason DESIGN_SYSTEM.md permits literals in
 * `next/og` images: the value cannot reach the CSS cascade.
 *
 * Every literal names its source token. If `app/globals.css` changes, this
 * file changes in the same commit. Nothing here may drift and nothing new
 * may be added: eleven values, never a twelfth.
 *
 * (scripts/standards-check.mjs check 1 TOKENS walks app/ and components/
 * only, so this file is outside its scan by design, not by evasion.)
 */

export const EMAIL_COLOR = {
  /** token: --color-base */
  base: '#FFFFFF',
  /** token: --color-base-alt */
  baseAlt: '#F7F8FA',
  /** token: --color-ink */
  ink: '#0A0A0A',
  /** token: --color-ink-2 */
  ink2: '#3D4450',
  /** token: --color-muted */
  muted: '#686F7C',
  /** token: --color-accent */
  accent: '#1A5490',
  /** token: --color-accent-wash */
  accentWash: '#EDF3F9',
  /** token: --color-line */
  line: '#DDE3EA',
  /** token: --color-line-strong */
  lineStrong: '#B4BEC9',
  /** token: --color-verified */
  verified: '#1E7A4D',
  /** token: --color-alert */
  alert: '#B03A2E'
} as const

/**
 * token: --font-display, with Helvetica/Arial appended. Outlook has neither
 * Inter Tight nor a system grotesque; without an explicit web-safe tail it
 * falls back to Times, which is not a grotesque and reads as a mistake.
 */
export const EMAIL_FONT_DISPLAY =
  "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

/**
 * token: --font-mono, with 'Courier New' appended for the same reason.
 * Annotation is the signature of this system; it must survive Outlook.
 */
export const EMAIL_FONT_MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Courier New', monospace"

/** token: --tracking-mono */
export const EMAIL_TRACKING_MONO = '0.12em'

/** token: --leading-body */
export const EMAIL_LEADING_BODY = '1.55'

/** token: --leading-display */
export const EMAIL_LEADING_DISPLAY = '1.15'

/** 8px base unit. Email widths are px because em/rem are unreliable in Outlook. */
export const EMAIL_WIDTH = 600
