# Groundwork.AI — AI-Powered Contractor Matching Platform

**Status:** MVP Complete (T1-T11 autonomous work, 2026-07-14)  
**Build:** PASS | **Tests:** 71/71 PASS | **Coverage:** 80%+

---

## What is Groundwork?

AI-powered matching platform connecting homeowners with vetted, local contractors.

### Key Features

- **AI Estimate:** Describe project → get cost breakdown in 30 seconds
- **Smart Matching:** 80%+ compatibility algorithm
- **Free Tier:** Unlimited estimates, 1 active match, 3 daily reveals
- **Paid:** $20/mo Homeowner+ (unlimited matches) | $49/mo Contractor (unlimited leads)
- **Safety:** Message filtering, TCPA consent, contractor verification
- **Auto-Expiry:** Matches expire after 72 hours

---

## Tech Stack

- **Frontend:** Next.js 16 + Tailwind CSS + shadcn/ui derivatives
- **Backend:** Supabase (PostgreSQL + RLS) + Node.js
- **AI:** Claude 3.5 Sonnet (matching, estimates, chat)
- **Testing:** Vitest (71 tests, 80%+ coverage)
- **Deployment:** Vercel (Next.js + Cron)

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected routes
│   │   ├── homeowner/        # Estimate, matches, chat
│   │   ├── contractor/       # Profile, feed, messages
│   │   └── admin/            # Admin metrics (stub)
│   ├── api/                  # 21 endpoints
│   ├── waitlist/             # Public signup
│   ├── pages/                # Static marketing
│   └── styles/
│       └── design-tokens.css # Modern Premium design system
├── components/ui/            # 15+ reusable components
├── lib/
│   ├── agents/               # Claude AI agents
│   ├── jobs/                 # Background jobs (expiry)
│   ├── config/               # Free-tier limits
│   └── supabase/             # DB clients
└── __tests__/                # 71 tests
```

---

## Key Decisions

### Free-Tier Matching Limits (T4)
- `MAX_ACTIVE_MATCHES=1` (default, env-overridable)
- Server-side enforced at `/api/projects/[id]/score`
- API metadata: `matches_locked_count`, `limit_reached`
- UI: LockedMatchesCTA component for upsell

### Design System (Modern Premium)
- Color: Deep purple-blue brand `oklch(58% 0.25 265)`
- Type: Crimson Text serif, system sans
- All styles in CSS variables → design direction swappable with CSS-only changes

### Match Expiry Job (T11)
- Runs via Vercel Cron (or background scheduler)
- Logic: Expire matches ≥72 hours old
- Status: Fully tested (13 boundary tests), ready for production

---

## Running Locally

```bash
# Setup
git clone <repo>
npm install
cp .env.example .env.local  # Fill in Supabase + Anthropic keys

# Development
npm run dev              # http://localhost:3000
npm test                # 71/71 tests
npm run build           # Production build

# Type checking
npm run lint            # ESLint
pnpm tsc --noEmit       # TypeScript
```

---

## API Routes (21 Total)

**Public:** `/api/waitlist`, `/api/estimate`, `/api/density`, `/api/stripe/webhook`  
**Auth Required:** `/api/projects`, `/api/match`, `/api/chat`, `/api/homeowner/*`, `/api/contractors/*`  
**Admin:** `/api/admin` (stub, needs role check)

See `SECURITY_AUDIT_PREP.md` for full audit.

---

## Testing

**71 tests** across 7 test files:
- **Match limits:** Free-tier boundary tests
- **Geo:** Haversine distance + nearest cost lookup
- **Utils:** Currency/range formatting
- **Expiry:** 72h job with mocked time
- **Message filter:** Profanity, spam detection
- **Demo isolation:** RLS policy verification

Run: `npm test` — All pass (0 failures)

---

## Known Issues

- [ ] Admin endpoint missing role check (HIGH)
- [ ] No rate limiting (HIGH)
- [ ] Waitlist table schema not migrated
- [ ] Video asset missing (`/public/videos/groundwork-intro.mp4`)

See `SECURITY_AUDIT_PREP.md` for complete security checklist.

---

## Deployment

```bash
git push origin main  # Auto-deploys to Vercel
```

**Environment variables required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`

---

**Last Updated:** 2026-07-14  
**Commits:** T1-T11 (11 major tasks, 0 failures)  
**Next:** T12 Documentation, T13 Admin Dashboard
