# WAR PLAN — Groundwork v3 (CANONICAL)

**Status:** 2026-07-17 | Estimate E2E verified | J2 infrastructure ready | Ready for J3-J6 queue

---

## OPERATIONAL DELTAS (v3 overrides all prior)

### DELTA 1: TWO FRONTS STRATEGY

**National Front (Day 1, all ZIPs, zero supply):**
- Estimate flow → Budget capture → Personality questions → Match pool
- My Home dashboard (rooms, systems, timelines)
- Backstory engine (receipt import, document parsing)
- Health Score v1 (maintenance behavior tracking)
- Zero expectations on contractor supply (all ZIPs day one)
- Homeowner retention = function of Graph, not contractor density

**Density Front (cluster unlock):**
- Matching auto-unlocks at thresholds per ZIP cluster
- Example: 150 homeowners + 25 contractors = unlocks "ready to match"
- Below threshold: homeowners see "your area is 40% ready, invite neighbors"
- Density system ALREADY BUILT in current infrastructure
- Growth is geographic unlock, not feature unlock

**Why both:** National Front sells the tool + data + confidence. Density Front sells contractor scarcity (FOMO). Tension between them is feature.

---

### DELTA 2: PRICING UPDATE (Supersedes all prior)

**Homeowner Tier:**
- ~~$20/month~~ → **$99/year** (effective $8.25/mo, annual commitment)
- Unlocks: unlimited matching, full Graph/Passport, Health Score detail, Oracle access, quote checker
- Free tier unchanged: estimate (3/mo capped), basic matching (1 active, 3 reveals/day), community view

**Referral Reward:**
- ~~$10/mo for life at 10 referrals~~ → **$49/year for life at 10 verified referrals**
- Homeowner pays once, gets annual credit forever
- CAC weapon: 10 referrals @ $5/mo blended cost = we acquired 10 users for $120 annual spend
- Non-linear value: first 2-3 referrals are natural (friends), 4-10 are sticky network growth

**Contractor Tier:**
- Free tier: 1 lead/week, basic profile (unchanged)
- Paid: **$49/month unlimited leads** (unchanged)
- No referral tier (contractors are supply, not demand-gen)

**Stripe Update Required:**
- Delete old $20/mo product
- Create new $99/year product with proration logic
- Update referral trigger from 10→10, amount from $10/mo to $49/year
- Redirect all existing Homeowner+ subscriptions to annual cohort (grandfather at $99/year or offer upgrade)

**Flag for founder review:** Pricing is a one-way door. Every file this touches needs approval before merge.

---

### DELTA 3: AI COST DISCIPLINE (Kill 12 armor)

**Free Tier Estimate Cap:**
- 3 estimates/month per user (not unlimited)
- Resets monthly
- Upgrade message: "Unlimited estimates with Homeowner+"

**Regional Pricing Cache:**
- Pre-load cost_data for top 100 ZIPs weekly
- Similar project type queries hit cache before hitting Claude
- Cheap: memcached at $0.15/month, saves ~60% of estimate cost on cache hits

**Model Tiering:**
- Classification (project type): **claude-haiku-4-5** ($0.80 / 1M input tokens)
- Estimate synthesis: **claude-sonnet-4-6** ($3 / 1M input tokens)
- Switchover: if description < 50 chars, Haiku only (skip Sonnet)

**Cost Tracking (Instrumentation Only):**
- Add `ai_cost_cents` to estimates table (decimal, 2 places)
- Calculate post-response: `(input_tokens * rate) + (output_tokens * rate) / 100`
- Track per-user rolling 30d spend (metrics dashboard TBD)
- Trip wire: `$0.40/month per active user` = unsustainable bleed (War Plan 9.5.3)

**Rationale:** Founder can see if estimate feature scales or becomes a subsidy. No paywall yet—but metrics ready for decision.

---

### DELTA 4: ORACLE LANGUAGE ARCHITECTURE (Kill 8 armor)

**Statistical Framing (All AI Output):**
- ❌ "Your water heater will fail in 2025"
- ✅ "Homes like yours typically experience water heater failure at 12-15 years. Yours is currently 11 years old."
- ❌ "You need a new HVAC"
- ✅ "Regional data suggests HVAC replacement ~$6K-$12K in your area. Your current system is at year 18 (typical lifespan is 15-20)."

