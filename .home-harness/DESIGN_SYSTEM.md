# Laywork Design System — DRAWING SET

**Status**: ACTIVE (2026-07-27, founder directive). Supersedes the Blue/White/Black token set of 2026-07-24, which superseded Blueprint Blue (07-22), which superseded Warm Copper (07-14). Prior entries are kept in DECISIONS.md as history.

**Authority**: this file governs every visual decision. Where it conflicts with a component, the component is wrong. Where the founder's brief conflicts with this file, the brief wins and this file gets updated in the same session.

---

## THESIS

Laywork means the work underneath.

Every competitor tries to look friendly, which is exactly why homeowners don't trust them. Friendly is what you look like when you have nothing to show. We look **exact**.

The site reads like an architect's drawing set: visible grid, registration marks, dimension lines, technical annotation, precise numbers. Warmth comes from clarity, not from soft edges. A homeowner about to spend forty thousand dollars does not want a mascot. They want a number they can check.

This is a document, not a landing page.

---

## TOKENS

All eleven live in `app/globals.css` as CSS custom properties. **Zero hardcoded values, anywhere, ever.** The only permitted exception is `next/og` image generation (`app/icon.tsx`, `app/opengraph-image.tsx`), which runs outside the CSS cascade and cannot read variables — every literal there carries a `/* token: --color-x */` comment naming its source.

| Token | Value | Role |
|---|---|---|
| `--color-base` | `#FFFFFF` | Primary surface. The paper. |
| `--color-base-alt` | `#F7F8FA` | Alternating sections, filled inputs. |
| `--color-ink` | `#0A0A0A` | Headlines, body, the numbers that carry argument. |
| `--color-ink-2` | `#3D4450` | Secondary prose. Subheads, card body. |
| `--color-muted` | `#7A828F` | Mono annotation, metadata, captions. |
| `--color-accent` | `#1A5490` | Action. CTAs, active states, numeric anchors. |
| `--color-accent-wash` | `#EDF3F9` | Focus rings, the faintest accent fill. |
| `--color-line` | `#DDE3EA` | Hairlines, dividers, the grid. |
| `--color-line-strong` | `#B4BEC9` | Registration marks, dimension-line ticks. |
| `--color-verified` | `#1E7A4D` | Verification states only. Never decorative. |
| `--color-alert` | `#B03A2E` | Genuine errors only. **Never in the hero.** |

**Eleven values, never a twelfth.** Interaction shades derive via `color-mix()` from these only — no new hex enters the system to make a hover state.

**One accent-filled element per viewport.** Two compete and both lose. Everything else accent-coloured is a hairline, a numeral, or a link.

### Contrast (WCAG 2.1 AA, computed — see the table in `app/styles/design-tokens.css`)

Every pair is verified with the real relative-luminance formula before shipping, not eyeballed. The recurring hazard: **`--color-accent` on `--color-ink` fails** (2.56:1). Accent never appears as text or icon on a dark surface; use a lightened derivation there.

---

## TYPE

Two families. No third.

**DISPLAY / UI** — a tight, precise grotesque (Inter Tight, or the nearest available system grotesque). Slightly negative tracking at large sizes: `-0.02em` at 2.25rem and above, `-0.03em` at 3.5rem and above.

**ANNOTATION** — monospace. **This is the signature.** Every label, eyebrow, section number, unit, caption, and metadata line is mono, uppercase, 11–12px, `letter-spacing: 0.12em`, in `--color-muted`. It is what makes the page read as a technical document rather than a landing page. If you are unsure whether something is annotation, ask whether it labels a thing or *is* the thing. Labels are mono.

**All numerals tabular, always** (`font-variant-numeric: tabular-nums`). Numbers never shift width when they change — a counter that jitters is a counter nobody trusts.

**Scale (rem)**: `0.6875` · `0.8125` · `0.9375` · `1.125` · `1.5` · `2.25` · `3.5` · `5.5`

**Line height**: `1.15` display · `1.55` body.

---

## SPACE

8px base unit. Every margin, padding, and gap is a multiple of 8. No 5px, no 13px, no "looks about right."

Section rhythm: **120px desktop, 72px mobile.**

---

## GEOMETRY

- Radius: **2px** inputs and buttons · **4px** cards · **8px** modal only. Nothing rounder than 8px.
- **1px hairlines in `--color-line` are a primary design element**, not a last-resort divider. A drawing is made of lines. Use them to structure, not just to separate.

---

## THE FIVE SIGNATURE ELEMENTS

Built as reusable components in `components/drawing/`. These are the system — not decoration applied afterward.

### 1. Registration marks
L-shaped corner ticks: 10px legs, 1px, `--color-line-strong`, at the four corners of major blocks and the modal. Crop marks on a drawing sheet. **This one detail carries the aesthetic** — it is the cheapest and most legible signal that the page was drawn rather than assembled.

### 2. Sheet numbering
Every section carries a mono label, top-left: `01 / THE PROBLEM`, `02 / THE ESTIMATE`. Numbered like drawings. The number is not decoration; it tells the reader where they are in the set.

### 3. Dimension lines
Key numbers get a thin rule with end-ticks and a mono unit label beneath. The estimate range reads:

```
$18,500 – $42,000
├──────────────────┤
ESTIMATED RANGE / NORTHERN VIRGINIA / 2026
```

Data feels measured, not marketed.

### 4. Visible grid
A faint 8px grid in `--color-line` at ~4% opacity behind the hero and **one** other section, fading on scroll. **Two sections maximum.** A grid everywhere is wallpaper; a grid in two places is a drawing surface.

