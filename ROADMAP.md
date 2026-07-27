# Laywork — Wave Roadmap

**Written**: 2026-07-27. Planning only; nothing in this file was built in the session that wrote it.
**Inputs**: FEATURE_INVENTORY.md (evidence-based audit), WAR_PLAN.md, docs/BUSINESS_MODEL.md, docs/ROADMAP_0_TO_100M.md.
**Rule**: a wave is done when its items are VERIFIED per §20, not when they are written.

---

## Where the proposed staging survives contact with the inventory, and where it does not

The directive proposed Wave 1 = waitlist surfaces, Wave 2 = launch-critical app, Wave 3+ = the marketed mechanics. **The inventory contradicts that staging in three specific ways**, so this roadmap adjusts with reasoning rather than restating the proposal:

1. **A security fix cannot wait for a wave.** `properties` grants `OR is_demo = false` on SELECT. It leaks street addresses to every caller the moment a real property row exists, and it directly contradicts the product's own "no address sharing, ZIP only" rule. This is promoted to **Wave 0**, ahead of everything, because it is a live-schema defect with a two-statement fix, not a feature.

2. **Two Wave 2 items are listed as "build" but are actually "repair".** Matching and the 80% gate already have code, schema, and UI — they are BUILT BUT BROKEN. Estimating them as greenfield would misprice them. They are cheaper than they look, and they block more than they look: with matching broken, a homeowner who completes the estimate flow sees an empty deck, which makes every downstream feature untestable.

3. **The daily lead cap never enforces** (`api/match/route.ts:158` reads the reset column off the wrong object). That is a revenue leak against the $79/$149 tiers, not a feature gap. It belongs in Wave 2 as a one-line repair with a test, not in a later wave.

---

## WAVE 0 — Repairs that cannot wait (before or alongside Wave 1)

Not features. Each is a defect in live or launch-path code.

| Item | Fix | Why it cannot wait |
|---|---|---|
| `properties` SELECT leak | Drop and recreate the policy without `OR is_demo = false`; same for `saved_contractors` | Street addresses become world-readable at the first real signup |
| `properties` missing INSERT policy | Add owner-scoped INSERT; check the error at `onboarding/page.tsx:127` | Onboarding silently fails, breaking Communities downstream |
| `reviews` unreadable | Add a PERMISSIVE SELECT policy | Trust is the product thesis; no review can currently be read by anyone |
| Daily lead cap | Read `contractor.daily_leads_reset_at`, not `match.` | Contractors are never capped: direct revenue leak |

No new tables. No third-party services. All four are policy or single-line code changes.

---

## WAVE 1 — Now → Aug 31. Serves the waitlist goal. Nothing else.

Scope: homepage, waitlist modal, Founders page, leaderboard, status page, referral loop.

**Status: substantially shipped already** (production `d516a55`, DRAWING SET redesign in flight). Remaining Wave 1 work is finishing and hardening, not new surface:

- Finish the DRAWING SET pass across the marketing pages (`/home`, `/for-*`, `/trust`, `/blog`) — currently still rendering the retired copper palette from hardcoded hexes.
- Blog links: six cards link to `/blog/[slug]`, which does not exist. Either build the route or remove the links. **Shipping 404s on a page whose job is credibility is worse than shipping fewer articles.**
- Referral loop end-to-end verification with three real referrals, to observe the tier flip at 3 that has never been directly exercised (only the count=1 boundary has).

**Explicitly not in Wave 1**: everything in the table below. The waitlist does not need the app to work.

---

## WAVE 2 — Launch-critical for the app itself

Ordered by dependency, not by appeal. Each row states what it actually needs.

