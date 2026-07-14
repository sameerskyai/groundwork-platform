# Architecture Document

## System Overview

```
┌─────────────────────────────────────────────────────┐
│          Next.js Frontend (Vercel)                  │
│  ├─ /homeowner/estimate   — Describe project        │
│  ├─ /homeowner/matches    — See contractor matches  │
│  ├─ /contractor/profile   — Business info           │
│  ├─ /contractor/feed      — Contractor leads        │
│  └─ /admin                — Metrics (stub)          │
└──────────────┬────────────────────────────────────┬─┘
               │ HTTPS                              │
        ┌──────▼──────────────────┬────────────────┴──┐
        │                         │                   │
     ┌──▼──────────┐      ┌──────▼─────────┐   ┌──────▼───────┐
     │ Supabase    │      │ Claude AI      │   │ Stripe       │
     │ PostgreSQL  │      │ API            │   │ Payments     │
     │ + RLS       │      │                │   │              │
     │             │      │ ├─ Estimate    │   └──────────────┘
     │ ├─ profiles │      │ ├─ Matching    │
     │ ├─ projects │      │ ├─ Chat        │
     │ ├─ matches  │      │ └─ Filtering   │
     │ └─ messages │      └────────────────┘
     └─────────────┘
```

## Request Flows

### 1. Homeowner Get Estimate

```
POST /homeowner/estimate
│
├─ Form: { description, zip, photos }
├─ Auth: Supabase client (RLS protected)
│
└─ POST /api/estimate
   ├─ Save project to projects table
   ├─ Call Claude estimate-agent
   │  ├─ Parse: project type, scope, labor, materials
   │  └─ Return: cost estimate + line items
   ├─ Respond: { estimate, projectId }
   │
   └─ User sees: $X – $Y breakdown + "Find Contractors" CTA
```

### 2. Homeowner Get Matches

```
POST /homeowner/matches?project={projectId}
│
├─ Button: "Find my matches"
├─ Auth: Supabase client
│
└─ POST /api/match
   ├─ Server auth: Get current user + project ownership
   ├─ Load user subscription tier
   ├─ Call Claude match-scorer AI agent for all contractors
   │  ├─ Input: project data + contractor profiles
   │  ├─ Algorithm: 80%+ compatibility threshold
   │  └─ Output: matches with scores + reasoning
   ├─ Apply free-tier limits (MAX_ACTIVE_MATCHES=1)
   ├─ Store matches in database
   └─ Return: { matches, matches_locked_count, user_tier }
      │
      └─ UI renders:
         ├─ 1 match (if free tier)
         └─ LockedMatchesCTA: "X more contractors unlocked with Homeowner+"
```

### 3. Chat Message (With Filtering)

```
POST /api/chat
│
├─ Body: { matchId, message }
├─ Auth check: User in match
├─ Validate: Message 1-500 chars
│
└─ Call message-filter.ts
   ├─ Check: Profanity list
   ├─ Check: Spam patterns
   ├─ Check: Rate limit (30 msg/hour per match)
   │
   ├─ PASS: Store + return message
   └─ FAIL: Return 400 + violation reason
```

### 4. Auto-Expire Matches (Background Job)

```
Cron trigger (daily)
│
└─ POST /api/jobs/expire-matches  [Vercel Cron endpoint]
   │
   ├─ Query: matches where created_at < NOW - 72h
   ├─ Filter: Status not already 'expired'
   │
   └─ For each match:
      ├─ shouldExpireMatch(created_at) → true
      └─ Update status='expired'
         │
         └─ Homeowner sees: "This match expired"
```

## Data Model (Simplified)

```sql
-- Users
profiles {
  id (UUID)
  email
  subscription_tier: 'free' | 'paid_unlimited' | 'homeowner+' | '$10_referral'
  created_at
}

-- Projects
projects {
  id (UUID)
  user_id (FK→profiles)
  description
  zip_code
  photo_urls[]
  estimate_json
  created_at
}

-- Matches
matches {
  id (UUID)
  project_id (FK→projects)
  contractor_id (FK→contractor_profiles)
  match_score (0-100)
  match_reasoning
  status: 'pending' | 'contractor_review' | 'matched' | 'expired'
  created_at
  expires_at: created_at + 72h
}

-- Messages
messages {
  id (UUID)
  match_id (FK→matches)
  sender_id (FK→profiles)
  body
  filtered (bool)
  violation_type? ('profanity' | 'spam' | 'rate_limit')
  created_at
}

-- Waitlist
waitlist {
  id (UUID)
  email
  name
  joined_at
}
```

## Auth & RLS

All routes protected by Supabase RLS policies:

```sql
-- profiles: Users can read all (public profiles), write own
-- projects: Users can read/write own (where user_id = auth.uid())
-- matches: Users can read/write involved matches (join with projects + contractor_profiles)
-- messages: Users can read/write in their matches
```

**Server-only operations:** Use SUPABASE_SERVICE_ROLE_KEY
- Estimate API route (trusted, bypasses RLS)
- Matching algorithm (needs contractor access)
- Expiry job (background, full access)

## Design System

### Tokens (Design → CSS)
```
color-brand: oklch(58% 0.25 265)     [Deep purple-blue]
color-surface-primary: oklch(98% 0)  [Off-white]
color-text-primary: oklch(18% 0)     [Near-black]
text-lg: clamp(1.125rem, 0.92rem + 0.4vw, 1.25rem)
space-lg: clamp(1.5rem, 1rem + 2.5vw, 2.5rem)
```

### Component Hierarchy
```
Button (primary, secondary, tertiary, ghost)
  ├─ LockedMatchesCTA (upsell for matches)
  ├─ Modal (dialogs)
  └─ Toast (notifications)

Card (default, accent variants)
  ├─ Match card
  └─ Contractor profile card

Form inputs (Input, Textarea, Select)
  ├─ Estimate form
  └─ Profile form

Feedback (EmptyState, Skeleton, Avatar)
```

## Testing Strategy

**71 tests organized by module:**

| Module | Tests | Coverage |
|--------|-------|----------|
| Match limits | 8 | Free-tier boundaries |
| Geo (distance) | 10 | Haversine math |
| Utils | 15 | Formatting |
| Expiry job | 13 | 72h boundary + filtering |
| Message filter | 16 | Safety checks |
| Trivial | 3 | Sanity |
| Demo isolation | (excluded) | RLS verification |

**Test strategy:** TDD → write tests first, then implement

## Security

**Threats mitigated:**

| Threat | Mitigation |
|--------|-----------|
| SQL Injection | Supabase ORM + RLS |
| XSS | React escaping + message filter |
| CSRF | Supabase session + API routes |
| Unauthorized access | RLS policies + ownership checks |
| Brute force | (TODO: rate limiting) |
| Data leak | RLS, no sensitive data in responses |

See `SECURITY_AUDIT_PREP.md` for full audit.

## Deployment Pipeline

```
1. Developer pushes to main branch
2. GitHub triggers Vercel build
3. Next.js static + dynamic rendering
4. TypeScript check passes (0 errors)
5. All tests pass (71/71)
6. Production deployment
7. Vercel Cron runs expiry job daily
```

## Monitoring (TODO)

- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Database monitoring (Supabase monitoring)
- [ ] API rate limiting (Upstash Redis)
- [ ] Log aggregation (Vercel Logs)

---

**Last Updated:** 2026-07-14 (T12)  
**Maintained by:** Autonomous overnight work
