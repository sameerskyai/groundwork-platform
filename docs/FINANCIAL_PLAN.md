# Groundwork — Financial Plan: Bootstrap to Pre-Seed

**For:** Ryan + Sameer + Armin
**Date:** 2026-07-13
**Source:** Founder working session, 2026-07-13
**Companion docs:** `BUSINESS_MODEL.md` (revenue streams this plan allocates), `ROADMAP_0_TO_100M.md` (long-range ARR math), `LAUNCH_PLAN.md` (build sequencing)

## Why this doc exists

The founders decided this session to stay **organic-only until a $1M pre-seed raise**, triggered at 50,000 waitlist signups. That's a real financial constraint, not just a marketing preference: it means every dollar of growth has to come from the product loop (referrals, content, direct outreach) rather than a marketing budget, and it means the company needs to survive on near-zero infrastructure cost until contractor revenue starts. This doc lays out what that costs, how revenue gets allocated once it exists, and what changes after the raise.

**What this doc is not:** a cap table or equity split. The session did not resolve founder equity or compensation splits (Ryan, Sameer, Armin, and an unnamed third co-founder were all discussed as contributors with different roles, but no ownership percentages were stated). That has to be a separate, explicit agreement — don't infer splits from role descriptions. This plan treats "founder distributions" as a single undetermined line item until that agreement exists.

## Phase 0 — Pre-revenue (now, ~3 weeks per `LAUNCH_PLAN.md`)

Fixed monthly infra cost, funded out of pocket, no revenue yet:

| Line item | Est. monthly cost |
|---|---|
| Supabase (Pro tier, once past free tier limits) | ~$25 |
| Vercel (Pro tier) | ~$20 |
| Anthropic API (8 agents, pre-launch volume) | ~$20–50, usage-based |
| Stripe | $0 fixed (2.9% + $0.30/transaction, once live) |
| Domain (once purchased — see decision needed below) | ~$1–3/mo amortized |
| **Total** | **~$70–100/mo** |

This is intentionally close to zero. The organic-only decision isn't just a marketing choice — it's what makes a near-zero burn rate realistic pre-revenue. There is no paid acquisition line at this phase because there is no paid acquisition.

**One real paid line item that isn't "marketing spend" in the ad-buy sense:** local press placement (county mail, a Washington Post/NYT slot) was discussed as a deliberate investment, not an ad. Budget for this separately if/when it happens — it's a founder call on timing, not automatic.

## Phase 1 — First revenue (Northern Virginia, months 1–6)

Using the contractor targets already in `ROADMAP_0_TO_100M.md` (100–125 paying contractors by month 6, blended ARPU ~$100/mo across Standard/Growth):

- **Target MRR by month 6: ~$10,000–12,500** (contractor subscriptions only)
- Homeowner Plus ($20/mo) revenue is additive but harder to forecast this early — it depends on Communities adoption, which has no historical conversion rate yet. Don't build the Phase 1 budget assuming it; treat it as upside.

### Revenue distribution waterfall (once MRR > $0)

In priority order, every dollar of revenue gets allocated:

1. **Infra & tooling (~5–10% of revenue at this stage)** — Supabase/Vercel/Anthropic scale with usage; this line grows with the business but stays a small share of revenue at these volumes
2. **Reserve (target: 3–6 months of Phase 0 + Phase 1 fixed costs)** — build this before anything else gets discretionary spend. At ~$100–300/mo fixed cost, a 6-month reserve is ~$600–1,800 — trivial to hit from the first month or two of contractor revenue, which is the point: this business doesn't need outside capital to survive, only to accelerate
3. **Growth reinvestment, organic-only compliant** — this is spend that supports the organic loop without becoming paid acquisition: video/content production tools for Armin's channel, the SMS platform once #6 ships (base fee + usage, not yet priced), contractor verification tooling. Still zero paid ads/paid social by the standing decision
4. **Founder distributions** — deferred until reserve target is consistently met and growth reinvestment needs are funded. Split TBD (see cap table note above) — do not distribute before 1–3 are funded

### TAM sanity check (context for how big Phase 1+ could get, not a Phase 1 target)

- ~14–15M East Coast homeowners undertake a renovation project in a given year (estimated 2026-07-13, see prior conversation — back-of-envelope from Census owner-occupied housing counts × Houzz's ~52% annual renovation-participation rate, East Coast defined as ME→FL Atlantic states + DC)
- 5% capture of that pool ≈ **700,000 homeowners**
- At $20/mo Homeowner Plus, full capture of that 5% ≈ **~$14M/mo** in homeowner-side revenue alone, before any contractor-side revenue
- This is a ceiling/sanity-check number, not a projection — it says the homeowner-subscription line, if Communities actually gets adopted at scale, is at least as large an opportunity as the contractor-subscription line modeled in `ROADMAP_0_TO_100M.md` ($8–12M ARR from contractors alone). Treat both as independent upside cases, not additive certainties, until Phase 1 gives real conversion data on Homeowner Plus specifically

## Phase 2+ — Beyond first metro

No changes to the `ROADMAP_0_TO_100M.md` phase structure ($10K → $100K → $1M MRR, 3–5 metros → 15–20 metros). This financial plan's job stops at "how do we fund ourselves without outside capital through Phase 1" — Phase 2 economics (LTV/CAC > 3, churn < 5%) are the metrics that make a raise unnecessary but attractive on founders' terms, exactly as already documented there.

## The fundraising trigger

- **Trigger: 50,000 waitlist signups** (not a revenue or date trigger — a demand-proof trigger, consistent with the "validate before scaling" framework in `LAUNCH_PLAN.md`)
- **Ask: $1M pre-seed**
- **Pitch materials at that point**: full working back end, admin portal, community funnel, ZIP-code + personality matching — i.e., pitch the built, proven product, not a deck of intentions
- **Use of funds post-raise** (as discussed, not yet budgeted line-by-line):
  - UI/front-end hire
  - Back-end engineering hire
  - Growth operator hire
  - Relocation to SF
- Target pace discussed: **~5,000 waitlist signups within the first 60 days** of the build sprint, as an early checkpoint toward the 50,000 trigger — not the trigger itself, a pace check to know by day 60 whether the organic loop is working or needs a channel change

## What would change this plan

- If Homeowner Plus adoption is near zero in Phase 1, the TAM sanity-check upside case doesn't materialize and the business is contractor-revenue-only until that's fixed or dropped — worth an explicit checkpoint at the 90-day mark of Phase 1, not just watched passively
- If contractor churn exceeds 5% (the kill condition already flagged in `ROADMAP_0_TO_100M.md`), Phase 1 MRR targets don't hold regardless of new-signup volume — this plan's revenue assumptions inherit that risk directly
- If local press placement (the one paid line item) doesn't move waitlist numbers, that budget should stop, not continue on faith
