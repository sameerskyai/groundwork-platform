# Groundwork — Roadmap: $0 to $100M

**For:** Ryan + Sameer · **Date:** 2026-07-09
**Companion docs:** `LAUNCH_PLAN.md` (tactical launch detail), `AGENT_HANDOFF.md` (current status), GitHub Epic #1

## The one-sentence thesis

Homeowners get ripped off because they walk into contractor conversations with no pricing data — Groundwork gives them the number first. The estimate is the wedge, matching is the monetization, completed-job cost data is the moat. Long term this isn't "another contractor marketplace": it's the **Zillow Zestimate / Kelley Blue Book of home improvement** — the trusted price-truth layer for a category whose entire problem is price opacity. Whoever owns trusted price data owns the category, and it can't be copied without years of the same job history.

## The math to $100M

A $100M valuation for marketplace SaaS with a compounding data moat ≈ **$8–12M ARR** (8–12x multiple; growth rate is the multiplier — Searchable got $85M on $3M ARR because of velocity). At blended ~$100/mo contractor ARPU ($79/$149 mix), that's **~7,000–10,000 paying contractors** — roughly 150–200 per metro across the top 50 US metros.

**The whole game in one line: ~150 paying contractors per metro, 50 metros, churn under 5%.**

## Phases

### Phase 0 — Launch gate (now → ~3 weeks, $0)
Fully mapped as issues #3–#14. Strategic note: don't let this phase sprawl. Issue #7 (final QA) is the finish line; anything not on the epic waits.

### Phase 1 — Own one metro ($0 → ~$10K MRR, months 1–6)
Northern Virginia, where seed data already lives. Marketplaces die from spreading thin, not starting small — **density is everything**.

- Goal: 100–125 paying contractors + real completed jobs flowing into `cost_data`, in one metro
- Engine: founder-led content (real local cost breakdowns, contractor red flags) → free estimate lead magnet (#4) captures homeowners → waitlist (#9) + manual outreach recruits contractors ("homeowners in your ZIP are already asking")
- Do things that don't scale: personally onboard every contractor, walk every first match
- Metrics that decide everything: estimate→match >40%, match accept >60%, **contractor monthly churn <5%**. Churn is the killer — a contractor who pays $79 and lands no job cancels in month two. Track lead→hired-job conversion per contractor, weekly, from day one.

### Phase 2 — Prove the playbook repeats ($10K → $100K MRR, months 6–18)
- Codify the city launch playbook: seed cost data → recruit 20–30 contractors pre-launch via waitlist → turn on homeowner demand → density flywheel
- Run it in 3–5 adjacent metros (DC, Baltimore, Richmond) where NoVA reputation and data partially transfer
- Prove unit economics: LTV/CAC > 3, churn < 5% = a repeatable machine
- This is when raising (if desired) is easy on your terms — traction first, investors inbound (the Searchable pattern)
- First hire: contractor success / sales, not engineering

### Phase 3 — Scale + moat compounds ($100K → $1M MRR, months 18–36)
- 15–20 metros, 1,000+ contractors
- The moat becomes visible: in mature ZIPs, estimates measurably match final prices — an accuracy claim no competitor can make
- Ship the property manager tier (recurring multi-unit demand = highest-LTV customer, already in schema)
- Angi/Thumbtack respond around here; the defense is structural — they can't drop lead fees without destroying their own revenue model. You never had them.

### Phase 4 — The $100M story ($1M → $8–12M ARR, years 3–5)
- Top 50 metros
- Real expansion = owning more of the transaction: project payments/escrow, financing at the estimate moment ("this costs $24K — finance it?"), insurance partnerships. Fintech attach is how home-services marketplaces 10x revenue per match without lead fees.
- The estimate data makes Groundwork the best-positioned underwriter in the category.

## The five things that kill this (in order)

1. **Contractor churn** — if leads don't become jobs, the model collapses. Weekly lead→job tracking per contractor, non-negotiable.
2. **Spreading thin before density** — 30% density in 10 metros is worth less than 100% density in one.
3. **Estimate accuracy before the flywheel spins** — until real data accumulates, estimates lean on AI generalization. Keep confidence labels honest; one viral "Groundwork said $8K, it cost $30K" story early is brutal.
4. **Trust incidents** — one unvetted-contractor horror story can poison a small launch market. Manual verification (#6) is the correct choice at this stage, not a shortcut.
5. **Losing the no-lead-fee discipline** — a per-job cut would kill both the anti-disintermediation logic and the entire differentiation vs. Angi. Constitution-level rule, not a pricing knob.

## Standing weekly cadence (once launched)

- Contractor churn + lead→job conversion (the life-or-death numbers)
- Estimate→match and match→accept rates
- `cost_data` growth from `completed_match` source (is the moat actually accumulating?)
- ZIP density map (which ZIPs are match-ready, which need recruitment)
