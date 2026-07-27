# Groundwork — Roadmap: $0 to $100M

**For:** Ryan + Sameer · **Date:** 2026-07-09 (strategy revised 2026-07-13 — national-day-one, see below)
**Companion docs:** `LAUNCH_PLAN.md` (tactical launch detail), `AGENT_HANDOFF.md` (current status), `BUSINESS_MODEL.md`, `FINANCIAL_PLAN.md`, GitHub Epic #1

## The one-sentence thesis

Homeowners get ripped off because they walk into contractor conversations with no pricing data — Groundwork gives them the number first. The estimate is the wedge, matching is the monetization, completed-job cost data is the moat. Long term this isn't "another contractor marketplace": it's the **Zillow Zestimate / Kelley Blue Book of home improvement** — the trusted price-truth layer for a category whose entire problem is price opacity. Whoever owns trusted price data owns the category, and it can't be copied without years of the same job history.

## Strategy revision, 2026-07-13: national from day one, not metro-by-metro

The original version of this roadmap sequenced growth one metro at a time (Northern Virginia, then 3–5 adjacent metros, then 15–20). That's the standard cautious marketplace playbook, and it's still correct about one thing: **a contractor with zero leads churns, regardless of how many states you're in.** But the founders' explicit call is to go after all 50 states at once — there's no single app homeowners already trust for genuine contractors, and no app that hands contractors that relationship without a lead-fee tax. That's a national category-ownership bet, not a metro-density bet, and the roadmap below is rebuilt around it.

**What "national from day one" actually means operationally** — this reconciles the ambition with the one real constraint (local contractor density) rather than ignoring it:

- **Demand capture is national and instant, with no rework needed.** The waitlist, the free AI estimate tool, and all organic content are usable by any homeowner in any state from day one — nothing in the product gates this by geography. Content, press, and SEO reach all 50 states the moment they're published; there's no "unlock the next metro" step on the demand side.
- **Contractor supply is recruited in parallel across many metros at once, not sequentially** — via self-serve signup (no manual per-metro bottleneck) plus the same organic outreach engine (`GROWTH_OPERATOR_ROLE.md`) now targeting real estate agencies and PE real estate groups nationally, not just Northern Virginia.
- **Local density still has to happen before a given metro is "won."** ~150 contractors per metro is still the unit that makes the $100M math work (below) — what's changed is that dozens of metros build toward that number simultaneously instead of one metro finishing before the next starts.
- **The real risk this creates — thin density everywhere instead of strength somewhere — gets managed with data, not avoided by refusing to launch wide.** See the revised guardrail #2 below: track per-metro density weekly, and throttle new contractor recruitment in any metro where homeowner demand hasn't caught up, instead of limiting how many metros are open at all.

## The market, recalculated for a national strategy

The earlier estimate of "~14–15M homeowners renovate annually, 5% capture ≈ $14M MRR" (from the 2026-07-13 founder session) was scoped to the **East Coast only** — it undersells a 50-state strategy and needs correcting before it goes into any investor conversation:

| | East Coast (old scope) | **National (correct scope for this strategy)** |
|---|---|---|
| Homeowners renovating annually | ~14–15M | **~43M** (82.9M owner-occupied housing units × 52% annual renovation rate — Census ACS 2019-2023 × Houzz) |
| 5% capture | ~700K homeowners | **~2.16M homeowners** |
| MRR at $20/mo (Homeowner Plus) | ~$14M | **~$43M** |
| Annualized | — | **~$517M ARR ceiling**, homeowner-side alone |

