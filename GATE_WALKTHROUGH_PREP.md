# GATE WALKTHROUGH PREP

**Prepared**: 2026-07-22 · **Updated**: 2026-07-23 (migrations 037+038 applied and verified)
**For**: founder gate walkthrough
**Read this before starting** so you only log *new* findings — everything below is already known.

---

## STATUS: WALKTHROUGH-READY ✅ (with one behavior change to be aware of)

Migrations 037 and 038 were applied to the live DB on 2026-07-23 and **both are verified working**. No blockers remain.

### Migration 037 — verified
`/homeowner/communities` now loads a real community. Screenshot: `tests/e2e-screenshots/gate4/bug3-communities.png` — renders "ZIP 22201 · 1 members · 0 posts" with no recursion error and no marketing header.

### Migration 038 — verified, leak closed
Raw anon-key query against `contractor_profiles`, run live:

```text
--- RAW anon-key result ---
error: none
row count: 0
rows: []

>>> demo rows visible to anon: 0
>>> PASS (zero demo rows): true

--- ground truth via service role ---
total in table: 28  (real: 3, demo: 25)
```

Before the fix, that same query returned all 28 rows including "General Contractor - Demo 1". **Zero demo rows now leak.**

Authenticated access still works correctly — logged in as the demo account, `contractor_profiles` returns 7 rows (3 real + 4 demo contractors matched to that account's own project), which is exactly the intended carve-out.

### ⚠️ Behavior change you should know about

038 was applied as **Option A** (as-written, no anon read policy added). `RESTRICTIVE` policies only filter, they never grant — so dropping migration 001's `USING (true)` removed anon's *only* grant. Anon now sees **zero** contractor rows, not "all real ones."

Concrete effect, verified live: **`/contractors/<id>` returns HTTP 404 for logged-out visitors.** Public contractor profiles are now login-gated.

That's fine if everything is gated pre-launch. If you want those pages publicly linkable (SEO, sharing a contractor), say so and I'll add the one-line anon PERMISSIVE policy — the RESTRICTIVE filter above stays in place, so the demo leak stays closed either way. `/feed/[zip]` is unaffected; it uses the admin client.

---

## Environment

| Item | Value |
|---|---|
| **Test URL** | https://groundwork-platform-git-main-groundwork-b24989b8.vercel.app |
| **Production URL** | https://groundwork-platform.vercel.app (same build; `/` redirects to `/waitlist` pre-launch) |
| **Demo account** | `founder.demo@example.com` — **password not committed here**, see note below |
| **Commit being walked** | `fb2119d` on `main` (PR #8, squash-merged) |
| **Dashboard entry point** | `/homeowner` (log in first; `/` goes to the waitlist, not the app) |

**Note on the test URL**: `main` auto-deploys to that alias, and PR #8 is merged, so the alias serves the walkthrough commit.

**Note on the demo password**: not written here. Get it from `DEMO_MODE.md` or `tests/helpers/auth.ts` — it's already committed in both, plus four other files, and has been for a long time.

That's the actual issue worth your attention: **the demo password is in plaintext across 7 files in a public repo.** There's a prior decision in DECISIONS.md accepting this ("Demo Admin Password Hygiene"), on the grounds that the account only reaches demo data. I checked that claim against the live DB and it holds — `founder.demo@example.com` is `role: "homeowner"`, `is_demo: true`, not an admin. So the blast radius is genuinely small.

Two follow-ups regardless:
- Worth rotating at some point, but note the same password is in `tests/helpers/auth.ts` and the entire Playwright suite authenticates with it — rotating means updating that too, or every test breaks. Deliberately not done mid-walkthrough-prep.
- **`FINAL_REVIEW.md` calls this account "Admin User" in three places. That's wrong** — it's a homeowner-role account. Worth fixing, because it makes the exposure look far more serious than it is and could send someone down the wrong path in an incident.

### Demo account data (verified live, not assumed)
- 1 property, ZIP 22201 (Arlington VA)
- 1 project: "Founder Walkthrough: Kitchen Renovation", budget $25k–$50k
- 1 estimate: renders as **$19k–$42k** on the dashboard
- 4 matches: 0.92 / 0.85 / 0.81 (above the 80% gate) + 0.65 (below gate, correctly excluded from the UI)
- 1 conversation with 2 seeded messages + test messages sent during verification
- 10 project checklist steps (3 pre-marked complete)
- 1 saved contractor

**These had to be repaired this session.** Matches, the conversation, and its messages were all missing from the live DB (demo data drift — the project and property survived, the rest didn't; root cause unconfirmed). Re-seeded against the *existing* project rather than re-running the full seed script, which would have created a duplicate project.

---

## Bugs fixed this batch

### Bug #3 — Neighborhood nav → authenticated `/homeowner/communities`
**Status: FIXED and verified** (migration 037 applied 2026-07-23).

Two real app-code bugs found and fixed:
1. The page looked up the current user's own ZIP from `properties` filtered by `is_demo=false`. That's a misapplication of demo isolation — the rule (WARP.md §14) exists to hide demo rows from *other* users, not to hide a demo account's own data from itself. The founder demo account could never find its own property, so the page showed "No ZIP code found. Complete onboarding first."
2. The page selected and inserted `member_count`, `post_count`, and `is_demo` columns that **do not exist** on the real `communities` table (per migration 005). Rewrote to select real columns and compute the counts via `community_members` / `community_posts` count queries; the create-community insert now supplies the actually-required `creator_id` and `name`.

A third bug — RLS infinite recursion on `community_members` — needed migration 037, now applied.

Evidence: `tests/e2e-screenshots/gate4/bug3-communities.png` — the page now renders the real ZIP 22201 community ("1 members · 0 posts", counts computed from `community_members`/`community_posts`), with no marketing header and no recursion error.

### Bug #4 — Messages: real inbox → open → send → persists
**Status: FIXED and fully verified.**

Root cause wasn't code — the seeded conversation simply didn't exist in the live DB. After repair, verified the full loop live:
- `bug4-1-inbox.png` — inbox lists the real conversation (no longer "No conversations yet")
- `bug4-2-conversation-open.png` — conversation opens with seeded message history
- `bug4-3-sent.png` — a new message sends and appears
- `bug4-4-persisted.png` — navigated away to `/homeowner` and back; message still there

### Bug #5 — "Back to matches" lands on matches
**Status: FIXED and verified.**

Root cause: `/homeowner/matches` requires a `?project=<id>` query param. Without it, the page's own `useEffect` immediately redirects to `/homeowner` — so every bare link to `/homeowner/matches` was a silent dead end. Six such links existed:

| Location | Fix |
|---|---|
| `app/(dashboard)/homeowner/page.tsx` — dashboard top-nav "Matches" | Now `/homeowner/matches?project=${project.id}`. **This is the one you'd have hit first** — the most-used entry point. |
| `app/(dashboard)/homeowner/chat/page.tsx` — error-state "Back to matches" button | Uses the already-fetched `matchProjectId`; falls back to `/homeowner` when there's genuinely no match context |
| `app/(dashboard)/homeowner/chat/page.tsx` — header back arrow | Same |
| `app/contractor/[id]/page.tsx` — "Back to matches" button | Page has no project context at all → relabeled "Back to dashboard", points at `/homeowner` |
| `app/contractor/[id]/page.tsx` — `handleMessage` redirect | Points at `/homeowner` |
| `app/(auth)/onboarding/page.tsx` — post-onboarding redirect | **Left as-is deliberately.** Not a back/cancel button, and it fires before any project exists. The matches page's own fallback already sends it to `/homeowner` correctly — no user-visible break, just one extra bounce. |

Evidence: `bug5-1-dashboard-nav-to-matches.png` (dashboard nav → working matches view), `bug5-2-chat-back-to-matches.png` (chat back-link → matches view rendering the real 92% match card).

### Back/cancel button audit — every one checked
Full list audited: `contractor/profile`, `homeowner/budget`, `homeowner/communities`, `homeowner/communities/[id]`, `homeowner/estimate`, `homeowner/matches` (3 error/empty-state buttons + header arrow), `homeowner/messages`, `homeowner/messages/[id]`, `homeowner/personality`, `homeowner/project`, `homeowner/saved`, `contractor/[id]`, `waitlist`.

All resolve to real, working destinations. Two use browser history rather than an explicit route — `personality/page.tsx` (`router.back()`) and `budget/page.tsx` (`window.history.back()`). Both are correct in normal in-app flow; theoretically a no-op only if someone lands on those URLs directly with no history. Not an observed break, left alone.

---

## KNOWN OPEN ITEMS — do not waste walkthrough time logging these

1. **`/homeowner/communities/[id]` (the "View Community" button) is still broken.** Independent of 037 — re-verified after applying it. The page errors with `Could not find a relationship between 'communities' and 'posts' in the schema cache`: it queries a `posts` table with columns (`author_id`, `content`, `reply_count`) that don't match the real `community_posts` schema (`user_id`, `title`, `description`, `photo_urls`, `project_type`, `budget_min`, `budget_max`). Fixing it means picking a post model (see question 3 below), not a one-line change. **The communities *list* page works — only clicking through breaks.**
2. **Public contractor profiles are login-gated.** `/contractors/<id>` returns 404 for logged-out visitors, a consequence of applying 038 as Option A. See the behavior-change note at the top. One line reverses it if you want public profiles back.
3. **Contractor-side experience is unwalked.** Everything verified this session was the homeowner journey on `founder.demo@example.com`. The contractor dashboard, contractor onboarding, and contractor-side chat have not been exercised.
4. **`app/contractor/[id]` appears unreachable.** Nothing in the current nav links to it (live links point to `/contractors/[id]`, a different route). Its back-links were fixed anyway, but the page may be dead code.
5. **Phases 5–7 untouched** (empty states, microcopy, dashboard CTA hierarchy, growth tooling, final close-out). Per EXECUTION.md these were never started — not regressions.
6. **Waitlist items still open from Phase 2**: admin dashboard content as a logged-in admin, milestone flip at exactly 3 referrals (boundary at 1 confirmed correct), custom domain.
7. **Pre-existing lint errors** (6 errors / 6 warnings across the touched files) — identical count on `main` before this batch. Not introduced here, not cleaned up (out of scope).
8. **Demo password is plaintext in 7 files in a public repo** (pre-existing, prior decision accepted it, verified low blast radius — see the Environment note). Also `FINAL_REVIEW.md` mislabels the demo account as "Admin User" when it's homeowner-role.

---

## Test results — honest, zero skips

Full Playwright suite, run against local dev with the repaired demo data:

```text
12 tests total — 12 passed, 0 failed, 0 skipped
```

Re-run in full after applying migrations 037 and 038 — still 12/12, no regressions from either migration.

Two flakes seen along the way, both investigated rather than waved off:
- `design-loading-screen.spec.ts`'s duration assertion failed once at 3650ms against a 3500ms budget under 4 parallel workers; passes at ~3242ms in isolation. Parallel-worker CPU contention, not a regression — but it's a genuinely tight assertion that will flake again under load. Flagged rather than quietly widening the threshold on an already-merged test.
- On the *first* run immediately after the migrations, Bug #5 timed out at 30s and the matches regression check took 18.1s (normally ~9s and ~4s). This looked like a migration-caused performance regression, so I measured the DB directly rather than assuming: the actual queries run in 130–390ms, and both tests returned to normal on the next run. It was cold Turbopack route compilation after the dev-server restart, not the RLS policies.

Suites: `design-loading-screen` (4), `gate-4-matches` (2), `gate4-walkthrough-prep` (4), `phase1-estimate-verification` (1), `phase2-waitlist` (1).

`npm run build` — clean.

---

## Things I want a human opinion on

1. **Why did the demo data disappear?** Matches, conversations, messages, and the community row were all gone from the live DB while the project and property survived. That's a selective deletion pattern, not a full purge. Was `purge_demo_data()` run manually? Something else? If the cause is still live, the walkthrough data may vanish again mid-walkthrough. **I could not determine this and it worries me most.**

2. **Is `app/contractor/[id]` dead code?** Nothing links to it; `/contractors/[id]` is what live nav uses. I fixed its back-links rather than deleting it, but if it's dead it should probably go — and if it's *not* dead, I want to know what reaches it, because its "Back to matches" had no project context available at all.

3. **How should the communities detail page actually work?** Fixing open item #1 means picking a real post model. The existing `community_posts` schema is project-shaped (title, budget range, project type, photos) but the page was written expecting a simple text feed (content, reply_count). Those are different products. Which did you intend? **This is the one blocking a real fix** — I can't guess it.

4. **Should public contractor profiles stay login-gated?** Applying 038 as Option A made `/contractors/<id>` 404 for logged-out visitors. One-line fix either way; I need to know the intent. If these are meant to be shareable/SEO-indexed, they're currently broken for every anonymous visitor.

5. **Migration application process.** Three batches now have ended with "migration written, founder must paste it." This one worked, but if there's a way to give the agent environment scoped DDL access it removes a recurring bottleneck and a real class of "documented but not actually fixed" risk — CodeRabbit flagged exactly this on PR #8 and was right that documentation alone doesn't remediate a live environment.

6. **The 80% gate on a thin dataset.** The demo project has exactly 4 matches, 3 above gate. After hearting/passing through them the UI correctly shows "You're all caught up" — which is right, but makes the matches screen look empty for most of a walkthrough. Worth seeding more before demoing to anyone external?
