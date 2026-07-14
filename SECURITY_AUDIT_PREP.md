# Security Audit Preparation

**Status:** Pre-audit checklist — documents all API routes, auth patterns, and identified gaps  
**Last Updated:** 2026-07-14  
**Scope:** All server-side endpoints and external-facing routes

---

## API Routes Inventory

### Public/Unauthenticated Routes

| Route | Method | Auth | Input Validation | Status |
|-------|--------|------|------------------|--------|
| POST /api/waitlist | POST | None | Email regex, name trim | ✅ Implemented T8 |
| POST /api/interview | POST | None | Supabase parsing | ⚠️ Review |
| POST /api/estimate | POST | Optional (user) | Description, ZIP code | ⚠️ Review |
| POST /api/density | POST | None | Coordinates | ⚠️ Review |
| GET /api/stripe/webhook | POST | Webhook signature | Stripe signature verify | ⚠️ Needs verification |

### Authenticated Routes (User)

| Route | Method | Auth Check | Ownership Check | Input Validation |
|-------|--------|-----------|-----------------|-------------------|
| GET/POST /api/projects | GET/POST | Required | User owns project | Partial |
| POST /api/projects/[id]/score | POST | Required | Project user match | ✅ Yes |
| POST /api/projects/[id]/candidates | POST | Required | Project user | ✅ Yes |
| POST /api/match | POST | Required | User matches project | ✅ Yes |
| POST /api/matches/complete | POST | Required | User owns match | ✅ Yes |
| POST /api/swipes | POST | Required | User owns match | ✅ Yes |
| GET /api/feed | GET | Required | User ZIP filter | ⚠️ SQL injection risk |
| POST /api/chat | POST | Required | User in match | ⚠️ Review message filter |
| GET/POST /api/homeowner/communities | GET/POST | Required | User role verify | ⚠️ Role check needed |
| POST /api/homeowner/preferences | POST | Required | User preferences | ✅ Yes |

### Contractor Routes

| Route | Method | Auth | Ownership Check |
|-------|--------|------|-----------------|
| GET /api/contractors/[id]/feed | GET | Required | Contractor owns profile |
| GET /api/communities/[id]/posts/[postId]/comments | GET | Optional | Public/private check |
| POST /api/communities/[id]/posts/[postId]/comments | POST | Required | User can comment |

### Admin Routes

| Route | Method | Auth | Admin Check | Risk |
|-------|--------|------|-------------|------|
| GET /api/admin | GET | Required | Admin role | 🔴 HIGH |

### Webhook Routes

| Route | Method | Auth | Signature Check |
|-------|--------|------|-----------------|
| POST /api/stripe/webhook | POST | Webhook key | ✅ Required |

---

## Authentication Patterns Found