**Range, Not Verdict:**
- ❌ "Your house is rated 73/100"
- ✅ "Based on recent projects and regional data, comparable homes rate 65-80. Your recent maintenance patterns suggest 70-75 range."

**Mandatory Labels:**
- Estimates: "This is an estimate based on description and regional data. Not an inspection."
- Health Score: "Based on your reported maintenance. Not a professional assessment."
- Oracle: "Patterns from homes like yours in [ZIP]. Your situation may differ."

**Audit Checklist (Before Estimate Feature Launches to Production):**
- [ ] Estimate agent prompt uses "typically," "regional average," "pattern" framing
- [ ] No verdicts ("you need X") — all outputs range ("$X-$Y depending on Y variable")
- [ ] Every Health Score explanation includes "based on your reported data"
- [ ] Oracle output prefixed with "Homes in your area typically..."
- [ ] No percentages without context ("75% of homes" — 75% over what period? what area?)

**Rationale:** Protects Groundwork legally (CYA language) + builds trust (honesty about confidence levels) + better UX (users make better decisions with ranges).

---

## Current Execution Status

### ✅ COMPLETE (Shipped J1-J2a + Infrastructure)
- J1: Conversational onboarding
- J1b: Properties foundation + ZIP-once pattern
- J2a: Budget step (estimate-anchored)
- J5: Contractor profiles + saved contractors
- **NEW:** J2: Personality questions infrastructure (awaiting founder approval of question text)
- **NEW:** Migration 023: A/B experiment instrumentation (no verdict logic yet)

### ⏳ QUEUED (Ready to execute when questions approved)
- J2: Full personality flow + trait vector calculation + match pool routing
- J3: Swipe/heart/save cards (Tinder-style full-screen, 80%+ gate)
- J8: Saved contractors list page
- J4: Messaging inbox + conversation threads
- J9: ZIP communities (auto-provision, ~42k US ZIPs)
- J7: Project process checklist (10-step tracker)
- J6: Founder demo seed data (populated with realistic activity)

### 🔴 BLOCKED
- Pricing: Stripe products not yet created for $99/year + $49/year referral
- Cost tracking: Instrumentation ready, metrics dashboard TBD
- Oracle language: Estimate prompt not yet audited for compliance

---

## Next 7 Days (Revised Per Deltas)

| Day | Focus |
|---|---|
| 1 | Founder approval: personality questions + pricing structure + Oracle language audit |
| 2 | Implement Delta 2: Update Stripe products, pricing UI, referral logic. Founder review all touched files. |
| 3 | Implement Delta 3: Add estimate cap to free tier, cache setup, model tiering, cost tracking columns |
| 4 | Audit Delta 4: Estimate agent prompt + Health Score text + Oracle framing. Fix all language to statistical. |
| 5 | J3-J6 build: Swipe, saved list, messaging, communities, checklist, founder seed. Full journey walkthrough #2. |
| 6 | A/B harness activation: Assign new matches to arms, record arm + timestamp. (No analysis yet—pure instrumentation.) |
| 7 | Design pass + waitlist final review. Traction metrics ready. Go/no-go for waitlist launch. |

---

## Rationale (Why These Deltas)

**Two Fronts:** Solves the chicken-egg problem. National Front sells the tool without supply (retention thesis: Graph stickiness, not contractor scarcity). Density Front sells at scale (when we DO have supply, scarcity + network effects = moat).

**Pricing:** $99/year compresses decision friction (vs. monthly renewal fatigue) + feels like "annual subscription to operating system for my home" (not "monthly app fee"). Referral reward ($49/yr for life) is FORCE MULTIPLIER: not lost revenue, but CAC efficiency (we save on marketing by paying existing users to recruit).

**AI Cost Discipline:** Estimate feature is loss-leader if uncapped. $0.40/user/month is the inflection point where we'd be subsidizing heavy users. Capping free tier (3/mo) + caching + model tiering keeps us <$0.05/user/month even with referral signups.

**Oracle Language:** Legal + UX + trust. We're not a licensed appraiser/inspector, so ranges + disclaimers are non-negotiable. But ALSO: users make better decisions with ranges ("water heater lasts 12-15 years, yours is 11") than verdicts ("you need a new one").

---

**This document is canonical. Changes require written agreement from all three founders (Sameer, Ryan, Armin).**
