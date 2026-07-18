# Database Schema

Supabase (PostgreSQL). All tables have RLS enabled.
Migrations: `supabase/migrations/001_initial.sql` + `002_feed.sql`

---

## Core Tables

### profiles
Extends `auth.users`. One row per user.
```
id            UUID (FK → auth.users)
role          TEXT — 'homeowner' | 'property_manager' | 'contractor'
full_name     TEXT
email         TEXT
phone         TEXT
zip_code      TEXT
lat / lng     DECIMAL
onboarding_complete  BOOLEAN
```

### projects
A homeowner's job post.
```
id            UUID
user_id       UUID (FK → profiles)
description   TEXT
trade_id      UUID (FK → trades)
zip_code      TEXT
budget_min/max DECIMAL
photo_urls    TEXT[]
ai_estimate_low/high  DECIMAL  ← filled by AI estimator
ai_reasoning  TEXT
estimate_paid BOOLEAN          ← true after Stripe payment
status        TEXT — 'active' | 'matched' | 'completed' | 'cancelled'
```

### contractor_profiles
One per contractor user.
```
id                    UUID
user_id               UUID (FK → profiles)
business_name         TEXT
bio                   TEXT    ← AI-generated
license_verified      BOOLEAN
insured / bonded      BOOLEAN
service_radius_miles  INTEGER (default 25)
rating                DECIMAL
subscription_tier     TEXT — 'standard' | 'growth'
subscription_active   BOOLEAN
daily_leads_used      INTEGER
```

### matches
Join table between a project and a contractor.
```
id                    UUID
project_id            UUID (FK → projects)
contractor_id         UUID (FK → contractor_profiles)
homeowner_swiped_at   TIMESTAMPTZ  ← homeowner shows interest
contractor_swiped_at  TIMESTAMPTZ  ← contractor accepts
matched_at            TIMESTAMPTZ  ← both confirmed = chat unlocks
status                TEXT — 'pending' | 'contractor_review' | 'matched' | 'declined' | 'expired'
match_score           DECIMAL      ← AI-generated 0–1
```

### messages
Chat messages, tied to a confirmed match.
```
id        UUID
match_id  UUID (FK → matches)
sender_id UUID (FK → profiles)
content   TEXT
read_at   TIMESTAMPTZ
```

### reviews
Post-job review from homeowner to contractor.
```
match_id      UUID (unique — one review per match)
contractor_id UUID
reviewer_id   UUID
rating        INTEGER (1–5)
final_price   DECIMAL  ← goes into cost_data
```

---

## Config Tables (change behavior without code deploys)

### trades
10 seeded: General Contractor, HVAC, Plumbing, Electrical, Roofing, Flooring, Painting, Landscaping, Windows & Doors, Handyman

### trade_questions
Interview questions shown to contractors during onboarding (4 per trade)

### subscription_tiers
Standard ($79/mo, 5/day) and Growth ($149/mo, 20/day) — seeded

### cost_data
Real job cost records. Populated as jobs complete. Powers AI estimates.
```
project_type  TEXT
zip_code      TEXT
cost_low/high DECIMAL
unit          TEXT — 'per sqft' | 'per unit' | 'flat'
source        TEXT — 'renova_job' | 'contractor_interview' | 'completed_match'
```

---

## Feed Tables

### feed_entries
One per completed + verified project. Powers the public ZIP-level proof-of-work feed.
Privacy rules: neighborhood label always shown, street only if homeowner opted in.

### feed_config
Single-row config: min jobs per ZIP (default 3), fallback radius (default 10 miles).

---

## RLS Policies Summary

| Table | Policy |
|-------|--------|
| profiles | Users see and edit only their own row |
| contractor_profiles | Public read, owner write |
| projects | Owner full access |
| matches | Both parties (homeowner + contractor) can read |
| messages | Match participants only |
| feed_entries | Public read (published=true only), service role write |
