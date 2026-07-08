# Groundwork — Path to Launch

**For:** Ryan + Sameer
**Date:** 2026-07-08
**Tracking:** GitHub Epic [#1](https://github.com/Rycrypn/Groundwork-platform/issues/1) + child issues [#2](https://github.com/Rycrypn/Groundwork-platform/issues/2)–[#9](https://github.com/Rycrypn/Groundwork-platform/issues/9)

## Why this doc exists

The app is fully built — 34 pages, 8 AI agents, a live Supabase database, deployed on Vercel — but it has never been run end-to-end with real data, real payments, or a real stranger using it. This doc explains the full model (what Groundwork actually is as a business, not just a codebase), everything left before we can call this launched, why it's in that order, and who's doing what.

## The full model — what Groundwork actually is

Groundwork is a **two-sided marketplace**: homeowners get a free AI cost estimate before they ever talk to a contractor, then swipe-match (Tinder-style) with contractors who fit their project and budget. Contractors never cold-call or spam — homeowners stay in control of who sees their project.

**Revenue**: homeowners get the estimate and matching for free, and pay only a small one-time fee to unlock the full itemized breakdown. Contractors pay a flat monthly subscription — Standard $79/mo (5 leads/day) or Growth $149/mo (20 leads/day, priority placement) — with **no per-job cut and no lead fees**. That last part matters: it removes any incentive for a contractor to close the deal and then route around the platform next time, since the platform isn't taking a cut of the job itself.

**The actual moat is data, not features.** Every completed job adds a real ZIP-level cost data point — trade, price, days to complete. The more jobs completed, the more accurate estimates get, and that compounds over time in a way no competitor can copy without years of the same job history. This is why issue [#8](https://github.com/Rycrypn/Groundwork-platform/issues/8) (job completion + review flow) matters as much as any core feature — without it, `cost_data` never grows past whatever gets seeded manually, and the moat never actually starts building.

**Growth mechanics matter as much as the product.** A comparable AI startup (Searchable) hit $3M ARR in 5 months using a specific playbook, and it maps directly onto Groundwork:

- **Validate before scaling (the "CODE" framework)**: a real Consumer trend, a specific Opportunity inside it, proof of active Demand (people already complaining about the problem, not a survey), and Economic sizing big enough to matter. For Groundwork: homeowners already distrust contractor quotes with no pricing reference point — that's the trend; giving them a real number first, before any sales conversation, is the opportunity.
- **Free lead magnet gated by account creation, not payment** converts far better than direct pitching — in Searchable's case, roughly half of people who tried the free tool converted to a paid account, versus a few percent for a typical "sign up for a demo" pitch. Issue [#4](https://github.com/Rycrypn/Groundwork-platform/issues/4) (public estimate flow) is Groundwork's version of this.
- **Build the audience/waitlist before you need it.** Issue [#9](https://github.com/Rycrypn/Groundwork-platform/issues/9) (contractor waitlist) exists so contractor recruitment doesn't start from zero on launch day — every waitlist signup becomes a warm outreach target with the framing "homeowners are already asking for quotes in your ZIP," instead of cold-pitching an empty marketplace.
- **Founder-led content, not product pitching.** Not a code task, but worth planning for: real cost breakdowns, "3 quotes we saw for the same HVAC job," contractor red flags — with one link to the free estimate tool at the bottom. This is what builds the audience that makes the waitlist and lead magnet actually work, rather than sitting empty.

## Where things actually stand right now (verified today, not assumed)

- **Live site**: https://renova-platform.vercel.app — auto-deploys every time either of us pushes to `main` on GitHub
- **Database**: Supabase is live, schema is fully deployed, security rules (RLS) are on. But the `cost_data` table — the thing that makes estimates accurate — has zero rows in it, and there are no contractor accounts yet
- **AI**: we just added the Anthropic API key today, but nobody has actually confirmed it works on the live site yet
- **The estimate flow has a structural problem**: right now, every "Get my free estimate" button on the homepage sends visitors straight to a signup form before they see a single number. That's backwards — the whole point of a free estimate tool is that it's *free to try*, and gating it behind signup kills the thing that would make people share it
- **Payments**: the Stripe code is scaffolded (checkout logic, webhook handler) but it's wired to fake placeholder keys, so nobody can actually pay for anything yet
- **Photo upload is already done** — the estimate page (`estimate/page.tsx:35-45`) already uploads project photos to Supabase storage. Older internal docs said this was still pending; that was stale, corrected here.
- **The data moat doesn't exist in the product yet.** `completed_jobs` is only ever *read* (a count on the contractor dashboard) — nothing anywhere lets a homeowner or contractor actually mark a job done or leave a review. No `cost_data` row has ever been created from a real completed match.
- **No contractor waitlist mechanism exists at all** — the only way for a contractor to engage today is the full signup + onboarding flow, nothing lighter-weight for pre-launch recruitment.

None of this is a sign anything is broken — it's just never been turned on for real, and two growth-critical pieces (the review flow and the waitlist) were never built in the first place. This plan turns everything on and fills the gaps, in the order that avoids wasting time debugging the wrong layer.

## The eight steps, in order

### 1. Verify AI integration works live — [#2](https://github.com/Rycrypn/Groundwork-platform/issues/2)
**Owner: Ryan · ~30 min**

Before touching anything else, confirm the Anthropic key we just added actually works when a real request hits the live site. If we skip this and go straight to seeding data or testing flows, and something's broken, we'd waste hours debugging the wrong thing. This is a 30-minute sanity check: submit a real estimate request on the live site, check that Claude actually generated the response (not a generic fallback), and confirm usage shows up in the Anthropic console.

### 2. Seed backend demo data — [#3](https://github.com/Rycrypn/Groundwork-platform/issues/3)
**Owner: Ryan · ~2-3 hours · depends on #2**

Right now there's nothing in the database to demo against. This step: sign up 2-3 real contractor accounts (completing their onboarding so they show up in matching), and manually insert 20-30 sample cost records into Supabase so estimates stop returning generic fallback ranges and start reflecting real pricing data for a few trades and ZIP codes. After this, the app has something real to show instead of empty states everywhere.

### 3. Rework the estimate flow into a public lead magnet — [#4](https://github.com/Rycrypn/Groundwork-platform/issues/4)
**Owner: Ryan · ~1-2 days · depends on #2**

This is the most important product change on this list, not just a bug fix. Let anyone try the estimate tool with zero signup — they type a project description and ZIP, get a real price range instantly. The *full* itemized breakdown and contractor matching stay behind a free account — that's the moment they convert. Concretely: new public route for the estimate, homepage buttons point there instead of straight to `/signup`, and when someone does sign up to see the full breakdown, their project carries over so they don't retype it.

### 4. Stripe integration — [#5](https://github.com/Rycrypn/Groundwork-platform/issues/5)
**Owner: Sameer · ~1-2 days · independent, runs in parallel**

This doesn't depend on anything above, which is why it's Sameer's track — no need to wait on the AI/data work. Create real Stripe test-mode products (Standard $79/mo, Growth $149/mo contractor subscriptions, plus the one-time estimate-unlock payment), wire the real test keys in, and confirm checkout actually works and updates the database correctly when a payment succeeds.

### 5. Job completion + review flow — [#8](https://github.com/Rycrypn/Groundwork-platform/issues/8)
**Owner: either · ~1-2 days · independent, runs in parallel**

This is what actually makes the data moat real instead of theoretical. Add a "mark job complete" action once a match has been active, prompt the homeowner for a rating, final price, on-time yes/no, and dispute yes/no. That submission writes to `completed_jobs`, `reviews`, updates the contractor's trust score, *and* inserts a new `cost_data` row — which is the mechanism that makes estimates get better over time instead of staying static forever. Homeowner-only submission (not contractor) so trust scores can't be gamed.

### 6. Contractor waitlist — [#9](https://github.com/Rycrypn/Groundwork-platform/issues/9)
**Owner: either · ~half a day · no dependencies, start immediately**

The cheapest, highest-leverage item on this list, and it should start now rather than waiting on anything else. A lightweight form (business name, trade, ZIP, email) with no password or onboarding required. This becomes the list we cold-outreach from — "homeowners are already asking for quotes in your ZIP" — so there's already contractor supply lined up instead of starting from zero on launch day.

### 7. Pre-launch hardening — [#6](https://github.com/Rycrypn/Groundwork-platform/issues/6)
**Owner: Both · ~2-3 days · depends on #3 and #4**

The polish layer, once the core paths work. A lightweight contractor verification step (manual admin review is fine for launch — no need for a third-party verification API yet). Email notifications so homeowners and contractors actually know when they've matched. A real custom domain instead of the free vercel.app one.

### 8. Final end-to-end QA + launch checklist — [#7](https://github.com/Rycrypn/Groundwork-platform/issues/7)
**Owner: Both · ~1 day · depends on #5 and #6**

The launch gate. Both of us independently walk the full homeowner journey and the full contractor journey on the live site, test what happens when things go wrong (bad ZIP, declined card, empty inputs), and only launch once we both agree it's ready. Closing this issue *is* the launch decision.

## How the dependencies fit together

```
#2 (verify AI) ─┬─> #3 (seed data) ─┐
                └─> #4 (lead magnet) ┼─> #6 (hardening) ─> #7 (launch gate)
#5 (Stripe, parallel) ──────────────────────────────────────┘
#8 (review flow, parallel) ──────────────────────────────────┘
#9 (waitlist, parallel — start immediately, no dependencies)
```

## What's deliberately NOT in this plan

These are real, but they don't block launch — they're tracked as follow-ups, not part of getting to a working, launchable product:

- Custom domain is bundled into hardening (#6) since it's cheap, but a delay there doesn't block anything else
- Full admin dashboard (user management, analytics) — a placeholder is fine for now
- Automated contractor license/insurance verification (Checkr-style API) — manual review is fine to start
- Property manager multi-unit flow — a post-launch feature
- Blog content — an SEO play, not a launch blocker
- Dispute resolution workflow — captured as a yes/no flag in #8, not a full process
- Homeowner-side waitlist — not needed, since the public estimate flow (#4) already captures homeowner leads once it ships

## Where to track progress

Everything above lives as real GitHub issues, not just this doc — check them off as they close: [github.com/Rycrypn/Groundwork-platform/issues](https://github.com/Rycrypn/Groundwork-platform/issues)
