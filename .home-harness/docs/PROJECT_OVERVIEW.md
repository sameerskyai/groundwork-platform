# Groundwork — Project Overview

**What it is:** A two-sided marketplace that helps homeowners get real cost estimates and match with vetted contractors. Built for homeowners, not contractors.

**Core insight:** Homeowners get ripped off because they have no pricing data going into contractor conversations. Groundwork fixes the information gap — give them a real estimate first, then let them match with a contractor who actually fits their budget.

**The match mechanic:** Homeowners swipe through contractor cards (Tinder-style). Interested = contractor sees the project. Pass = next. Contractors never cold-call or spam. Homeowners stay in control.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16.2 (App Router, Turbopack), TypeScript, Tailwind |
| Backend / DB | Supabase (PostgreSQL, Auth, RLS, Storage) |
| AI | Anthropic Claude API — 8 agents |
| Payments | Stripe (subscriptions + one-time) |
| Hosting | Vercel (when deployed) |

---

## Three User Types

1. **Homeowners** — Get a free AI estimate, swipe to match with contractors, message through the app
2. **Contractors** — Subscription-based access to job requests in their area (Standard $79/mo = 5/day, Growth $149/mo = 20/day)
3. **Property Managers** — Portfolio management across multiple units

---

## AI Agents (8 total)

1. **Estimator** — Classifies project type, pulls ZIP-level cost data, generates estimate range
2. **Scope Clarifier** — Asks follow-up questions to sharpen the project description
3. **Matcher** — Scores contractor/project fit using trade, location, pricing, and availability
4. **Bio Writer** — Generates contractor bio from their interview answers
5. **Feed Writer** — Creates copy for the public proof-of-work feed entries
6. **Review Summarizer** — Summarizes contractor reviews into key themes
7. **Project Classifier** — Tags project type and scope from homeowner description
8. **Chat Moderator** — Flags inappropriate messages before delivery

---

## Business Model

**Homeowners:** Free estimate, free matching. Pay only to unlock detailed AI breakdown ($X one-time).

**Contractors:** Flat monthly subscription. No per-job cut. No lead fees.
- Standard: $79/mo — up to 5 job requests/day
- Growth: $149/mo — up to 20 job requests/day, priority placement, featured badge

**Property Managers:** Unit-based pricing (TBD).

**Moat:** Cost data. Every completed job adds a real data point — ZIP, trade, final price, days to complete. The more jobs completed, the more accurate estimates become. No competitor can replicate this without time.