### ✅ Correct Pattern
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return unauthorized()
```

### ⚠️ Gaps Identified
1. **No explicit admin role check** — admin endpoint doesn't verify role
2. **No rate limiting** — API endpoints have no rate limit enforcement
3. **Error messages leak info** — Some endpoints return "user not found" vs "unauthorized"

---

## Input Validation Audit

### Critical (SQL Injection Risk)

**File:** `app/api/feed/route.ts` — Line 211+
```typescript
// RISK: User zip_code directly in query
const feed = await query with .eq('zip_code', zipCode)
```
**Status:** Supabase uses parameterized queries (safe), but need verification

---

### High Priority

**File:** `app/api/projects/route.ts`
- POST payload: `{ description, zip_code, photo_urls }`
- **Gap:** No max length enforcement on description
- **Gap:** No file count/size validation on photo_urls

**File:** `app/api/estimate/route.ts`
- Receives: `{ description, photoUrls, zipCode, projectId }`
- **Gap:** No character limits
- **Gap:** No image file type validation

---

### Medium Priority

**File:** `app/api/match/route.ts`
- Receives: `{ projectId }`
- **Issue:** No validation that project exists before matching

**File:** `app/api/chat/route.ts`
- Receives message text
- **Status:** Runs through message-filter.ts (checks for profanity, spam)
- **Gap:** No rate limiting (could spam messages)
- **Gap:** No XSS protection on display

---

## Secrets & Environment Variables

### Required at Startup
- `NEXT_PUBLIC_SUPABASE_URL` — public, can be exposed
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, cannot contain secrets
- `SUPABASE_SERVICE_ROLE_KEY` — PRIVATE, used in server-only routes

### Current Usage
- ✅ Service role key used in server routes only (`lib/supabase/server.ts`)
- ✅ Anon key used in client routes only (`lib/supabase/client.ts`)
- ⚠️ No verification that secrets are loaded at startup

### Missing
- Rate limiting API keys (if third-party rate limiting service used)
- Webhook signing keys (Stripe, etc.)
- Analytics/monitoring secrets

---

## Data Sensitivity Map

| Data | Route | Risk | Mitigation |
|------|-------|------|-----------|
| User email | POST /api/waitlist | Low | Deduped, consent required |
| User phone (if added) | Multiple | HIGH | Should encrypt at rest |
| Contractor info | GET /api/contractors/[id] | Medium | Public profile, verify access |
| Match scores | GET /api/projects/[id]/score | Medium | User can only see own projects |
| Messages | POST /api/chat | Medium | Filtered for profanity |
| Photos | POST /api/projects | HIGH | No virus scanning |
| Payment info | POST /api/stripe | HIGH | Delegated to Stripe (good) |

---

## OWASP Top 10 Gaps

### 🔴 A1: Broken Access Control
- **Gap:** No admin role verification on `/api/admin`
- **Gap:** No ownership check on contractor feed (`/api/contractors/[id]/feed`)
- **Fix:** Add `.eq('user_id', userId)` to all data queries

### 🟡 A2: Cryptographic Failures
- **Status:** Supabase RLS policies should handle this
- **Gap:** Need to verify RLS policies are enabled in production

### 🟡 A3: Injection
- **Gap:** `app/api/feed/route.ts` — ZIP code filtering (low risk due to Supabase parameterization)
- **Status:** No raw SQL, all through ORM (safe)

### 🔴 A4: Insecure Design
- **Gap:** No rate limiting on authentication endpoints
- **Gap:** No brute-force protection
- **Fix:** Implement rate limiting (e.g., 5 requests/minute per IP)

### 🔴 A5: Security Misconfiguration
- **Gap:** Webhook signature verification needed for Stripe
- **Gap:** No CORS restrictions verified
- **Gap:** No security headers checked (CSP, X-Frame-Options, etc.)

### 🟡 A6: Vulnerable Components
- **Status:** Dependencies in package.json should be audited
- **Action:** Run `npm audit` regularly

### 🔴 A7: Authentication Failures
- **Gap:** No rate limiting on login endpoints (if any)
- **Gap:** No session timeout enforcement
- **Fix:** Verify Supabase session settings

### 🟡 A8: Software & Data Integrity
- **Status:** Using npm packages from public registry (medium risk)
- **Action:** Lock dependency versions in package-lock.json ✅

### 🔴 A9: Logging & Monitoring
- **Gap:** No centralized logging for security events
- **Gap:** No alerting on suspicious activity
- **Fix:** Add logging to auth failures, permission denials

### 🟡 A10: SSRF/XXE
- **Status:** No file uploads beyond photos
- **Gap:** No virus scanning on uploaded files
- **Fix:** Consider integrating ClamAV or similar

---

## RLS (Row Level Security) Audit

### Configured Policies (Verified)
- ✅ `profiles` table: Users can read all (contractor bios), write own
- ✅ `projects` table: Users can read own, write own
- ✅ `matches` table: Users can read involved matches

### Missing Policies
- ⚠️ `waitlist` table: Newly created, verify RLS enabled
- ⚠️ `messages` table: Verify only match participants can read

### TODO: Production Verification
```sql
-- Check all tables have RLS enabled
SELECT tablename FROM pg_tables WHERE schemaname='public';
SELECT table_name, (row_security_enforced(table_schema, table_name)) as rls_enabled
FROM information_schema.tables WHERE table_schema='public';
```

---

## Rate Limiting Audit

### Current Status
- ❌ No rate limiting implemented
- ❌ No per-IP request throttling
- ❌ No per-user request throttling

### Recommended Limits
| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/waitlist | 1 | Per hour per email |
| POST /api/estimate | 5 | Per hour per user |
| POST /api/match | 10 | Per hour per project |
| POST /api/chat | 30 | Per hour per match |
| POST /api/projects | 20 | Per day per user |

### Implementation Options
1. **Supabase:** Use RLS + `created_at` timestamps to prevent rapid duplicates
2. **Middleware:** Add Next.js middleware to check rate limit headers
3. **Third-party:** Upstash Redis (free tier available)

---

## TCPA & Compliance

### Current
- ✅ Waitlist form includes TCPA checkbox
- ✅ Privacy link in footer
- ⚠️ Terms of Service link in footer

### TODO
- [ ] Verify TCPA consent is stored with signup
- [ ] Add unsubscribe link in email templates
- [ ] Document retention policy (delete after 90 days?)
- [ ] GDPR: Add data export endpoint
- [ ] GDPR: Add data deletion endpoint

---

## Audit Checklist Before Production

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Enable RLS on all Supabase tables
- [ ] Verify Stripe webhook signature validation
- [ ] Add rate limiting middleware
- [ ] Audit all environment variables are loaded
- [ ] Verify CORS settings
- [ ] Add security headers (CSP, HSTS, etc.)
- [ ] Test admin endpoint permission check
- [ ] Verify all user queries have ownership checks
- [ ] Test message filtering on XSS payloads
- [ ] Enable request logging
- [ ] Set up monitoring/alerting

---

## Next Steps

1. **Immediate (Blockers):** Admin auth check, rate limiting setup
2. **Short-term:** RLS verification, webhook signature check
3. **Long-term:** Data retention policy, GDPR endpoints, centralized logging

---

**Prepared by:** Autonomous Overnight Work (T9)  
**For:** Security audit before phase 1 production launch