This is a sizing ceiling, not a projection — same caveat as before (assumes uniform homeownership rate and renovation propensity nationally, which isn't quite true state to state). But it's the honest number for the strategy actually being pursued, and it's more than 3x the figure the East-Coast framing implied. Use this version going forward, including in `docs/pitch-deck/`.

## The math to $100M

Unchanged by the sequencing revision — this was already a 50-metro, national end-state, just reached differently now:

A $100M valuation for marketplace SaaS with a compounding data moat ≈ **$8–12M ARR** (8–12x multiple; growth rate is the multiplier — Searchable got $85M on $3M ARR because of velocity). At blended ~$100/mo contractor ARPU ($79/$149 mix), that's **~7,000–10,000 paying contractors** — roughly 150–200 per metro across the top 50 US metros.

**The whole game in one line: ~150 paying contractors per metro, 50 metros, churn under 5% — now pursued in parallel instead of sequentially.**

## Phases

### Phase 0 — Launch gate (now → Beta 1, ~9 days per `SPRINT_14_DAY_PLAN.md`, $0)
Fully mapped as issues #2–#32. Strategic note: don't let this phase sprawl regardless of the national ambition — the product has to work before it works anywhere, let alone everywhere.

### Phase 1 — National beta: a flagship metro in every state, simultaneously ($0 → ~$10K MRR)
Demand: waitlist and content go national on day one — no metro gating. Supply: contractor recruitment opens in parallel across each state's flagship metro (self-serve onboarding, not hand-held per-metro launches), using the seed data and playbook already built from Northern Virginia as the template, not the limit.

- Goal: initial contractor toeholds (10–20 contractors) across as many flagship metros as the organic engine can actually reach with real demand — not a fixed number "everywhere," a number that tracks wherever waitlist signups are actually landing
- Engine: founder-led content and direct outreach are already national in reach (`GROWTH_OPERATOR_ROLE.md`) — the only change is not artificially restricting contractor recruitment to one region while waiting for it to "prove out" first
- Metrics that decide everything, now tracked **per metro, weekly**: estimate→match >40%, match accept >60%, **contractor monthly churn <5%**, and a live ZIP/metro density map showing which markets have real supply-demand balance versus which have contractors sitting with no leads. A metro with contractors but no homeowner demand is the failure mode this phase has to watch for continuously — see the revised guardrail below.

### Phase 2 — Deepen every metro in parallel ($10K → $100K MRR)
- Instead of hand-picking 3–5 "adjacent" metros after proving one, push every flagship metro that showed real signal in Phase 1 from an initial toehold toward real density (100+ contractors), simultaneously
- Codify the playbook once (seed cost data → recruit contractors via waitlist and self-serve onboarding → turn on homeowner demand → density flywheel) and run it as a repeatable, parallel process across metros rather than a one-at-a-time rollout
- Prove unit economics per metro: LTV/CAC > 3, churn < 5% — this is when raising (if desired) is easy on your terms, traction first, investors inbound (the Searchable pattern)
- First hire: contractor success / sales, likely needed sooner than in the sequential version, since there are more simultaneous metros to support

### Phase 3 — Second-tier cities inside every state ($100K → $1M MRR)
- Expand beyond each state's flagship metro into secondary cities, in states where the flagship metro is already dense
- The moat becomes visible: in mature ZIPs, estimates measurably match final prices — an accuracy claim no competitor can make
- Ship the property manager tier (recurring multi-unit demand = highest-LTV customer, already scoped in #22)
- Angi/Thumbtack respond around here; the defense is structural — they can't drop lead fees without destroying their own revenue model. You never had them.

### Phase 4 — The $100M story ($1M → $8–12M ARR)
- Top 50 metros at real density — the natural endpoint of a national-first strategy rather than the destination of a slow rollup
- Real expansion = owning more of the transaction: project payments/escrow, financing at the estimate moment ("this costs $24K — finance it?"), insurance partnerships. Fintech attach is how home-services marketplaces 10x revenue per match without lead fees.
- The estimate data makes Groundwork the best-positioned underwriter in the category.

## The five things that kill this (in order)

1. **Contractor churn** — if leads don't become jobs, the model collapses regardless of geography. Weekly lead→job tracking per contractor, non-negotiable.
2. **Thin density everywhere instead of strength somewhere** *(revised 2026-07-13)* — national reach is the strategy now, but a contractor with no leads in a barely-seeded metro churns just as fast as one in a metro you never entered. Guardrail: **weekly per-metro density tracking, and throttle new-contractor recruitment in any metro whose homeowner demand hasn't caught up** — the check is data-driven and continuous, not a decision to avoid multi-metro launch in the first place.
3. **Estimate accuracy before the flywheel spins** — until real data accumulates, estimates lean on AI generalization. Keep confidence labels honest; one viral "Groundwork said $8K, it cost $30K" story early is brutal, and a national footprint means it can happen in any of 50 states at once.
4. **Trust incidents** — one unvetted-contractor horror story can poison a launch market. Manual verification (#6) is the correct choice at this stage, not a shortcut, and self-serve contractor onboarding at national scale makes this more important, not less.
5. **Losing the no-lead-fee discipline** — a per-job cut would kill both the anti-disintermediation logic and the entire differentiation vs. Angi. Constitution-level rule, not a pricing knob.

## Standing weekly cadence (once launched)

- Contractor churn + lead→job conversion (the life-or-death numbers), tracked per metro
- Estimate→match and match→accept rates, tracked per metro
- `cost_data` growth from `completed_match` source (is the moat actually accumulating?), tracked per metro
- **ZIP/metro density map** — now the central operational artifact of this strategy, not a side chart: which metros are match-ready, which have supply outrunning demand (or the reverse), which need recruitment throttled or accelerated