| # | Item | Inventory status | Requires |
|---|---|---|---|
| 1 | **Matching repair** | BUILT BUT BROKEN | No new tables. Point `/api/match` at `contractor_profiles.lat/lng` (migration 006 already moved it); geocode on project insert in the estimate flow; delete the duplicate path. **Blocks 2, 4, 5.** |
| 2 | **80% gate consolidation** | BUILT BUT BROKEN | New table `homeowner_preferences` (user_id, weights, owner-scoped RLS). Pick one scale (0–1 or 0–100), persist the score to `matches.match_score`, delete the dead scorer. Depends on 1. |
| 3 | **ZIP / service-area** | BUILT AND WORKING | Nothing to build. Harden only: cache `zipToLatLng`, handle zippopotam.us rate limits and outages. |
| 4 | **Photo upload + storage** | PARTIAL | **Storage bucket `project-photos` (does not exist)** + storage RLS on `(storage.foldername(name))[1] = auth.uid()::text`. Surface upload errors instead of swallowing them at `estimate/page.tsx:46`. Consider a CDN/transform layer. |
| 5 | **Message persistence / real inbox** | PARTIAL, BROKEN | No new tables. Create the `conversations` row on mutual match (`api/swipes`), consolidate on `conversation_id`, drop the `match_id` path. Add Supabase realtime channel or polling. **Nothing currently creates a conversation, so the inbox only shows seeded demo threads.** |
| 6 | **Profile badges (verified / licensed / insured)** | PARTIAL | New table `license_verifications` (contractor_id, doc_url, state, verifier, verified_at) + a **private docs storage bucket**, owner-only RLS. Capture license and insurance at contractor onboarding (currently not collected at all). Third-party: a state licence-board API, or an admin review queue as the manual v1. **Remove the hardcoded unconditional "Verified" badge at `contractor/[id]:289` before launch — it is an unearned trust claim, which is the exact thing this product exists to prevent.** |
| 7 | **Homeowner profiles** | PARTIAL | New route `/homeowner/profile`. Avatar upload needs an `avatars` bucket + per-user-folder RLS. |
| 8 | **Communities detail repair** | PARTIAL | No new tables. Rewrite the detail page against `community_posts` / `community_comments`; it currently queries a `posts` table and `member_count`/`post_count` columns that do not exist. |
| 9 | **Reviews read path** | PARTIAL | Covered by Wave 0. Additionally: update `contractor_profiles.rating` and `review_count` on completion, which nothing does today, so every star rating renders 0. |
| 10 | **Notifications** | NOT BUILT | New `notifications` table + owner RLS + realtime. **Third-party required**: an email provider (Resend or Postmark) with a verified sending domain — there is no email capability in the codebase at all today, which also means the waitlist's "check your email" promise is currently unfulfilled. |

**Item 10 deserves emphasis**: the waitlist modal tells every signup to check their email, and no email is ever sent. That gap is Wave 1 marketing making a Wave 2 promise.

---

## WAVE 3+ — After the app works

| Item | Requires |
|---|---|
| **Home Passport** | `home_passport` / `property_records` keyed to `properties.id`; documents bucket; owner RLS plus a shareable-token read path. |
| **Backstory Engine** | `property_history` table; third-party records (county assessor and permit data, ATTOM or Regrid); an ingestion job; a report generator. Named as the 5-referral reward, so it carries a delivery obligation the moment anyone hits five. |
| **Health Score** | Decide the subject first: the marketing says *home*, the only built primitive scores *contractors*. Home version needs `home_health_snapshots` fed by property age and systems data. |
| **Oracle** | A query surface over `cost_data`. **The real dependency is data volume, not code**: `cost_data` is currently fed only by its own estimate outputs, which is circular. It needs completed-job seed data before an Oracle says anything true. |
| Budgeting tools | `budget_line_items` + `budget_events`, owner RLS, dashboard view. No third party. |
| Blog / CMS | `app/blog/[slug]` + MDX, or a `blog_posts` table / headless CMS. |
| Video upload | Bucket with resumable (TUS) uploads, transcoding service (Mux or Cloudflare Stream), `project_videos` table. The heaviest infrastructure item on this list. |
| Search | Postgres FTS (tsvector + GIN) or Algolia/Typesense. Public-read RLS implications for any contractor index. |

---

## The dependency that governs everything

Four of the five marketed mechanics are unbuilt, and the fifth (Match) is broken. The moat argument in PRODUCT.md rests on `cost_data` accumulating from completed jobs — but a job cannot complete until matching works, messaging persists, and reviews are readable. **Wave 2 items 1, 5, and 9 are therefore not merely launch-critical; they are the precondition for the data moat existing at all.** Everything in Wave 3+ that sounds like the product's differentiation depends on finishing them first.
