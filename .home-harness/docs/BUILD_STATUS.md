# Build Status — Last Updated July 7, 2026

## What's Done

### Infrastructure
- [x] Next.js 16.2 app scaffolded (App Router, TypeScript, Tailwind, Turbopack)
- [x] Supabase project created and connected (GroundWork, us-west-2)
- [x] Database schema deployed (migrations 001 + 002)
- [x] Row Level Security enabled on all tables
- [x] Email confirmation disabled (accounts active on signup)
- [x] .env.local configured with Supabase keys
- [x] TypeScript — zero errors across full codebase

### Database Tables
- [x] profiles (extends auth.users)
- [x] contractor_profiles
- [x] contractor_trades
- [x] contractor_pricing
- [x] projects (homeowner job posts)
- [x] matches
- [x] messages
- [x] reviews
- [x] trades (taxonomy — 10 trades seeded)
- [x] trade_questions (pricing interview questions seeded)
- [x] subscription_tiers (Standard + Growth seeded)
- [x] cost_data (empty — fills as jobs complete)
- [x] portfolios (property managers)
- [x] feed_entries (proof-of-work public feed)
- [x] feed_config

### Pages (34 routes)
- [x] Homepage (/, hero + swipe demo + stats + how-it-works + comparison + trust + testimonials)
- [x] /signup
- [x] /login
- [x] /onboarding
- [x] /for-homeowners
- [x] /for-contractors
- [x] /for-property-managers
- [x] /pricing
- [x] /how-it-works
- [x] /about
- [x] /blog (6 placeholder articles)
- [x] /contact (form + FAQ)
- [x] /trust (verification methodology)
- [x] /terms (full 14-section ToS)
- [x] /privacy (11-section policy)
- [x] /homeowner (dashboard)
- [x] /homeowner/estimate
- [x] /homeowner/matches
- [x] /homeowner/chat
- [x] /contractor (dashboard)
- [x] /contractor/profile
- [x] /contractor/chat
- [x] /admin
- [x] /contractors/[id] (public contractor profile)
- [x] /feed/[zip] (public proof-of-work feed)

### Components
- [x] SwipeDemo — interactive drag/swipe cards (mouse + touch)
- [x] HeroMatchState — ZIP density checker with real-time contractor count
- [x] Footer — full site footer with social links
- [x] Wordmark + LogoMark (plumb bob SVG)
- [x] Button component (6 variants)

### Design System
- [x] Charcoal-navy + amber-orange palette (#0C1118, #E8722C)
- [x] Geist font loaded
- [x] Dark hero, light content sections
- [x] Mobile-responsive layout

---

## What's NOT Done Yet

### Needs Anthropic API Key
- [ ] AI estimate generation (agents/estimator.ts)
- [ ] Scope clarification chat
- [ ] AI contractor matching score
- [ ] AI bio generation for contractor profiles
- [ ] Feed copy generation

Add to .env.local: `ANTHROPIC_API_KEY=sk-ant-...`

### Needs Stripe Keys
- [ ] Contractor subscription checkout
- [ ] Estimate unlock payment
- [ ] Webhook handler

Add to .env.local: real Stripe keys from dashboard.stripe.com

### Needs Real Data
- [ ] cost_data table is empty — estimates will fall back to generic ranges until populated
- [ ] No contractor accounts exist — density checker will always show "Coming soon" for all ZIPs

### Not Yet Built
- [ ] Admin dashboard (page exists but is mostly placeholder)
- [ ] Email notifications (match alerts, message notifications)
- [ ] Photo upload for projects (Supabase Storage — schema ready)
- [ ] Contractor verification flow (license check)
- [ ] Review submission flow
- [ ] Property manager multi-unit dashboard
- [ ] Blog — articles are placeholders (no CMS)
- [ ] Mobile app (web-only for now)

---

## To Run Locally

```bash
cd ~/Desktop/renova-platform
npm run dev
# Open http://localhost:3000
```

## To Deploy

```bash
# Not yet configured — add Vercel when ready
vercel --prod
```
