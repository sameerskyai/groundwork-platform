# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Homeowners (primary)** — individual property owners, roughly 35–60, facing a significant home project (often $10k–$50k) with no pricing data. Situation: evaluating contractors while afraid of being ripped off. Job: get a trustworthy cost estimate first, then find a contractor who fits the budget — without cold calls or spam.
- **Contractors** — trade businesses buying a predictable daily feed of matched job requests in their service radius. Job: fill their pipeline without paying per-lead or losing a cut per job.
- **Realtors / Property managers** — agents and multi-unit managers using the same matching engine across general working areas rather than a single address. Pricing and intake for this portal are undecided.

The product is built for homeowners, not contractors — homeowners stay in control of every match.

## Product Purpose

A two-sided marketplace that closes the information gap in home services: homeowners get a real AI cost estimate before any contractor conversation, then swipe through matched contractor cards (interested = contractor sees the project; pass = next). All communication happens in-app. Success = completed jobs that feed the cost dataset and homeowners who never felt gambled with.

## Positioning

The moat is **cost data**: every completed job adds a real data point (ZIP, trade, final price, days to complete), making estimates more accurate over time. No competitor can replicate this without time. Versus Angi/Thumbtack: no per-job cut, no lead fees, homeowner-controlled matching instead of contractor spam.

## Operating Context

- Homeowner funnel: free estimate → optional $9.99 itemized breakdown unlock → swipe-match → in-app chat → post-project review prompt 24h after payment confirmed.
- Contractor funnel: subscription (Standard $79/mo = 5 leads/day, Growth $149/mo = 20 leads/day + priority placement), 7-day free trial.
- Homeowner Plus $20/mo gates Communities (neighborhood group chats, homeowner-only; contractors can never see them). Referral ladder: 5 referrals → $5/mo, 10 → $10/mo.
- Pre-launch phase (as of 2026-07-24): the waitlist page is the public front page; referral mechanics move signups up the list. Go-to-market is organic-only until a $1M pre-seed raise, triggered at 50,000 waitlist signups. Armin owns growth.
- Founders: Ryan + Sameer (+ Armin, growth). Working docs: EXECUTION.md (work plan), DECISIONS.md (decision log — binding), WARP.md (standing rules), docs/ (business model, launch plan, roadmap).

## Capabilities and Constraints

- Stack: Next.js 16 (App Router), TypeScript, Tailwind, Supabase (Postgres/Auth/RLS/Storage), Stripe, 8 Claude AI agents (estimator, scope clarifier, matcher, bio writer, feed writer, review summarizer, project classifier, chat moderator), Vercel.
- **In-app chat only, forever** — no code path may reveal phone/email between matched parties (anti-disintermediation, load-bearing).
- **No address sharing anywhere** — ZIP/general area only.
- **No per-job cut, no lead fees** — not a pricing knob to revisit.
- Message filtering + flagging with human review; a trust incident can poison a launch metro.
- Matching: one scoring engine, portal-specific weights; only surface matches at 85%+.
- Every code change ships through PR review (EXECUTION.md §23); every claim needs evidence (§20); every table gets `is_demo` + RLS (§14).
- Undecided: whether Homeowner Plus replaces or supplements the $9.99 unlock (needs Sameer before Stripe catalog); realtor/PM pricing; SMS compliance copy.

## Brand Commitments

- **Name: Laywork** (renamed from Groundwork, founder decision 2026-07-24). User-facing surfaces say Laywork; repo name, database tables, env vars, package name, and file paths keep the old name until a separate coordinated change.
- **Durable, survives any redesign:** all design values live as CSS variables in the tokens file (never hardcoded in components); UI is built from one consistent component system.
- **Replaceable on founder call:** the specific palette, fonts, and copy. Current palette (set 2026-07-24 in DECISIONS.md): blue/white/black — white #FFFFFF base, #F5F7FA alt, black #0A0A0A ink, blue #1A5490 accent (CTAs, active states, numeric anchors), #D6DEE7 lines, #6B7280 muted text, #1E7A4D verified-only, #B03A2E errors-only. One blue CTA per viewport; six colors, never a seventh; alert red never in the hero. The palette holds until changed in DECISIONS.md — never relitigate or change it unprompted.
- Voice anchor (waitlist era): "Stop gambling on contractors."

## Evidence on Hand

- Live verified surfaces with Playwright screenshots in `tests/e2e-screenshots/` (waitlist signup, referral chain, dashboard estimate rendering).
- Real seeded dataset: dashboard estimate $18,500–$42,000; match scores 0.92/0.85/0.81.
- **Absences that must not be fabricated:** no testimonials, no press, no completed-job counts, no customer logos, no benchmark claims. The honesty ledger in DECISIONS.md records struck claims — do not resurrect them.

## Product Principles

1. **Homeowner holds the cards** — pricing data first, homeowner-initiated matching, no contractor cold contact, ever.
2. **The data is the business** — every flow should end in a captured, structured data point; protect on-platform completion.
3. **Trust is load-bearing** — safety, privacy (general area only), and honest claims outrank growth tactics.
4. **Evidence over assertion** — no UI or status claim without a rendered screenshot; no marketing claim without real proof.
5. **Organic-first growth** — the referral loop and founder-led content substitute for paid acquisition until the raise.

## Accessibility & Inclusion

WCAG 2.1 AA is the required standard (confirmed 2026-07-24): 4.5:1 contrast for body text, 3:1 for large text, visible focus states, full keyboard operability. Primary audience skews 35–60 — favor readable type sizes and unambiguous affordances.