### 5. The lit panel
The waitlist modal. **The one warm object on the site.** Spec below.

---

## COMPONENTS

**Buttons** — Primary: accent fill, white type, 2px radius, no gradient, no shadow. Secondary: hairline border, transparent fill. Hover shifts one tonal step. Nothing bounces.

**Inputs** — Filled `--color-base-alt`, borderless at rest, 2px radius. Focus adds a 1px accent border plus a 3px `--color-accent-wash` ring: the field lights up. Mono uppercase labels **above** the field. Never floating placeholders — a placeholder that doubles as a label disappears exactly when the user needs it.

**Cards** — White, hairline border, 4px radius, registration marks. Shadow only on interactive cards, only on hover.

**Numbers that carry argument** (estimate, 80%, position, spots remaining) — display size, tabular, dimension line, mono unit label. If a number matters, it gets measured.

---

## MOTION

Locked settings from DECISIONS.md. `framer-motion` for scroll reveals, CSS/rAF for component-local motion. **Never add a second motion library** (`gsap` is already present for pre-existing count-ups; do not extend its use).

- Transform and opacity only.
- Reveals fire **once**, never re-trigger on scroll-back.
- Nothing over **600ms**.
- **No spring overshoot.** Precise, not playful.
- `prefers-reduced-motion`: opacity only, 200ms, no count-ups, no pulses.

---

## HOMEPAGE — SECTION BY SECTION

Structure stays; execution levels up.

| # | Section | Spec |
|---|---|---|
| 00 | **HERO** | Faint grid. Mono eyebrow `NORTHERN VIRGINIA / FOUNDING ACCESS`. Display headline "Stop gambling on contractors." Sub in `--color-ink-2`. One accent CTA opening the modal. Registration marks framing the block. Marked video slot retained, **not wired**. |
| 01 | **THE PROBLEM** | Alt background. One enormous line. Huge whitespace. Mono sheet number. Nothing else on screen. |
| 02 | **THE ESTIMATE** | Split. Left copy, right `$18,500 – $42,000` at display size with dimension line and mono unit label. |
| 03 | **THE MECHANICS** | Five cards (Match / Home Passport / Backstory Engine / Health Score / Oracle), hairline borders, registration marks, mono numbering 01–05, one claim each, staggered reveal, 1px line-art icons in accent. No filled icon sets. |
| 04 | **THE 80% GATE** | `80%` at maximum display size, dimension line, mono annotation `MINIMUM COMPATIBILITY / ENFORCED`. |
| 05 | **FOUNDERS PROGRAM** | Live `X OF 500 REMAINING`, tabular, dimension line. Three tiers as a hairline-ruled technical table, not marketing cards. |
| 06 | **FINAL CTA** | Modal trigger, mono reassurance line. |
| — | **FOOTER** | Hairline top rule, mono links, wordmark, one line of legal. |

### Truthfulness constraint on section 03

**Four of the five mechanics are not built.** Copy must describe what Laywork does without implying they are live today. Write in the register of intent and design ("built to", "the standard we hold") or plain future tense — never present-tense claims of an existing capability, never fabricated counts or outcomes. When in doubt, flag the line rather than shipping an overclaim. See FEATURE_INVENTORY.md for per-feature build status.

### Real-data constraint on section 05

The founding counter renders **only** from `get_waitlist_public_stats()`. If the value is unavailable, **hide the element**. Never fabricate a number. This rule has no exceptions and no "reasonable default."

---

## THE WAITLIST MODAL

Reuses the existing signup path (`hooks/useWaitlistSignup.ts`) — one signup path for the route and the modal both. **No second path. RLS untouched.**

**The look**: a lit panel hovering above the page, not a box sitting on it.

- Layered shadow: a large soft ambient shadow **plus** a tighter contact shadow. Never one flat `box-shadow`.
- Backdrop blurred and slightly darkened — the page recedes but stays visible.
- Entry scales `0.96 → 1` while fading, **originating from the trigger's position**, not screen center.
- Illuminated border: 1px accent with a soft outer bloom. A **lit edge**, not a neon outline. If it reads like a highlighter, reduce border opacity and push intensity into a wider, softer bloom.
- Registration marks at four corners. Generous padding. 8px radius.

**Stage 1**: name and email only. Mono header with the live founding counter. One accent submit.

**Stage 2**, in place, no reload: position number at maximum display size, tabular, counting up over ~800ms then settling, dimension line beneath reading `POSITION / LAYWORK FOUNDING WAITLIST`. Border glow pulses **once** as it lands. Below: referral link with one-tap copy, three tiers as a hairline table, founding badge if applicable. Confirmation references **email**. Stage 1 slides out, Stage 2 slides in — never an instant swap.

**Accessibility**: focus trapped; Esc closes and returns focus to the trigger; `role="dialog"` + `aria-modal`; errors announced via `aria-live`, never colour alone; 44×44 minimum targets; full keyboard operation.

**Mobile**: full-height sheet from the bottom, illuminated top edge as the signature. 16px minimum inputs so iOS never zooms. The keyboard must not push submit off-screen.

---

## COPY RULES

Plain-spoken, protective, exact.

**Words we use**: gamble, blind, structure, verified, exact, neighbors.

**Banned**: solutions, seamless, leverage, revolutionize, empower.

**No em-dashes in user-facing copy.**

Controls name their action. Errors name the problem and the recovery. If a sentence would survive being moved to a competitor's site unchanged, it is not our sentence.
