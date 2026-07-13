# Agent Handoff — Read This First

**If you are an AI agent (Claude in Claude Code, Claude/another model in Warp, or anything else) picking up work on this repo, read this entire file before touching code.** It's written to be re-read cold every session — don't assume you remember anything from a prior conversation.

Last updated: 2026-07-13, by Claude (Claude Code) working with Ryan, after the 2026-07-13 founder working session (Ryan + Sameer in person, Granola transcript pasted in). **The migration blocker below is unchanged and still open 4+ days — was on the meeting's action list to run live, re-checked after and it still isn't done.**

## What this project is

Groundwork: a two-sided marketplace. Homeowners get a free AI cost estimate, then swipe-match with contractors who fit their budget. Contractors pay a flat monthly subscription for leads — no per-job cut, plus a new $20/mo Homeowner Plus tier (Communities feature) added 2026-07-13. Full business model and growth strategy: `docs/LAUNCH_PLAN.md` (build sequencing), `docs/BUSINESS_MODEL.md` (revenue streams, portals, referral loop — new 2026-07-13), `docs/FINANCIAL_PLAN.md` (revenue distribution, organic-only-until-$1M-pre-seed plan — new 2026-07-13). Read all three after this file.

- Live site: https://renova-platform.vercel.app (auto-deploys from GitHub `main`)
- Repo: github.com/Rycrypn/Groundwork-platform (private)
- All work tracked as GitHub issues under Epic #1: `gh issue list` or the repo's Issues tab
- Owners: Ryan (Rycrypn) and Sameer (sameerskyai), both with GitHub admin access

## THE ONE THING TO CHECK FIRST, EVERY SESSION

Run this before doing anything else — it tells you whether the pending database migration has been applied yet:

```bash
curl -s "https://dhmxxywdsdxzzcuezztv.supabase.co/rest/v1/contractor_profiles?select=lat,lng,zip_code&limit=1" \
  -H "apikey: <SUPABASE_SERVICE_ROLE_KEY>" -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"
```

