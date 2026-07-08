# Groundwork — Path to Launch

**For:** Ryan + Sameer
**Date:** 2026-07-08
**Tracking:** GitHub Epic [#1](https://github.com/Rycrypn/Groundwork-platform/issues/1) + child issues [#2](https://github.com/Rycrypn/Groundwork-platform/issues/2)–[#7](https://github.com/Rycrypn/Groundwork-platform/issues/7)

## Why this doc exists

The app is fully built — 34 pages, 8 AI agents, a live Supabase database, deployed on Vercel — but it has never been run end-to-end with real data, real payments, or a real stranger using it. This doc explains, in order, everything left before we can call this launched, why it's in that order, and who's doing what.

## Where things actually stand right now (verified today, not assumed)

- **Live site**: https://renova-platform.vercel.app — auto-deploys every time either of us pushes to `main` on GitHub
- **Database**: Supabase is live, schema is fully deployed, security rules (RLS) are on. But the `cost_data` table — the thing that makes estimates accurate — has zero rows in it, and there are no contractor accounts yet
- **AI**: we just added the Anthropic API key today, but nobody has actually confirmed it works on the live site yet
- **The estimate flow has a structural problem**: right now, every "Get my free estimate" button on the homepage sends visitors straight to a signup form before they see a single number. That's backwards — the whole point of a free estimate tool is that it's *free to try*, and gating it behind signup kills the thing that would make people share it
- **Payments**: the Stripe code is scaffolded (checkout logic, webhook handler) but it's wired to fake placeholder keys, so nobody can actually pay for anything yet

None of this is a sign anything is broken — it's just never been turned on for real. This plan turns it on, in the order that avoids wasting time debugging the wrong layer.

## The six steps, in order

### 1. Verify AI integration works live — [#2](https://github.com/Rycrypn/Groundwork-platform/issues/2)
**Owner: Ryan · ~30 min**

Before touching anything else, confirm the Anthropic key we just added actually works when a real request hits the live site. If we skip this and go straight to seeding data or testing flows, and something's broken, we'd waste hours debugging the wrong thing. This is a 30-minute sanity check: submit a real estimate request on the live site, check that Claude actually generated the response (not a generic fallback), and confirm usage shows up in the Anthropic console.

### 2. Seed backend demo data — [#3](https://github.com/Rycrypn/Groundwork-platform/issues/3)
**Owner: Ryan · ~2-3 hours · depends on #2**

Right now there's nothing in the database to demo against. This step: sign up 2-3 real contractor accounts (completing their onboarding so they show up in matching), and manually insert 20-30 sample cost records into Supabase so estimates stop returning generic fallback ranges and start reflecting real pricing data for a few trades and ZIP codes. After this, the app has something real to show instead of empty states everywhere.

### 3. Rework the estimate flow into a public lead magnet — [#4](https://github.com/Rycrypn/Groundwork-platform/issues/4)
**Owner: Ryan · ~1-2 days · depends on #2**

This is the most important product change on this list, not just a bug fix. The idea (borrowed from how a comparable AI startup grew to $3M ARR in 5 months): let anyone try the estimate tool with zero signup — they type a project description and ZIP, get a real price range instantly. The *full* itemized breakdown and contractor matching stay behind a free account — that's the moment they convert. This mirrors what converts well in practice: free tools that require only an email to unlock full results convert roughly half of tries into signups, versus a few percent for a direct "sign up to get a demo" pitch. Concretely: new public route for the estimate, homepage buttons point there instead of straight to `/signup`, and when someone does sign up to see the full breakdown, their project carries over so they don't retype it.

### 4. Stripe integration — [#5](https://github.com/Rycrypn/Groundwork-platform/issues/5)
**Owner: Sameer · ~1-2 days · independent, runs in parallel**

This doesn't depend on anything above, which is why it's Sameer's track — no need to wait on the AI/data work. Create real Stripe test-mode products (Standard $79/mo, Growth $149/mo contractor subscriptions, plus the one-time estimate-unlock payment), wire the real test keys in, and confirm checkout actually works and updates the database correctly when a payment succeeds.

### 5. Pre-launch hardening — [#6](https://github.com/Rycrypn/Groundwork-platform/issues/6)
**Owner: Both · ~2-3 days · depends on #3 and #4**

The polish layer, once the core paths work. A lightweight contractor verification step (manual admin review is fine for launch — no need for a third-party verification API yet). Email notifications so homeowners and contractors actually know when they've matched. A real custom domain instead of the free vercel.app one.

### 6. Final end-to-end QA + launch checklist — [#7](https://github.com/Rycrypn/Groundwork-platform/issues/7)
**Owner: Both · ~1 day · depends on #5 and #6**

The launch gate. Both of us independently walk the full homeowner journey and the full contractor journey on the live site, test what happens when things go wrong (bad ZIP, declined card, empty inputs), and only launch once we both agree it's ready. Closing this issue *is* the launch decision.

## How the dependencies fit together

```
#2 (verify AI) ─┬─> #3 (seed data) ─┐
                └─> #4 (lead magnet) ┼─> #6 (hardening) ─> #7 (launch gate)
#5 (Stripe, parallel) ───────────────────────────────────────┘
```

## What's deliberately NOT in this plan

These are real, but they don't block launch — they're tracked as follow-ups, not part of getting to a working, launchable product:

- Custom domain is bundled into hardening (#6) since it's cheap, but a delay there doesn't block anything else
- Full admin dashboard (user management, analytics) — a placeholder is fine for now
- Automated contractor license/insurance verification (Checkr-style API) — manual review is fine to start
- Property manager multi-unit flow — a post-launch feature
- Blog content — an SEO play, not a launch blocker

## Where to track progress

Everything above lives as real GitHub issues, not just this doc — check them off as they close: [github.com/Rycrypn/Groundwork-platform/issues](https://github.com/Rycrypn/Groundwork-platform/issues)
