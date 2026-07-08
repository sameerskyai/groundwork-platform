# Groundwork — Path to Launch

**For:** Ryan + Sameer
**Date:** 2026-07-08
**Tracking:** GitHub Epic [#1](https://github.com/Rycrypn/Groundwork-platform/issues/1) + child issues [#2](https://github.com/Rycrypn/Groundwork-platform/issues/2)–[#11](https://github.com/Rycrypn/Groundwork-platform/issues/11)

## Why this doc exists

The app is fully built — 34 pages, 8 AI agents, a live Supabase database, deployed on Vercel — but it has never been run end-to-end with real data, real payments, or a real stranger using it. This doc explains the full model (what Groundwork actually is as a business, not just a codebase), how the backend actually handles logins/data/messaging, everything left before we can call this launched, why it's in that order, and who's doing what.

## Design principle: simple and frictionless

Every feature in this plan should minimize what a user has to think about or type. Onboarding questions are short multiple-choice, always skippable, never a long survey. Auth recovery is a standard one-click flow, not custom friction. The lead magnet requires zero signup to get initial value. When adding anything new to this product, default to the version with fewer steps and fewer required fields, even if it means capturing slightly less data.

## The full model — what Groundwork actually is

Groundwork is a **two-sided marketplace**: homeowners get a free AI cost estimate before they ever talk to a contractor, then swipe-match (Tinder-style) with contractors who fit their project and budget. Contractors never cold-call or spam — homeowners stay in control of who sees their project.

**Revenue**: homeowners get the estimate and matching for free, and pay only a small one-time fee to unlock the full itemized breakdown. Contractors pay a flat monthly subscription — Standard $79/mo (5 leads/day) or Growth $149/mo (20 leads/day, priority placement) — with **no per-job cut and no lead fees**. That removes any incentive for a contractor to close the deal and then route around the platform next time.

**The actual moat is data, not features.** Every completed job adds a real ZIP-level cost data point — trade, price, days to complete. The more jobs completed, the more accurate estimates get, compounding over time in a way no competitor can copy without years of the same job history. This is why issue [#8](https://github.com/Rycrypn/Groundwork-platform/issues/8) (job completion + review flow) matters as much as any core feature.

**Growth mechanics matter as much as the product.** A comparable AI startup (Searchable) hit $3M ARR in 5 months using a specific playbook, and it maps directly onto Groundwork:

- **Validate before scaling (the "CODE" framework)**: a real Consumer trend, a specific Opportunity inside it, proof of active Demand, and Economic sizing big enough to matter. For Groundwork: homeowners already distrust contractor quotes with no pricing reference point — giving them a real number first is the opportunity.
- **Free lead magnet gated by account creation, not payment** converts far better than direct pitching. Issue [#4](https://github.com/Rycrypn/Groundwork-platform/issues/4) is Groundwork's version of this.
- **Build the audience/waitlist before you need it.** Issue [#9](https://github.com/Rycrypn/Groundwork-platform/issues/9) (contractor waitlist) exists so contractor recruitment doesn't start from zero on launch day.
- **Founder-led content, not product pitching.** Real cost breakdowns, contractor red flags, one link to the free estimate tool at the bottom. This is what builds the audience that makes the waitlist and lead magnet actually work.

## Backend architecture — logins, encryption, data, messaging (verified against real code)

**Auth & encryption**: Supabase Auth (GoTrue) handles login entirely — not custom code. Passwords are bcrypt-hashed server-side in `auth.users`, a table the app never touches directly. Sessions are JWTs stored in httpOnly cookies. Data at rest is AES-256 encrypted by Supabase's Postgres infrastructure; all traffic is TLS. **Gap found and filed as [#10](https://github.com/Rycrypn/Groundwork-platform/issues/10)**: there's no "forgot password" flow yet — anyone who forgets their password is currently locked out permanently. This is a small, standard addition (Supabase supports it natively), not a security redesign.

**Where quotes and profile data actually save**: `profiles` holds name/email/phone/ZIP, locked by row-level security so only that user can read or write their own row. `projects` holds a homeowner's posted project *and* the AI-generated estimate fields (price range, reasoning) directly on that same row — so "my quotes" is just a homeowner's own rows in `projects`, already saved per-project today. `contractor_profiles` + `contractor_pricing` hold a contractor's business info, AI-written bio, and their own rate answers.

**How a homeowner finds and contacts a contractor**: this is swipe-matching, not a directory search. Candidates come from trade + ZIP radius + trust score, showing only public contractor info (business name, bio, rating) — never a contractor's private phone or email. Swipe both ways → status flips to matched → chat unlocks.

**Contact policy — confirmed decision (2026-07-08)**: matched homeowners and contractors communicate through in-app chat *only, forever*. We checked — there is no code path anywhere that reveals a contractor's actual phone number or email to a homeowner, even after a match — and confirmed this is the intended design, not a gap. Everyone stays inside the app.

**Messaging**: a `messages` table tied to each match, with row-level security restricting read/write strictly to the two matched parties. Not end-to-end encrypted (normal for this kind of app), but protected by the same RLS + at-rest/in-transit encryption as everything else.

**How a contractor finds work**: a daily lead feed filtered by their trades + service radius, respecting their subscription tier's daily lead cap (Standard 5/day, Growth 20/day, auto-resets monthly). They swipe on projects; a mutual match unlocks chat.

## Where things actually stand right now (verified today, not assumed)

- **Live site**: https://renova-platform.vercel.app — auto-deploys every time either of us pushes to `main` on GitHub
- **Database**: Supabase is live, schema is fully deployed, RLS is on. But `cost_data` has zero rows, and there are no contractor accounts yet
- **AI**: we just added the Anthropic API key today, but nobody has confirmed it works on the live site yet
- **The estimate flow has a structural problem**: every "Get my free estimate" button sends visitors straight to a signup form before they see a single number — backwards for a free tool meant to be tried first
- **Payments**: the Stripe code is scaffolded but wired to fake placeholder keys
- **Photo upload is already done** — older internal docs said this was pending; that was stale, corrected here
- **The data moat doesn't exist in the product yet** — nothing lets a homeowner or contractor mark a job done or leave a review
- **No contractor waitlist mechanism exists at all**
- **No forgot-password flow exists** — a real gap for real users, filed as #10
- **Homeowner onboarding asks zero questions** — it's a pure no-op that just flips a boolean, filed as #11 to actually capture preferences

None of this is a sign anything is broken — it's just never been turned on for real, and a few growth-critical and UX-critical pieces were never built in the first place. This plan turns everything on and fills the gaps, in the order that avoids wasting time debugging the wrong layer.

## The ten steps, in order

### 1. Verify AI integration works live — [#2](https://github.com/Rycrypn/Groundwork-platform/issues/2)
**Owner: Ryan · ~30 min**

Before touching anything else, confirm the Anthropic key we just added actually works when a real request hits the live site.

### 2. Seed backend demo data — [#3](https://github.com/Rycrypn/Groundwork-platform/issues/3)
**Owner: Ryan · ~2-3 hours · depends on #2**

Sign up 2-3 real contractor accounts, insert 20-30 sample cost records so estimates reflect real pricing instead of generic fallback ranges.

### 3. Rework the estimate flow into a public lead magnet — [#4](https://github.com/Rycrypn/Groundwork-platform/issues/4)
**Owner: Ryan · ~1-2 days · depends on #2**

Let anyone try the estimate tool with zero signup. The full itemized breakdown and contractor matching stay behind a free account — that's the conversion moment.

### 4. Stripe integration — [#5](https://github.com/Rycrypn/Groundwork-platform/issues/5)
**Owner: Sameer · ~1-2 days · independent, runs in parallel**

Real Stripe test-mode products for both subscription tiers plus the one-time estimate unlock, wired to real test keys.

### 5. Job completion + review flow — [#8](https://github.com/Rycrypn/Groundwork-platform/issues/8)
**Owner: either · ~1-2 days · independent, runs in parallel**

What actually makes the data moat real. A "mark job complete" action, a review prompt, and that submission feeds `completed_jobs`, `reviews`, trust score, and `cost_data` all at once.

### 6. Contractor waitlist — [#9](https://github.com/Rycrypn/Groundwork-platform/issues/9)
**Owner: either · ~half a day · no dependencies, start immediately**

A lightweight signup form so contractor recruitment doesn't start from zero on launch day.

### 7. Forgot-password / account recovery — [#10](https://github.com/Rycrypn/Groundwork-platform/issues/10)
**Owner: either · ~2-3 hours · no dependencies, start immediately**

A standard Supabase password reset flow. Small fix, but a real launch blocker — without it, any user who forgets their password is locked out for good.

### 8. Homeowner preference profiling — [#11](https://github.com/Rycrypn/Groundwork-platform/issues/11)
**Owner: either · ~1 day · loosely depends on #8**

Ask 2-3 quick, skippable questions during onboarding — speed vs. quality, lowest price vs. best value — and feed those preferences into contractor matching, weighed against real data (a contractor's actual on-time track record and pricing, not a second self-reported axis).

### 9. Pre-launch hardening — [#6](https://github.com/Rycrypn/Groundwork-platform/issues/6)
**Owner: Both · ~2-3 days · depends on #3 and #4**

Lightweight contractor verification (manual review), email notifications, and a real custom domain.

### 10. Final end-to-end QA + launch checklist — [#7](https://github.com/Rycrypn/Groundwork-platform/issues/7)
**Owner: Both · ~1 day · depends on #5 and #9**

The launch gate. Both of us independently walk the full homeowner and contractor journeys, test failure modes, and only launch once we both agree it's ready.

## How the dependencies fit together

```
#2 (verify AI) ─┬─> #3 (seed data) ─┐
                └─> #4 (lead magnet) ┼─> #6 (hardening) ─> #7 (launch gate)
#5 (Stripe, parallel) ───────────────────────────────────────┘
#8 (review flow, parallel) ───────────────────────────────────┘
#9 (waitlist, parallel — start immediately)
#10 (password reset, parallel — start immediately)
#11 (preferences, parallel — best after #8, can start earlier)
```

## What's deliberately NOT in this plan

These are real, but they don't block launch — they're tracked as follow-ups, not part of getting to a working, launchable product:

- Custom domain is bundled into hardening (#6) since it's cheap, but a delay there doesn't block anything else
- Full admin dashboard (user management, analytics) — a placeholder is fine for now
- Automated contractor license/insurance verification (Checkr-style API) — manual review is fine to start
- Property manager multi-unit flow — a post-launch feature
- Blog content — an SEO play, not a launch blocker
- Dispute resolution workflow — captured as a yes/no flag in #8, not a full process
- Homeowner-side waitlist — not needed, the public estimate flow (#4) already captures homeowner leads
- Phone/email reveal between matched parties — deliberately decided against, in-app chat only, by design
- Two-factor authentication — not needed for launch
- A full personality/style questionnaire for homeowners — 2-3 quick questions is the scope of #11, not an extensive quiz

## Where to track progress

Everything above lives as real GitHub issues, not just this doc — check them off as they close: [github.com/Rycrypn/Groundwork-platform/issues](https://github.com/Rycrypn/Groundwork-platform/issues)
