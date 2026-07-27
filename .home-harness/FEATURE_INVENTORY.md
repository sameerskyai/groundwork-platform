# Laywork — Feature Inventory

**Audited**: 2026-07-27, against actual code and the migration schema (001–038). Not from docs, not from marketing copy.
**Method**: schema first (a feature whose table does not exist is NOT BUILT regardless of UI), then the route/component, then whether it reads/writes real data.
**Status vocabulary** (§22): BUILT AND WORKING · BUILT BUT BROKEN · PARTIAL · NOT BUILT. No percentages.

---

## ⚠️ SECURITY FINDINGS (found during this audit, not previously known)

### 1. `properties` SELECT policy leaks every real property — LATENT, activates on first real user

`supabase/migrations/020_properties_foundation.sql:31-33`:

```sql
CREATE POLICY "properties_own_access" ON properties
  FOR SELECT
  USING (owner_id = auth.uid() OR is_demo = false);
```

`OR is_demo = false` grants **every caller** read access to every non-demo property row, including `street_address`, `city`, and `state`. Verified live: anon currently reads 0 rows **only because the table holds exactly one row and it is a demo row**. The first genuine homeowner property makes street addresses world-readable. The same `OR is_demo = false` pattern is at `021:31-33` for `saved_contractors`.

This is more severe than the migration-038 concern that prompted the P0 check, because it is unfixed. It contradicts the product rule "No address sharing anywhere in-product; ZIP/general-area only" (PRODUCT.md, BUSINESS_MODEL.md).

**Fix** (non-destructive, drop-and-recreate in one statement pair):
```sql
DROP POLICY IF EXISTS "properties_own_access" ON properties;
CREATE POLICY "properties_own_access" ON properties
  FOR SELECT USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "saved_contractors_own_access" ON saved_contractors;
CREATE POLICY "saved_contractors_own_access" ON saved_contractors
  FOR SELECT USING (user_id = auth.uid());
```

### 2. `properties` has no INSERT policy at all
`020:30-38` creates SELECT and UPDATE only. Homeowner onboarding inserts at `app/(auth)/onboarding/page.tsx:127` **without checking the error**, so the write fails silently and `/homeowner/communities` later throws "No ZIP code found. Complete onboarding first." A user-visible break with a silent root cause.

### 3. `reviews` has RLS enabled and zero permissive policies
`001_initial.sql:264` enables RLS; migrations `012:85`, `018:59,65`, `019:47` add only `AS RESTRICTIVE` policies, which narrow but never grant. With RLS on and no PERMISSIVE policy, Postgres denies every row. Writes work (service role bypasses RLS) but **no user can ever read a review**.

---

## Feature status

