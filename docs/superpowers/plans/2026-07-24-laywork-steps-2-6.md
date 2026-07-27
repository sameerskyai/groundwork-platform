# Laywork Website Steps 2–6 + Deploy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Laywork public site (Founders page, referral status page, leaderboard, SEO/OG/favicon, legacy-page retokenize, admin verify) and ship it to Vercel production.

**Architecture:** Next.js 16 App Router on the existing repo; every new surface reuses the Blue/White/Black token system, the `components/home/Reveal` scroll wrapper, `WaitlistModalTrigger` for CTAs, and the existing waitlist APIs (one new read-only status endpoint). Deploy = push branch → PR → Vercel preview verify → merge `main` → production (GitHub integration auto-deploys).

**Tech Stack:** Next.js 16.2 (Turbopack), TypeScript, Tailwind + CSS tokens, framer-motion, Supabase (service role server-side only), Vercel.

## Global Constraints

- Name LAYWORK: user-facing strings say "Laywork"; never rename repo/DB/env/package (DECISIONS.md 2026-07-24).
- Palette via tokens only — zero hardcoded hex in CSS/className/inline styles. Canonical: `--color-base #FFFFFF`, `--color-base-alt #F5F7FA`, `--color-ink #0A0A0A`, `--color-accent #1A5490`, `--color-line #D6DEE7`, `--color-text-muted #6B7280`, `--color-verified` (verification only), `--color-alert` (errors only). One solid-blue element per viewport. EXCEPTION (logged): `app/icon.tsx` / `app/opengraph-image.tsx` use `ImageResponse`, which cannot read CSS vars — literal token values allowed there only, each with a `/* token: --color-x */` comment.
- NO SMS anywhere; waitlist = name + email (DECISIONS.md 2026-07-23).
- WCAG 2.1 AA every page: landmarks, one h1, visible focus, 44px touch targets, reduced-motion honored (Reveal already does).
- Founders Program canon (DECISIONS.md 2026-07-24): first 500 auto-Founding, referral-earnable, tiers 3 = Founding Member · 5 = free Home Backstory report at launch · 10 = Laywork+ locked at $49/yr for life, ~100 spots per verified referral, top-25 leaderboard (first name + last initial), wave access. Real data only — hide counters when unavailable, never fabricate.
- §20 evidence: no claim without command output/screenshot. §22 status language. No new npm dependencies.
- Motion: framer-motion via `components/home/Reveal` only; durations/easings from tokens.
- PII: never expose email, full last name, phone, or IP through any new endpoint or page.

---

### Task 1: Founders Program page

**Files:**
- Create: `app/founders/page.tsx` (server component wrapper w/ `export const metadata`), `app/founders/FoundersContent.tsx` (client)

**Interfaces:**
- Consumes: `WaitlistModalTrigger` from `@/components/waitlist/WaitlistModal` (renders a plain `<button>`, style via className); `Reveal` from `@/components/home/Reveal`; `GET /api/waitlist/stats` → `{ total_signups, founding_500_count, spots_remaining }`.
- Produces: route `/founders` (linked from nav/footer in Task 7).

- [ ] Build the page: hero ("The Founders Program", one solid-blue CTA via WaitlistModalTrigger), live counter line "X of 500 founding spots remaining." fetched client-side from `/api/waitlist/stats` (hide entirely on fetch failure or null), "two ways in" section (first 500 automatic · earn it with 3 referrals at any position), the three tier rewards as a full-width list with blue tier numbers, "first access in waves" section, final CTA section (second solid blue, different viewport). Placeholder copy marked `{/* PLACEHOLDER COPY */}` where canon doesn't supply text.
- [ ] Verify: `npx tsc --noEmit` clean for new files; `curl -6 http://[::1]:3000/founders` → 200; hex-grep zero.
- [ ] Commit: `git add app/founders && git commit -m "feat: Founders Program page (Step 2)"`

### Task 2: Referral status page + status API

**Files:**
- Create: `app/api/waitlist/status/route.ts`, `app/status/page.tsx` (server wrapper + metadata), `app/status/StatusContent.tsx` (client)

**Interfaces:**
- Consumes: Supabase service client pattern from `app/api/waitlist/route.ts` (env `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`); waitlist columns `name, position_number, referral_code, verified_referral_count, founding_500`.
- Produces: `GET /api/waitlist/status?code=<referral_code>` → 200 `{ firstName, position_number, verified_referral_count, founding_500 }` (firstName = first word of `name` only — never the full name or email) | 404 `{ error: 'Code not found' }` | 400 missing code. Route `/status?code=` prefills and auto-loads.

