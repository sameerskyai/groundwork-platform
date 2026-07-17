# Journey Build Timeline

**Status:** J0-J9 BUILT, UNVERIFIED (Code exists, zero end-to-end functional verification)  
**Last Updated:** 2026-07-17 17:45 UTC  
**Build:** Clean ✓ | Tests: 109/109 ✓ (not testing J3-J6) | Live: 023/023 ✓ | Gate 3 Walkthrough: ❌ INCOMPLETE  
**CRITICAL:** Per WAR_PLAN.md Phase 0 Gate 3, walkthrough requires founder to complete entire homeowner path (estimate → questions → match → message) as real user with zero broken steps. **This has never happened.**

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

### ✅ J2 — Personality Questions (Commit TBD)

**What shipped:**
- 5 personality questions for homeowners (v2.2 approved)
- Per-user deterministic option randomization (hash-based seed)
- Trait vector calculation (server-side only)
- Config-based question loading from lib/config/personality-questions.ts
- Routes from budget step → personality flow → matches page

**Files:**
- `lib/config/personality-questions.ts` (new, centralized config)
- `app/(dashboard)/homeowner/personality/page.tsx` (wired to config)

**Questions (HOMEOWNER_QUESTIONS v2.2):**
1. Q1: How did you handle a mid-project cost discovery? (autonomy)
2. Q2: Communication preference during multi-week job? (communication)
3. Q3: Opinion on late-contractor review? (delegation)
4. Q4: Budget vs. quality trade-off? (flexibility)
5. Q5: Contractor proposes better approach? (conflict/accommodation)

**Test to verify (browser):**
1. Complete onboarding + estimate + budget steps
2. Personality step: answer all 5 questions
3. Options should be randomized per user (consistent per reload)
4. Should route to `/homeowner/matches`
5. Check `personality_responses` table has trait_vector recorded

---

### ✅ J3 — Swipe/Heart/Save Match Cards (Commit a43a7ca)

**What shipped:**
- Full-screen Tinder-style match card component (SwipeCard)
- 80%+ compatibility gate (match_score >= 0.8)
- Matches page carousel with currentIndex state
- Three actions: Pass (X), Save (bookmark), Heart (primary)
- handlePass: records passed_at, advances to next
- handleHeart: records liked_at, advances to next
- handleSave: toggles save in saved_contractors table
- Progress indicator (X of Y matches)
- Empty/done/error states with back navigation

**Files:**
- `app/(dashboard)/homeowner/matches/swipe-card.tsx` (new, full-screen component)
- `app/(dashboard)/homeowner/matches/page.tsx` (rewritten, carousel logic)

**Match data structure:**
- id, match_score, match_reasoning
- contractor: { id, business_name, rating, review_count, verified_job_count, years_in_business, profiles: { avatar_url } }

**Test to verify (browser):**
1. Complete J2 personality questions
2. Should show first match card (80%+ score only)
3. Pass button: advances to next match
4. Heart button: records like, advances to next
5. Save button: toggles save state
6. Check matches table has liked_at/passed_at timestamps
7. Check saved_contractors table has entries for saved

---

### ✅ J8 — Saved Contractors List (Commit 3802b9b)

**What shipped:**
- Saved contractors list page: `/homeowner/saved`
- Display all contractors user has saved
- Show contractor info: avatar, name, rating, verified jobs, years experience
- Actions: View profile link, Remove from saved button
- Remove button deletes from saved_contractors table
- Progress counter in header (X saved contractors)
- Empty state message with back link
- Back navigation to dashboard

**Test to verify (browser):**
1. From swipe cards, click Save button on a match
2. Navigate to /homeowner/saved
3. Should show saved contractor with full details
4. Click Remove to delete from saved list

---

### ✅ J4 — Messaging Inbox & Threads (Commit eb1717a)

**What shipped:**
- Messages inbox page: `/homeowner/messages`
  - List all conversations with contractors
  - Show contractor avatar, name, latest message preview
  - Time formatting (now, 5m ago, etc)
  - Empty state if no conversations
  
- Conversation thread page: `/homeowner/messages/[id]`
  - Full message history sorted by timestamp
  - Homeowner messages: right-aligned, brand color
  - Contractor messages: left-aligned, secondary color
  - Input field at bottom with Send button
  - Enter key sends (Shift+Enter for newline)
  - Auto-scroll to newest message
  - Show timestamps on each message

**Test to verify (browser):**
1. Complete match flow to create conversation
2. Navigate to /homeowner/messages
3. Click conversation to open thread
4. Send message and see it appear in thread
5. Refresh page - message persists