- If it returns data (even `[]`) with no error: migration 006 is applied. Also confirm 007 (`contractor_waitlist` table) the same way: `...rest/v1/contractor_waitlist?select=id&limit=1`.
- If it returns `{"message":"column contractor_profiles.lat does not exist"}`: **TWO pending migrations have not been run** — `supabase/migrations/006_contractor_location.sql` (blocks verifying #12/#14) and `supabase/migrations/007_contractor_waitlist.sql` (blocks closing #9). Both must be pasted into the Supabase SQL Editor. There is no way to run them via CLI without a Supabase personal access token or database password, neither of which is stored anywhere — ask Ryan to paste them himself (takes 10 seconds each), or ask him for one of those credentials to automate this going forward.

## Current status (as of 2026-07-13, post-meeting)

| # | Title | Status |
|---|---|---|
| 2 | Verify AI integration works live | **CLOSED** — verified with real Claude output on production |
| 3 | Seed backend demo data | Data seeded (3 contractors, 27 cost_data rows), but full verification blocked on #14 — still blocked, migrations not run |
| 4 | Rework estimate flow into public lead magnet | **Confirmed Ryan's active priority, starting now** (2026-07-13 session) |
| 5 | Stripe integration | Not started — Sameer's track; timeline still **unconfirmed** (was a meeting agenda item, not resolved); scope grew by one product (Homeowner Plus, #15) — read `docs/prompts/issue-5-stripe-integration.md` and the 2026-07-13 comment on #5 |
| 6 | Pre-launch hardening | Not started, depends on #3/#4; scope grew to include SMS integration (2026-07-13) |
| 7 | Final QA + launch checklist | Not started, the launch gate |
| 8 | Job completion + review flow (data moat) | Not started; review trigger now specified — 24h after payment confirmed, "do you recommend" framing (2026-07-13) |
| 9 | Contractor waitlist | **Built + deployed + UI verified live.** Still blocked on migration 007 — re-checked 2026-07-13, still not applied |
| 10 | Forgot-password flow | **Built + deployed + UI verified live.** Remaining: Ryan tests the real email loop with his own inbox, confirms redirect URL in Supabase Auth config |
| 11 | Homeowner preference profiling | Not started |
| 12 | Fix createAdminClient() RLS bug | Code fixed + deployed, still blocked on migration 006 — re-checked 2026-07-13, still not applied |
| 13 | Fix cost_data lookup (trade_id not text) | **CLOSED** — verified live |
| 14 | [CRITICAL] Candidate matching returns zero results | Code fixed + deployed, still blocked on migration 006 — re-checked 2026-07-13, still not applied |
| 15 | Homeowner Plus subscription + Communities (**new**) | Not started — model in `docs/BUSINESS_MODEL.md`, open question on unlock-fee interaction needs Sameer's confirmation |
| 16 | Referral program / discount ladder (**new**) | Not started, depends on #15 |
| 17 | Matching v2: score + multi-portal (**new**) | Not started, depends on #11 |
| 18 | Waitlist landing page + video (**new**) | Not started, depends on launch-date decision below |
| 19 | Growth Operator track — Armin (**new**) | Ongoing, no dependencies — start immediately. Track 11 in `docs/LAUNCH_PLAN.md`, full brief `docs/GROWTH_OPERATOR_ROLE.md` |

**Read the full text of every open issue before working on it** — each one has verified current-state notes, exact file references, and acceptance criteria. Don't re-derive context that's already written down.

## Open decisions from the 2026-07-13 session — none resolved yet, all need a founder answer

1. **Sameer's Stripe (#5) start/finish date** — was on the agenda, not decided
2. **Launch target date and definition** — "October" floated as a rough target, not firm. "Launch" also needs a concrete definition: which metro ZIPs, minimum contractor count recruited first
3. **Custom domain**: buy now or defer to #6 — and the name itself, undecided
4. **Armin's commitment to the founder content plan** — flagged as an alignment risk in the session (stubborn, pullable by social obligations); needs to be resolved before the 60-day build sprint the content plan depends on
5. **Founder equity/compensation split** — not discussed in dollar/percentage terms at all; `docs/FINANCIAL_PLAN.md` treats founder distributions as a placeholder line item until this exists as a real agreement — don't infer a split from role descriptions

## Immediate next steps, in order

1. **Get migrations 006 + 007 run.** This has now been the single blocker for four issues (#3, #9, #12, #14) for 4+ days, was flagged as a meeting action item, and is still not done as of the last check this session. Nothing here changes until this happens — stop re-deriving this, just get it run.
2. Re-verify #14 live: sign up a fresh test homeowner + contractor pair via the actual `/signup` flow, submit a real project, confirm the contractor appears as a swipeable candidate.
3. Re-verify #12 live: hit `/api/density?zip=<seeded ZIP>` both logged out and logged in, confirm identical results.
4. Close #3 once #14 is confirmed. Close #9 once a waitlist submission lands in the table. Close #10 once Ryan completes a real email reset loop.
5. Ryan: #4 (lead magnet) — confirmed active priority.
6. Sameer: #5 (Stripe) — needs a start date decision first (see open decisions above), then read `docs/prompts/issue-5-stripe-integration.md` plus the 2026-07-13 comment on #5 about the new fourth product.
7. Resolve the five open decisions above — these are blocking real planning (launch date, domain, Stripe timeline) more than any code issue right now.
8. Then #8, #11, #15, #16, #17, #18, then #6, then #7 (launch gate).

Also note: the Vercel CLI token on Ryan's machine expired (2026-07-09) — `vercel` CLI and direct API calls with the cached token return "Not authorized." Re-run `vercel login` when CLI access is next needed. Deploys are unaffected (they run via GitHub integration).

## Hard-won lessons from this session — don't repeat these mistakes

1. **Verify live, not just in code.** Every bug found this session (#12, #13, #14) looked correct on a code read. All three were only caught by actually signing up real test accounts through the live UI and checking real API responses. Reading code is not verification. If you claim something "works," you should have watched it work.
2. **RLS silently nulls joined data instead of erroring.** Twice, a Supabase query joining to a table the current session can't read (`profiles`, locked to `auth.uid() = id`) returned `null` for that relation instead of failing loudly. This produces confusing bugs (empty match lists, undercounted density) with no error in the logs. If a query result looks wrong and involves a joined/nested `select()`, check RLS on the joined table before assuming the filter logic is wrong.
3. **`createAdminClient()` passing cookies defeats its own purpose.** `@supabase/ssr`'s `createServerClient` uses the session's access token over any key you pass it, whenever a session exists in cookies. A true admin/service-role client must not be cookie-aware — use plain `@supabase/supabase-js`'s `createClient()` instead. Already fixed in `lib/supabase/server.ts`; don't reintroduce the cookie-aware version.
4. **AI-generated text is not a reliable join key.** `cost_data` lookups used to match on the classifier's freeform `project_type` string, which varies wording run to run for the same underlying project. Match on `trade_id` (a real foreign key) instead, never on AI-generated prose.
5. **Vercel can be the problem, not your code.** Mid-session, two deployments stalled in `INITIALIZING` for 5+ minutes with zero build logs. Check `https://www.vercel-status.com/api/v2/status.json` before assuming a broken deploy config — there was an active platform incident ("Delays Processing Builds").
6. **No `timeout` command on macOS by default**, and long inline `sleep` chains get blocked by the harness. Use `run_in_background: true` + a polling loop with a bounded iteration count, or the `Monitor`/`ScheduleWakeup` tools for anything that takes more than ~30 seconds.
7. **A hanging `next dev` with zero output usually means corrupted `node_modules`**, not a code bug — confirmed by testing the exact same Next.js version in a fresh empty directory. `rm -rf node_modules && npm ci` fixed it. Don't spend time debugging app code if `next dev` never even prints its startup banner.

## How to verify anything (the methodology used this session)

Don't trust that a fix works because the diff looks right. For this project specifically:

1. Use the `browse` tool (`~/.claude/skills/gstack/browse/dist/browse`, gstack skill) to drive a real headless browser against the live production URL — sign up real test accounts (`role=homeowner` / `role=contractor`), complete onboarding, submit real projects, read the real rendered text.
2. Cross-check with direct API calls (`curl` against `/api/...` routes, or directly against Supabase's REST API with the service-role key for ground-truth data state) when the UI result is ambiguous.
3. Check Vercel function logs (`vercel logs <url> --since <time>`) for server-side errors the UI won't surface.
4. Only close a GitHub issue after you've watched the actual behavior change, and paste the evidence into the issue comment when you close it — every closed issue in this repo has a comment showing exactly what was tested and what the result was. Keep that standard.

## Where things live

- Supabase project: `dhmxxywdsdxzzcuezztv` (us-west-2). Credentials in `.env.local` (gitignored) and Vercel env vars.
- Vercel project: `groundwork55/groundwork-platform` (renamed mid-session from `renova-platform` — the `.vercel.app` alias `renova-platform.vercel.app` still works).
- Anthropic API key: set in Vercel Production + Preview only (Vercel blocks sensitive vars from Development). For local dev, add it to your own `.env.local` by hand.
- Full plan + build sequencing: `docs/LAUNCH_PLAN.md`
- Business model (revenue streams, portals, referral loop): `docs/BUSINESS_MODEL.md`
- Financial plan (revenue distribution, organic-only-until-pre-seed, fundraising trigger): `docs/FINANCIAL_PLAN.md`
- Growth Operator role brief (Armin's responsibilities, waitlist pace metric): `docs/GROWTH_OPERATOR_ROLE.md`
- 14-day sprint plan (day-by-day schedule across all three people, 2026-07-13 → 2026-07-26): `docs/SPRINT_14_DAY_PLAN.md`
- **`docs/prompts/`** — per-issue execution briefs (step-by-step prompts written for an AI agent, e.g. Warp, to run a specific issue end to end, pre-checked against the real code). Check here before starting any issue — if a brief already exists for it, use that instead of re-deriving the plan from scratch.
- Sameer's specific task brief: `Groundwork_Tasks_for_Sameer_2026-07-08.pdf` (was placed on Ryan's Desktop, not in the repo — ask Ryan for a copy if you need it, or just read issue #5 directly, it has the same content).

## Convention: always commit agent-facing artifacts to the repo

Any execution prompt, task brief, or step-by-step written for an AI agent to run gets saved to `docs/prompts/<issue-or-topic>.md` and committed — never left only in a chat transcript or a local file outside the repo. This is what makes it possible for Ryan, Sameer, and any future agent session to all work from the same source of truth instead of re-explaining context every time. If you write a brief like this, save it here before (or as part of) executing it.

## Keeping this file current

If you're an agent that just closed an issue, fixed a bug, or changed the plan: **update the status table and "immediate next steps" section above before ending your session.** This file is only useful if it stays accurate. Stale status here is worse than no file at all — someone will trust it and waste time.
