# GATE WALKTHROUGH PREP

**Prepared**: 2026-07-22
**For**: founder gate walkthrough
**Read this before starting** so you only log *new* findings — everything below is already known.

---

## ⚠️ READ FIRST: TWO MIGRATIONS MUST BE APPLIED BEFORE THE WALKTHROUGH

Neither could be applied from the agent environment (no DB password / Supabase PAT available — same constraint documented for migration 035). **Both need to be pasted into the Supabase SQL Editor before you walk anything**, or you will hit known-broken behavior:

| Migration | What breaks without it |
|---|---|
| `supabase/migrations/037_fix_community_members_rls_recursion.sql` | **Communities is completely broken.** Any visit to `/homeowner/communities` errors with `infinite recursion detected in policy for relation "community_members"` — for demo *and* real users. |
| `supabase/migrations/038_fix_contractor_profiles_demo_leak.sql` | **Live data leak, active right now.** `contractor_profiles` is readable by anonymous clients with zero `is_demo` filtering. Verified directly: an anon-key query returns demo contractors ("General Contractor - Demo 1" etc.) mixed with real ones. Not walkthrough-blocking, but it's live in production. |

After applying, verify 038 with:
```sql
set role anon;
select id, business_name, is_demo from contractor_profiles;  -- expect zero is_demo = true rows
reset role;
```

---

## Environment

| Item | Value |
|---|---|
| **Test URL** | https://groundwork-platform-git-main-groundwork-b24989b8.vercel.app |
| **Production URL** | https://groundwork-platform.vercel.app (same build; `/` redirects to `/waitlist` pre-launch) |
| **Demo account** | `founder.demo@example.com` — **password not committed here**, see note below |
| **Commit being walked** | `7e829b7` (this branch: `design/gate4-walkthrough-prep`) — becomes the merge commit on `main` once PR #8 lands |
| **Dashboard entry point** | `/homeowner` (log in first; `/` goes to the waitlist, not the app) |

**Note on the test URL**: `main` auto-deploys to that alias. The walkthrough commit is on PR #8 — after merge, the alias serves it. Before merge, use the PR's own preview deployment.

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
**Status: PARTIALLY FIXED — still blocked by migration 037.**

Two real app-code bugs found and fixed:
1. The page looked up the current user's own ZIP from `properties` filtered by `is_demo=false`. That's a misapplication of demo isolation — the rule (WARP.md §14) exists to hide demo rows from *other* users, not to hide a demo account's own data from itself. The founder demo account could never find its own property, so the page showed "No ZIP code found. Complete onboarding first."
2. The page selected and inserted `member_count`, `post_count`, and `is_demo` columns that **do not exist** on the real `communities` table (per migration 005). Rewrote to select real columns and compute the counts via `community_members` / `community_posts` count queries; the create-community insert now supplies the actually-required `creator_id` and `name`.

Evidence: `tests/e2e-screenshots/gate4/bug3-communities.png` — confirms no marketing header on the authenticated page (no "Sign in" / "Get started free" chrome).

**Honest caveat**: that screenshot currently shows the RLS recursion error, because migration 037 isn't applied. The header assertion (the literal Bug #3 ask) passes; the page still won't render a real community until you apply 037.

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

1. **Communities is broken until migration 037 is applied.** Expect `infinite recursion detected in policy for relation "community_members"`. Known, fix written, needs your SQL Editor.
2. **`/homeowner/communities/[id]` (community detail page) is broken independently of 037.** It queries a `posts` table with columns (`author_id`, `content`, `reply_count`) that don't match the real `community_posts` schema (`user_id`, `title`, `description`, `photo_urls`, `project_type`, `budget_min`, `budget_max`). This is a redesign of the post-creation flow, not a one-line fix — deliberately not attempted this session, it's well outside "Bug #3".
3. **Anonymous `contractor_profiles` demo leak is live until migration 038 is applied.** Found while checking task item 2 (demo-row leakage). Predates this batch by ~4 migrations.
4. **Contractor-side experience is unwalked.** Everything verified this session was the homeowner journey on `founder.demo@example.com`. The contractor dashboard, contractor onboarding, and contractor-side chat have not been exercised.
5. **`app/contractor/[id]` appears unreachable.** Nothing in the current nav links to it (live links point to `/contractors/[id]`, a different route). Its back-links were fixed anyway, but the page may be dead code.
6. **Phases 5–7 untouched** (empty states, microcopy, dashboard CTA hierarchy, growth tooling, final close-out). Per EXECUTION.md these were never started — not regressions.
7. **Waitlist items still open from Phase 2**: admin dashboard content as a logged-in admin, milestone flip at exactly 3 referrals (boundary at 1 confirmed correct), custom domain.
8. **Pre-existing lint errors** (6 errors / 6 warnings across the touched files) — identical count on `main` before this batch. Not introduced here, not cleaned up (out of scope).
9. **Demo password is plaintext in 7 files in a public repo** (pre-existing, prior decision accepted it, verified low blast radius — see the Environment note). Also `FINAL_REVIEW.md` mislabels the demo account as "Admin User" when it's homeowner-role.

---

## Test results — honest, zero skips

Full Playwright suite, run against local dev with the repaired demo data:

```text
12 tests total — 12 passed, 0 failed, 0 skipped
```

One caveat worth stating plainly: on the first full-suite run with 4 parallel workers, `design-loading-screen.spec.ts`'s duration assertion failed at 3650ms against a 3500ms budget. Re-run in isolation it passes at ~3242ms. That's parallel-worker CPU contention on this machine, not a regression — but it *is* a genuinely tight assertion that will flake again under load. Flagging rather than quietly widening the threshold on an already-merged test.

Suites: `design-loading-screen` (4), `gate-4-matches` (2), `gate4-walkthrough-prep` (4), `phase1-estimate-verification` (1), `phase2-waitlist` (1).

`npm run build` — clean.

---

## Things I want a human opinion on

1. **Why did the demo data disappear?** Matches, conversations, messages, and the community row were all gone from the live DB while the project and property survived. That's a selective deletion pattern, not a full purge. Was `purge_demo_data()` run manually? Something else? If the cause is still live, the walkthrough data may vanish again mid-walkthrough. **I could not determine this and it worries me most.**

2. **Is `app/contractor/[id]` dead code?** Nothing links to it; `/contractors/[id]` is what live nav uses. I fixed its back-links rather than deleting it, but if it's dead it should probably go — and if it's *not* dead, I want to know what reaches it, because its "Back to matches" had no project context available at all.

3. **How should the communities detail page actually work?** Fixing item #2 above means picking a real post model. The existing `community_posts` schema is project-shaped (title, budget range, project type, photos) but the page was written expecting a simple text feed (content, reply_count). Those are different products. Which did you intend?

4. **Migration application process.** Three separate batches now have ended with "migration written, founder must paste it." If there's a way to give the agent environment scoped DDL access, that removes a recurring bottleneck and a real class of "documented but not actually fixed" risk — CodeRabbit flagged exactly this on PR #8, and it was right that documentation alone doesn't remediate a live environment.

5. **The 80% gate on a thin dataset.** The demo project has exactly 4 matches, 3 above gate. After hearting/passing through them the UI correctly shows "You're all caught up" — which is right, but makes the matches screen look empty for most of a walkthrough. Worth seeding more before demoing to anyone external?