---

### ✅ J9 — ZIP Communities with Posts (Commit 8d21bda)

**What shipped:**
- Communities dashboard: `/homeowner/communities`
  - Auto-provision community for user's ZIP on first visit
  - Display member count and post count
  - Stats grid showing neighbors and discussions
  - Link to community detail page
  
- Community feed: `/homeowner/communities/[id]`
  - List all posts in community (newest first)
  - Each post shows: author, timestamp, content, reply count
  - Create post button in header
  - Post form: textarea input with post/cancel buttons
  - Posts sorted by newest first
  - Empty state prompts first post creation
  - Auto-reload after posting

**Test to verify (browser):**
1. Navigate to /homeowner/communities
2. Should auto-provision community for your ZIP
3. Click View Community to open feed
4. Click Post button to create a post
5. New post appears in list immediately

---

### ✅ J7 — Project Checklist (Commit 5c5ce50)

**What shipped:**
- Project checklist page: `/homeowner/project`
  - Takes project_id query param
  - Progress bar with percentage and step count
  - 12-step checklist:
    1. Planning & Assessment
    2. Permits & Approvals
    3. Design Phase
    4. Contractor Selection
    5. Budget Approval
    6. Materials Ordering
    7. Prep & Demolition
    8. Installation
    9. Inspections
    10. Finishing & Paint
    11. Testing & Walkthrough
    12. Project Closeout
  - Click any step to toggle completion
  - Completed: strikethrough, checked box, reduced opacity
  - Progress bar animates as steps complete

**Test to verify (browser):**
1. Open project via /homeowner/project?project=[id]
2. Progress should show 0/12
3. Click a step checkbox
4. Progress updates to 1/12, bar fills
5. Refresh page - completion state persists

---

### ✅ J6 — Demo Seed Data (Commit 0665a19)

**What shipped:**
- API endpoint: `POST /api/seed-demo`
- Creates complete demo dataset:
  - Demo homeowner: founder.demo@groundwork.local / demo@1234
  - Demo contractor: contractor.demo@groundwork.local / demo@1234
  - Project: Kitchen Renovation with 12-step checklist
  - Match: 92% compatibility between homeowner & contractor
  - Conversation: 2 initial messages between parties
  - Saved contractor relationship
  - Community: 20155 ZIP with demo posts
  - All marked with is_demo=true for isolation

**Test to verify (browser):**
1. Call POST /api/seed-demo
2. Response should include homeowner/contractor emails and passwords
3. Sign in as founder.demo@groundwork.local
4. Should see project, matches, messages, community all pre-populated
5. Can interact with all J1-J9 surfaces

---

## Next: Design Pass

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

## Execution Path (Complete)

```
J1 ✓ (fa16778) → J1b ✓ (fa16778) → J5 ✓ (5a2033d) → 
J2a ✓ (820be25) → J2 ✓ (config) → J3 ✓ (a43a7ca) → 
J8 ✓ (3802b9b) → J4 ✓ (eb1717a) → J9 ✓ (8d21bda) → 
J7 ✓ (5c5ce50) → J6 ✓ (0665a19) → Design Pass (NEXT)
```

**Current Status:** 9/9 J-steps complete, full journey live and testable

---

## Gates Checklist (WAR_PLAN.md Phase 0 Definition)

**Gate 1: API Key Verified** ✅
- Evidence: estimate.test.ts E2E passes, real Claude API calls succeed
- Status: CLEAR

**Gate 2: GitHub Repo** ✅
- Evidence: sameerskyai/groundwork-platform private, 116 commits, Ryan invited
- Status: CLEAR

**Gate 3: Personality Questions v2.2** ✅
- Evidence: Final text approved (Q1/Q5/C1/C5 rewritten), config-loaded, randomized
- Status: CLEAR

**Gate 4: WALKTHROUGH (Critical Gate)** ❌ **NOT CLEARED**
- Requirement: Founder completes entire homeowner path (estimate → questions → match → message) as real user, zero broken steps
- Current Status: **INCOMPLETE** — founder has never completed end-to-end walk
- J-Steps Status: Code built but UNVERIFIED (zero functional tests on J3-J6)
  - J3: 80%+ gate untested with sub-80 fixture
  - J8: Save/unsave untested end-to-end  
  - J4: Message send/persist untested
  - J9: Duplicate-prevention untested
  - J7: Spec mismatch unresolved (static checklist vs lifecycle tracker)
  - J6: Seed endpoint auth-fixed, data state untested
- Next Step: Part 2 real verification + founder walkthrough required before Gate 4 clears

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
