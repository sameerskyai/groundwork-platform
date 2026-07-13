# Groundwork — Business Model

**For:** Ryan + Sameer + Armin
**Date:** 2026-07-13
**Source:** Founder working session, 2026-07-13 (Granola transcript, Ryan + Sameer in person)
**Companion docs:** `LAUNCH_PLAN.md` (tactical launch detail), `FINANCIAL_PLAN.md` (revenue distribution + runway), `ROADMAP_0_TO_100M.md` (long-range math), `AGENT_HANDOFF.md` (current build status)

## Why this doc exists

`LAUNCH_PLAN.md` describes the model as it stood on 2026-07-08: a two-sided marketplace, contractors pay to subscribe, homeowners get a free estimate plus a one-time unlock fee. The 2026-07-13 session added real structure on top of that — a second homeowner revenue line, a referral-driven growth loop, multi-portal segmentation, and an explicit "organic only until investor" go-to-market constraint. This doc is the single place that model lives, formalized. It supersedes the pricing/model summary in `LAUNCH_PLAN.md`'s intro (that doc still owns build sequencing).

**One flag before the model below:** the $20/mo homeowner subscription is new versus the existing one-time $9.99 unlock, and the meeting notes don't explicitly say whether it replaces or sits alongside that unlock fee. This doc assumes **alongside** — a three-rung homeowner funnel (see below) — because that's what's consistent with everything else said in the session (Communities as a distinct paid layer, referral discounts specifically pegged to the $20 number). Confirm this reading with Sameer before it goes into Stripe's product catalog in #5.

## Customer segments (portals)

Groundwork is not one product with one user type — it's one backend serving three front-door experiences, each with its own matching logic:

| Portal | Who | How they enter location | What they get |
|---|---|---|---|
| **Homeowner** | Individual property owner | ZIP/address, shown to others only as general area ("Northern VA") | Free estimate → swipe-match → optional Communities subscription |
| **Contractor** | Trade business | Service radius from ZIP | Daily lead feed by subscription tier |
| **Realtor / Property Manager** | Agent or multi-unit manager | Selects general working areas (e.g., Arlington, Alexandria, DC), not a single address | Same matching engine, different candidate pool and volume assumptions |

The realtor/property-manager portal is a segmentation of the existing matching engine, not a new backend — same `projects`/`matches` tables, different intake questions and a working-area model instead of a single ZIP. Property manager tier was already anticipated in the schema per `ROADMAP_0_TO_100M.md` Phase 3; this session pulls the realtor variant into scope earlier because it's cheap to add once the area-selection UI exists for one portal.

## Revenue streams

### 1. Contractor subscriptions (primary, unchanged)
- **Standard — $79/mo**: 5 leads/day
- **Growth — $149/mo**: 20 leads/day, priority placement
- No per-job cut, no lead fees — this is the load-bearing anti-disintermediation rule from `ROADMAP_0_TO_100M.md`, not a pricing knob to revisit
- 7-day free trial on signup (extended from an earlier 3-day assumption — "people get busy," per session notes)

### 2. Homeowner one-time unlock (existing, unchanged)
- $9.99 to see the full itemized cost breakdown behind the free estimate
- Stays the zero-commitment micro-conversion; doesn't require an account beyond what #4 (lead magnet rework) already plans

### 3. Homeowner Plus subscription — $20/mo (new this session)
- Gates the **Communities** feature: neighborhood-level group chats, posting project photos, soliciting contractor bids directly from the community
- Homeowner-only visibility — contractors cannot see or post in community threads (see "Anti-poaching" below)
- Homeowners can create their own communities; realtors can create realtor-only communities
- **Referral discount ladder** (see Growth loop below) — this is the main reason this tier exists as recurring rather than one-time

### 4. Future: fintech attach (Phase 4, per `ROADMAP_0_TO_100M.md`, unchanged by this session)
- Financing at the estimate moment, escrow/payments, insurance partnerships — not in scope until the data moat and metro density exist to underwrite against

## The referral growth loop

This is the mechanism that's supposed to make organic-only marketing actually work, not just a discount:

