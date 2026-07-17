# Journey Build Timeline

**Status:** J1-J2a COMPLETE + INFRASTRUCTURE READY → J3-J6 QUEUED  
**Last Updated:** 2026-07-17 16:25 UTC  
**Build:** Clean ✓ | Tests: 109/109 ✓ | Live: 023/023 ✓

---

## Completed J-Steps

### ✅ J1 — Conversational Onboarding (Commit fa16778)

**What shipped:**
- Full-screen, one-question-at-a-time flow (typeform-style)
- Step 1: Segment selection → homeowner/contractor/PM/agent routing
  - Homeowners continue to ZIP + preference
  - Contractors route to contractor onboarding
  - PM/Agent route to early-access demand capture
- Step 2: ZIP code (saved to profile, never asked again)
- Step 3: Preference (estimate or match) → dashboard routing

**Files:**
- `app/(auth)/onboarding/page.tsx` (rewritten, 496 lines)
- `app/(auth)/onboarding/contractor/page.tsx` (new)
- Test: Login via signup → onboarding flow → segment → ZIP → preference → dashboard

**Test to verify (browser):**
1. Sign up new account
2. Segment: select "I'm a homeowner"
3. ZIP: enter 20155
4. Preference: select "Get a free AI estimate"
5. Should route to `/homeowner/estimate`

---

### ✅ J1b — Properties Foundation (Migration 020)

**Schema:**
```sql
properties:
  - owner_id (FK profiles)
  - zip_code
  - label ("Home")
  - is_demo + RLS + purge per §14

profiles additions:
  - user_segment (enum: homeowner|contractor|property_manager|agent)
  - segment_metadata (JSONB for PM door_count, agent agent_type)

projects additions:
  - property_id (FK properties)
```

**Behavior:**
- Homeowners auto-get one default property on onboarding
- Estimate/matching reads ZIP from property (not profile)
- Demo isolation: RESTRICTIVE RLS on properties table

**Files:**
- `supabase/migrations/020_properties_foundation.sql` (new)

**Test to verify (database):**
1. After completing onboarding as homeowner with ZIP 20155
2. Check `properties` table → one row with owner_id, zip_code='20155', label='Home'
3. Check `profiles` → user_segment='homeowner'

---

### ✅ J5 — Profiles (Commit 5a2033d)

**What shipped:**
- Contractor public profile storefront: `/contractor/[id]`
  - Business name, avatar, rating + reviews
  - Trust badges (verified, jobs completed)
  - Bio, years in business, service area
  - Match context banner (if coming from match)
  - Save + Message action buttons
  - Recent reviews list (5 most recent)
  
- Saved contractors functionality:
  - Users can save contractors without messaging (J8 integration)
  - saved_contractors table: user_id, contractor_id, is_demo + RLS
  - RLS: users see only their own saves

**Files:**
- `app/contractor/[id]/page.tsx` (storefront, 406 lines)
- `supabase/migrations/021_profiles_and_saved_contractors.sql` (new)

**Test to verify (browser):**
1. Navigate to `/contractor/<contractor_id>`
2. Should show full storefront: name, rating, reviews, bio
3. Click Save button → should toggle saved state
4. Click Message → should route to matches (J4 integration TBD)

**Not Yet Shipped (J5 Phase 2):**
- Work gallery (before/after images)
- Homeowner profile (visible to matched contractors only)
- Own-profile editing (avatar upload, bio, ZIP edit)

---

## Next: Estimate E2E Verification (Blocked)

**What's needed:**
- Contractor public profile (storefront): photo, name, rating, badges, bio, tags, gallery, reviews
- Homeowner profile (humanizing): name, photo, bio, ZIP, member since
- Own-profile editing (both): photo upload to Supabase storage, bio, ZIP

**Routes:**
- `/contractor/:id` (public contractor profile)
- `/homeowner/:id` (visible to matched contractors only)
- `/profile` (own profile editing, reachable from avatar menu)

**Dependencies:**
- Need to wire profile photo upload to avatar display in top nav
- Match scorer output should feed "why you matched" reasons to contractor profile

**Estimated scope:** ~200 lines pages + reusable profile components

---

## Blocked: Estimate E2E (Waiting for User)

**Blocker:** `ANTHROPIC_API_KEY` not provided  
**File:** `.env.local` needs: `ANTHROPIC_API_KEY=sk_...`  
**Note:** Error handling in place; estimate form will show clear message if missing

**Once provided:**
- Test estimate flow: "3 bathrooms, 2000s design, modernize with vinyl" + ZIP 20155
- Should show range + breakdown
- Next step: budget capture (J2a)

---

## Upcoming J-Steps (Not Yet Started)

| Step | Scope | Est. Commit | Dependencies |
|------|-------|------------|--------------|
| J5 | Profiles | 50 lines | Supabase storage, top nav refactor |
| J2a | Budget step | 30 lines | Estimate completion, project model |
| J2 | 5 personality questions | 150 lines | J5 profiles ready, personality_responses table |
| J3 | Match swipe/heart/save | 120 lines | Match cards, existing swipe API |
| J8 | Saved contractors list | 80 lines | saved_contractors table |
| J4 | Messaging inbox | 180 lines | Real-time or polling, conversation list |
| J9 | ZIP communities | 200 lines | Auto-provision on first touch, posts |
| J7 | Project checklist | 100 lines | Step tracker, auto-update logic |
| J6 | Founder demo life | 100 lines | Seed script with projects/chats/matches |
| Design | Light/dark + 21st.dev | 300 lines | Component adaptation, font pairing |

---

## Execution Path (Overnight Queue in Progress)

```
J1 ✓ (fa16778) → J1b ✓ (fa16778) → J5 ✓ (5a2033d) → 
J2a ✓ (820be25) → J2 (⏳ founder questions) → J3 (BUILDING) → 
J8 → J4 → J9 → J7 → J6 → estimate E2E (BLOCKED: ANTHROPIC_API_KEY) → design pass
```

**Current Status:** 4 J-steps complete (J2a shipped), overnight queue running, J2 questions flagged for morning review

---

## Gates Checklist

- [x] J1 complete: build clean + 108/108 + commit
- [x] J1b complete: migration 020 applied + commit
- [x] J5 complete: build clean + 108/108 + commit
- [ ] Estimate E2E: founder provides API key + test flow
- [ ] J2a complete: budget step
- [ ] J2 complete: 5 personality questions
- [ ] J3 complete: swipe/heart/save
- [ ] J8 complete: saved contractors list page
- [ ] J4 complete: messaging inbox
- [ ] J9 complete: ZIP communities
- [ ] J7 complete: project checklist
- [ ] J6 complete: founder demo seed data
- [ ] All J-steps: full journey walkthrough evidence before design pass

---

## Key Files to Remember

- **Onboarding:** `app/(auth)/onboarding/page.tsx` (segment routing logic)
- **Properties:** `supabase/migrations/020_properties_foundation.sql` + `profiles.user_segment`
- **Decisions:** Log all J-step choices in `DECISIONS.md`
- **Seed:** `supabase/seed/01-marketplace-demo.ts` (will need heavy update for J6)

---

## Notes for Next Session

- J5 profiles can reuse existing contractor_profiles schema but needs public route
- J2 (5 questions) needs custom question text — founder to write these
- J9 (communities) needs US Census ZIP data (~42k rows) — can be seeded or imported
- Design pass should wait for all J-steps (no design before journey is solid)
- Founder demo seed needs realistic conversation history (J4 dependent)