| Feature | Status | Evidence | To build / to fix |
|---|---|---|---|
| Contractor matching | **BUILT BUT BROKEN** | Two parallel paths, both fail. `app/api/match/route.ts:29` joins `profiles(zip_code,lat,lng)`, but `profiles` RLS (`001:287`) is owner-only, so the join nulls for every other user and the filter at `:38` drops 100% of contractors. Migration `006` documents this exact bug and moved location to `contractor_profiles`; `/api/match` was never updated. The correct path `app/api/projects/[id]/candidates/route.ts:40-70` bails at `:64` when `project.lat` is null, and the live estimate flow inserts projects without lat/lng (`estimate/page.tsx:90`). | Point `/api/match` at `contractor_profiles.lat/lng`; geocode on project insert; delete one of the two paths. |
| 80% compatibility gate | **BUILT BUT BROKEN** | Three thresholds on two numeric scales. `projects/[id]/score/route.ts:94` enforces ≥80 (0–100) but never persists the score and reads the nonexistent `homeowner_preferences` at `:37`. `match-scorer.ts:127` uses ≥80. `match-ranker-agent.ts:48` returns 0–1, written to `matches.match_score DECIMAL(4,3)`. UI gate `matches/page.tsx:67` filters `.gte(0.8)` — right scale, fed by the broken route. | Pick one scale, persist scores, create `homeowner_preferences`, delete the dead scorer. |
| ZIP / service-area logic | **BUILT AND WORKING** | `lib/geo.ts:3-29` haversine + `zipToLatLng`; `api/density/route.ts:5-30`; radius filter `candidates/route.ts:67` against `service_radius_miles`; feed bbox `api/feed/route.ts:68-80`. | Unbounded dependency on zippopotam.us, no caching or rate-limit handling. |
| AI estimator | **PARTIAL** | Works end to end: `api/estimate/route.ts:18-77` → `lib/agents/estimate-agent.ts:43-115` (Claude, vision when photos present) → writes `projects.ai_*` and appends `cost_data`. But **nothing ever writes the `estimates` table** (`003:18`) — one read only, `homeowner/page.tsx:116` — so the dashboard estimate tile is permanently blank. Paywall is a hardcoded `fullBreakdown: null` (`:96`). | Write `estimates` rows; wire `estimates.paid` to the existing Stripe route. |
| Project budget fields | **BUILT AND WORKING** | `projects.budget_min/max` (`001:176`), written `budget/page.tsx:75-80`, read by both scorers. Minor defect: `:78` sets min = max from one input, collapsing the range. | — |
| Budgeting tools | **NOT BUILT** | Single-number capture only. No spend tracking, line items, variance, or actuals. | `budget_line_items` + `budget_events` tables, owner RLS, dashboard view. No third party. |
| Communities | **PARTIAL** | List page real (`communities/page.tsx:60-107`). **Detail page broken**: `communities/[id]/page.tsx:52-70` selects `member_count`, `post_count`, and a `posts(...)` relation that do not exist; `:94` inserts into a nonexistent `posts` table. Always renders "Failed to load community". | Rewrite the detail page against `community_posts` + `community_comments`. No new tables. |
| Community membership | **BUILT AND WORKING** | `community_members` (`005:21`), auto-join `communities/page.tsx:90-97`, RLS recursion fixed by `037`. Dead code: `lib/communities.ts:96-160` never called. | — |
| Contractor profiles | **BUILT BUT BROKEN (public view)** | Data + owner edit real. SSR page `contractors/[id]` works. **Client page `contractor/[id]/page.tsx:67` crashes**: joins `profiles(...)` (RLS-nulled for non-owners) then dereferences `.profiles.avatar_url` at `:253`. `:90` calls `.single()` on `matches` filtered only by contractor_id, erroring whenever >1 row. | Move `full_name`/`avatar_url` to `contractor_profiles` or add a public-read view; optional-chain. |
| Homeowner profiles | **PARTIAL** | `profiles` columns exist, written only at onboarding (`onboarding/page.tsx:118-131`). No view or edit route exists. `avatar_url` read in 4 places, never written. | `/homeowner/profile` route; avatars need a storage bucket + per-user-folder RLS. |
| Profile badges (verified/licensed/insured) | **PARTIAL** | Columns real (`001:105-108`), rendered from DB at `contractors/[id]:84-99`. **Two defects**: `contractor/[id]:289` renders "Verified" **unconditionally, hardcoded**; `license_verified` is never set or read anywhere, so the licensing claim has no verification pipeline. Contractor onboarding never collects license or insurance. | Capture license/insurance at onboarding; `license_verifications` table + docs bucket (owner-only RLS); state-board API or admin review queue. |
| Photo upload + storage | **PARTIAL** | Columns exist (`projects.photo_urls`, `community_posts.photo_urls`); upload code at `estimate/page.tsx:37-50` and `chat/page.tsx:235` targets a `project-photos` bucket. **No bucket is configured anywhere in the repo**, and `:46` swallows the error with no else branch, so failure is silent. | Create `project-photos` bucket + storage RLS on `(storage.foldername(name))[1] = auth.uid()::text`; surface errors. |
| Video upload | **NOT BUILT** | Zero references. Only the marked homepage slot. | Bucket with resumable/TUS uploads, transcoding (Mux/Cloudflare Stream), `project_videos` table, owner RLS. |
| Direct messaging | **PARTIAL / BROKEN** | Two disconnected systems: match-based (`api/chat/route.ts:36`, `messages.match_id`) and conversation-based (`messages/[id]/page.tsx:62`, `messages.conversation_id`). **Nothing in the app ever creates a `conversations` row** — inserts exist only in seed files. The inbox can only show seeded demo threads. No realtime anywhere. | Create the conversation on mutual match (`api/swipes:105-122`); consolidate on `conversation_id`; add realtime or polling. |
| Message persistence | **BUILT AND WORKING (schema split)** | `messages` (`001:229`) + `conversation_id`/`is_demo` (`025:47`). Rows persist on both paths. Caveat: a message written by `/api/chat` is invisible to `/homeowner/messages` and vice versa. | Consolidation, as above. |
| Notifications | **NOT BUILT** | No `notifications` table in any migration. No email provider in `package.json`, no push, no service worker. `components/ui/Toast.tsx` is imported by zero files. | `notifications` table + owner RLS + realtime; an email provider (Resend/Postmark) with a verified sending domain. |
| Blog / CMS | **BUILT BUT BROKEN** | `app/blog/page.tsx:11-60` is a hardcoded 6-item array; every card links `/blog/${slug}` but **no `[slug]` route exists** — all six 404. No CMS, no table, no MDX. | `app/blog/[slug]` + MDX, or a `blog_posts` table (public read) / headless CMS. |
| Search | **NOT BUILT** | No route, component, input, or query anywhere. | Postgres FTS (tsvector + GIN) or Algolia/Typesense; public-read RLS implications. |
| Reviews | **PARTIAL — writes work, reads RLS-blocked** | Write path complete via service role (`api/matches/complete/route.ts:79-137`, recomputes `trust_*`). Read path dead: see Security Finding 3. Also `contractor_profiles.rating`/`review_count` are never updated, so every star rating renders its default 0. | Add a permissive SELECT policy; update `rating`/`review_count` on completion. |
| **Home Passport** | **NOT BUILT** | Marketing copy only, already flagged `// PLACEHOLDER COPY` at `app/page.tsx:63-68`. No table, route, or component. | `home_passport`/`property_records` keyed to `properties.id`, documents bucket, owner RLS + shareable-token read. |
| **Backstory Engine** | **NOT BUILT** | Copy only (`app/page.tsx:70-75`). Named as a referral reward in 4 places. Zero implementation. | `property_history` table + third-party records (county assessor/permits, ATTOM or Regrid), ingestion job, report generator. |
| **Health Score** | **NOT BUILT as named** | Copy only (`app/page.tsx:77-82`). The nearest real thing is *contractor* trust scoring (`003:57-61`, computed `matches/complete:104-137`) — but the copy describes a *home* score. Different subject. | Decide subject. Home version needs `home_health_snapshots` fed by property age/systems + a scoring job. |
| **Oracle** | **NOT BUILT as named** | Copy only (`app/page.tsx:84-89`). The primitive exists — `cost_data` (`001:149`) + nearest-neighbor (`lib/geo.ts:33-49`) — but there is no Oracle route, component, or query surface. | A query surface over `cost_data`. Needs real seed volume: `cost_data` is currently fed only by its own estimate outputs, which is circular. |
| **Match** (5th mechanic) | see Contractor matching / 80% gate | `app/page.tsx:53-59` | — |