- [ ] Build API route: validate `code` (uppercase alnum ≤12 chars), `.maybeSingle()` lookup by `referral_code`, return the four fields above, nothing else. Exclude `is_demo` rows.
- [ ] Build page: code input (soft-filled style, 16px, label "Your referral code") + lookup button (solid blue, the viewport's one); result panel shows "You're #N" (tabular-nums, ink), Founding badge when `founding_500`, referral link rebuilt as `${window.location.origin}/waitlist?ref=CODE` with copy button (44px, try/catch, copied feedback + sr-only live region), progress toward tiers: "X of 3 → Founding Member", "X of 5 → Home Backstory report", "X of 10 → Laywork+ $49/yr for life" with the reached ones marked (✓ + `--color-verified` allowed — verification state). Error state via persistent aria-live wrapper, text not color alone.
- [ ] Verify: tsc clean; `curl -6 "http://[::1]:3000/api/waitlist/status?code=X4Z8AZ"` returns position 14 JSON with NO email field; `/status` 200; hex-grep zero.
- [ ] Commit: `git add app/status app/api/waitlist/status && git commit -m "feat: referral status page + read-only status API (Step 3)"`

### Task 3: Public leaderboard page

**Files:**
- Create: `app/leaderboard/page.tsx` (server wrapper + metadata), `app/leaderboard/LeaderboardContent.tsx` (client)
- Modify: `app/api/waitlist/leaderboard/route.ts` only if its limit < 25 → set 25 (canon). Read it first; do not change its shape.

**Interfaces:**
- Consumes: `GET /api/waitlist/leaderboard` → `{ leaderboard: [{ display_name, verified_referral_count }] }` (verify `display_name` is already "First L." — if it's a full name, format client-side to first name + last initial, never render the full last name).
- Produces: route `/leaderboard`.

- [ ] Build page: h1 "Top referrers", ranked list 1–25 (rank in `--color-text-muted` tabular-nums, name in ink, count in accent), empty state "No referrals yet — yours could be the first." with CTA (WaitlistModalTrigger, the viewport's solid blue), bottom CTA section. Row height ≥44px.
- [ ] Verify: tsc clean; `/leaderboard` 200; API returns ≤25 rows; hex-grep zero.
- [ ] Commit: `git add app/leaderboard app/api/waitlist/leaderboard && git commit -m "feat: public leaderboard page (Step 4)"`

### Task 4: SEO, Open Graph, favicon, legal flag

**Files:**
- Modify: `app/layout.tsx` (metadata only)
- Create: `app/icon.tsx`, `app/opengraph-image.tsx`, `app/robots.ts`, `app/sitemap.ts`
- Modify: `LEGAL_TODO.md` (append). NOTE: the attorney-review comments in `app/privacy/page.tsx` + `app/terms/page.tsx` belong to Task 5b (that task owns those files — avoids a two-agent write conflict).

**Interfaces:**
- Consumes: plumb-bob path data from `components/ui/logo.tsx` (`M16 7 L26 18 L22 30 L10 30 L6 18 Z` + point `M10 30 L16 39 L22 30`, string `x1=16 y1=0 x2=16 y2=6`).
- Produces: site-wide metadata; `/icon`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`.

- [ ] `app/layout.tsx` metadata: `metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')`, title `{ default: 'Laywork — Stop gambling on contractors.', template: '%s — Laywork' }`, description "Free AI renovation estimates. Contractors matched at 80%+ compatibility. Northern Virginia first.", openGraph + twitter `summary_large_image`.
- [ ] `app/icon.tsx`: `ImageResponse` 32×32, white bg `#FFFFFF /* token: --color-base */`, plumb-bob strokes `#1A5490 /* token: --color-accent */`.
- [ ] `app/opengraph-image.tsx`: 1200×630, white bg, plumb-bob mark + "Laywork" wordmark in ink `#0A0A0A`, headline "Stop gambling on contractors." large ink, subline in `#6B7280`, thin `#D6DEE7` rule — each literal commented with its token name. `export const runtime = 'nodejs'` default; alt text set.
- [ ] `app/robots.ts`: allow all except `/api/`, `/admin`, `/homeowner`, `/contractor` (dashboard groups); sitemap URL from `NEXT_PUBLIC_APP_URL`.
- [ ] `app/sitemap.ts`: `/`, `/founders`, `/status`, `/leaderboard`, `/how-it-works`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms`, `/waitlist`.
- [ ] Verify: tsc clean; curl `/icon` and `/opengraph-image` return 200 image content-types; `/robots.txt` + `/sitemap.xml` 200; view OG image renders (save to a temp file and inspect).
- [ ] Commit: `git add app/layout.tsx app/icon.tsx app/opengraph-image.tsx app/robots.ts app/sitemap.ts LEGAL_TODO.md app/privacy app/terms && git commit -m "feat: SEO metadata, OG card, favicon, robots/sitemap; legal review flags (Step 5+6)"`

### Task 5a: Retokenize /how-it-works + /pricing

### Task 5b: Retokenize /about + /contact + /privacy + /terms

**Files (5a):** Modify `app/how-it-works/page.tsx`, `app/pricing/page.tsx`
**Files (5b):** Modify `app/about/page.tsx`, `app/contact/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`

**Interfaces:** none new — mechanical substitution. Copy and structure MUST NOT change; only color values.

- [ ] (5b only) Add one comment at the top of privacy + terms JSX: `{/* ATTORNEY REVIEW PENDING — placeholder copy, see LEGAL_TODO.md */}`
- [ ] Replace every hardcoded color per this mapping (old Warm-Copper era → token): `#E8722C`/`#B87333`/`#C05621`/any orange/copper accent → `var(--color-accent)`; `#12181F`/`#1A202C`/`#2D3748`/near-black text → `var(--color-ink)`; dark section backgrounds (`#12181F` etc. used as bg) → `var(--color-ink)`; `#F7F5F1`/`#FAF6F0`/cream bg → `var(--color-base-alt)`; white text on dark → `var(--color-base)`; mid grays (`#718096`/`#A0AEC0`/`#6B7280`-ish) → `var(--color-text-muted)`; light-gray text ON DARK backgrounds → `var(--color-line)` (muted gray fails on ink); borders/dividers → `var(--color-line)`; success greens → `var(--color-verified)`; reds → `var(--color-alert)`. NEVER put `var(--color-accent)` text on a dark background — use `var(--color-brand-light)` there (raw accent on ink is 2.56:1, fails AA).
- [ ] Verify per file: hex-grep zero (except none allowed), page curls 200, and a Playwright full-page screenshot is visually checked — no orange/copper remnants, no unreadable text on dark sections.
- [ ] Commit per task: `git commit -m "refactor: retokenize <pages> to Blue/White/Black tokens"`

### Task 6: Admin dashboard post-rename verification (read-only)

**Files:** none modified — verification only.

- [ ] `grep -rn -i "groundwork" "app/(dashboard)/admin"` → expect zero; read `app/(dashboard)/admin/waitlist/page.tsx` and confirm it selects real columns that still exist (no `sms_consent` dependency that would break after the API change — reading the column is fine, it still exists).
- [ ] Confirm `/admin` routes compile: they appear in `npx tsc --noEmit` output only if broken.
- [ ] Report: VERIFIED or the exact defect found. Do not fix anything.

### Task 7: Integration — nav/footer links (main session, after Tasks 1–5)

**Files:** Modify `components/home/HomeNav.tsx` (links: How it works `/how-it-works`, Founders `/founders`, Pricing `/pricing`, About `/about`), `components/home/HomeFooter.tsx` (add Founders, Leaderboard, Check your status links).

- [ ] Edit links; tsc; curl `/` 200; screenshot nav desktop+mobile menu.
- [ ] Full-surface screenshot sweep including the four new/retokenized routes, desktop + mobile; visually inspect each new page.
- [ ] Check off EXECUTION.md Steps 2–6 with evidence lines; commit docs + integration.

### Task 8: Deploy to Vercel (main session)

- [ ] `git push -u origin rebrand/laywork-blue-palette`; open PR to `main` with the Step 1–6 summary (§23 — CodeRabbit runs on the PR).
- [ ] Verify the Vercel preview deployment for the branch (Vercel MCP: `list_deployments`/`get_deployment` for project `groundwork-platform`): state READY, then curl the preview URL `/`, `/founders`, `/leaderboard`, `/status`, `/api/waitlist/stats`.
- [ ] Check `NEXT_PUBLIC_APP_URL` exists in Vercel prod env (referral links fall back to localhost without it — audit finding). If missing/wrong, report it as a founder action with exact value to set; do not guess a domain.
- [ ] Merge the PR into `main` (founder's explicit "push newest versions to vercel" order supersedes waiting for CodeRabbit findings; note any findings for follow-up). Confirm production deployment READY; curl production `/` + `/founders`; screenshot production homepage.
- [ ] Report: live URLs, deployment IDs, any env-var action needed.