- A homeowner's referral link gives the referred signup a free trial or discounted entry
- **5 referrals** → referrer's Homeowner Plus drops to **$5/mo** (from $20)
- **10 referrals** → drops to **$10/mo**
- Net math: a referrer who hits either tier has brought in 5–10 new $20/mo subscribers to earn a $10–15/mo discount — the discount is self-funding many times over from the referrer's own cohort, before counting the compounding effect of *those* subscribers referring further
- This is the primary substitute for paid acquisition. See `FINANCIAL_PLAN.md` for why that matters to the "full organic until investor" constraint

## Anti-poaching: why everything stays on-platform

Two mechanisms exist specifically so a contractor and homeowner who match don't take the relationship off Groundwork before a review lands in `cost_data`:

1. **In-app chat only, forever** — confirmed existing decision (`LAUNCH_PLAN.md`, 2026-07-08). No code path reveals phone/email between matched parties.
2. **Communities are homeowner-only** — contractors cannot see community posts or bids. If contractors could browse community threads directly, the community becomes a free lead-gen channel that bypasses subscriptions entirely, which would cannibalize the core contractor revenue line. Terms of service must explicitly prohibit taking a matched contractor off-platform; the referral program is the carrot, ToS is the stick.

## Trust & safety (product requirement, not a revenue line, but load-bearing for the model)

- Message filtering: no profanity, racial slurs, or sexual content
- Flagging system — blocked messages trigger human review
- No address sharing anywhere in-product; ZIP/general-area only
- This matters commercially because a single trust incident in one metro (per `ROADMAP_0_TO_100M.md`'s "five things that kill this") can poison an entire launch market before density is reached

## Matching algorithm v2

Refines the existing trade + ZIP-radius + trust-score matching (`LAUNCH_PLAN.md`) into a scored system:

- Compatibility expressed as a **percentage score**; only surface matches at **85%+**
- Factors: budget, ZIP/distance, timeframe, personality (from #11 homeowner preference profiling)
- Each portal (homeowner, realtor, property manager) runs its own scoring weights against the same underlying contractor data — not three separate algorithms, one scoring engine with portal-specific weight profiles

## Post-project data capture (the moat, reaffirmed)

No change to the underlying thesis in `ROADMAP_0_TO_100M.md` — completed jobs feeding `cost_data` are still the entire long-term defensibility argument. This session adds the actual trigger mechanic:

- AI prompts both parties in the shared chat **24 hours after full payment is confirmed**
- Framed as "Do you recommend this contractor?" plus qualitative fields — not a bare star rating
- Feeds `completed_jobs`, `reviews`, trust score, and `cost_data` in one submission (already the plan in #8; this session just specifies the timing and question framing)

## Go-to-market constraint: organic only until investor

Explicit decision this session, binding until the $1M pre-seed raise (see `FINANCIAL_PLAN.md`):

- **No paid acquisition of any kind** — no paid social, no paid search, not yet
- Channels in scope: founder-led organic content (Armin as primary face), direct outreach (scraping real estate agencies/PE real estate groups for the waitlist), local press as a deliberate paid-placement exception (county mail, WaPo/NYT slots — this is press placement, not performance ads, and is the one paid line item this constraint doesn't cover), referral loop above, and direct founder calls with early users
- Investor trigger: **50,000 waitlist signups** — that's the number that converts this from "should we raise" to "raise on our terms," per the Searchable-style validate-before-scale logic already in `LAUNCH_PLAN.md`
- Role ownership: Armin owns this end to end as Growth Operator — full role brief in `GROWTH_OPERATOR_ROLE.md`

## Open items this doc deliberately does not resolve

- Whether Homeowner Plus ($20/mo) replaces or supplements the $9.99 unlock — flagged above, needs a yes/no from Sameer before Stripe products are defined in #5
- Realtor/property-manager pricing — no price point was discussed this session for that portal; contractor pricing logic doesn't automatically transfer (different volume/value profile)
- SMS compliance copy for the waitlist consent checkbox — flagged in #6, needs actual ToS/privacy policy language, not just the integration