**Four of the five marketed mechanics are NOT BUILT.** Homepage copy is written in the register of intent, and this file is the source of truth for what is live.

---

## Other blocking defects

| Defect | Evidence | Impact |
|---|---|---|
| Project page queries columns that do not exist | `homeowner/project/page.tsx:71` selects `budget_low, budget_high, steps(...)`; real names are `budget_min`/`budget_max` and `project_steps` | `/homeowner/project` always errors. The J7 checklist is unreachable. |
| `homeowner_preferences` table does not exist | `api/homeowner/preferences/route.ts:15,47`, `projects/[id]/score:37` | Preferences GET returns null, POST 500s. The quiz's output is discarded. |
| Daily lead cap never enforces | `api/match/route.ts:158` reads `match.daily_leads_reset_at`; the column is on `contractor_profiles`, already fetched into `contractor` at `:131` | `resetCount` is always true, so `daily_leads_used` resets to 1 on every accept. Contractors are never capped — a direct revenue leak against the $79/$149 tiers. |

---

## Hardcoded hex inventory (tokenization targets)

32 files, 419 lines containing a hex. `app/styles/design-tokens.css` (25) and `app/globals.css` (9) are the legitimate token definitions; `app/icon.tsx` (4) and `app/opengraph-image.tsx` (8) are the documented `ImageResponse` exception. The remaining 28 files are targets.

Top offenders: `app/home/page.tsx` 87 · `for-contractors` 40 · `for-homeowners` 32 · `trust` 31 · `(dashboard)/contractor/profile` 27 · `for-property-managers` 22 · `blog` 22 · `components/swipe/SwipeDemo` 19 · `components/hero/HeroMatchState` 18 · `components/layout/Footer` 12 · `components/waitlist/WaitlistForm` 9. Counts are lines, not occurrences — several lines carry 2–3 values each.
