# Agent Handoff — Read This First

**If you are an AI agent (Claude in Claude Code, Claude/another model in Warp, or anything else) picking up work on this repo, read this entire file before touching code.** It's written to be re-read cold every session — don't assume you remember anything from a prior conversation.

Last updated: 2026-07-09, by Claude (Claude Code) working with Ryan.

## What this project is

Groundwork: a two-sided marketplace. Homeowners get a free AI cost estimate, then swipe-match with contractors who fit their budget. Contractors pay a flat monthly subscription for leads — no per-job cut. Full business model and growth strategy: `docs/LAUNCH_PLAN.md`. Read that after this file.

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

- If it returns data (even `[]`) with no error: the migration is applied, proceed with the rest of this doc.
- If it returns `{"message":"column contractor_profiles.lat does not exist"}`: the migration `supabase/migrations/006_contractor_location.sql` has NOT been run yet. It must be pasted into the Supabase SQL Editor and run before issues #12 and #14 can be verified or closed. There is no way to run it via CLI without a Supabase personal access token or database password, neither of which is stored anywhere — ask Ryan to paste it in himself (takes 10 seconds), or ask him for one of those credentials to automate it going forward.

## Current status (as of 2026-07-09)

| # | Title | Status |
|---|---|---|
| 2 | Verify AI integration works live | **CLOSED** — verified with real Claude output on production |
| 3 | Seed backend demo data | Data seeded (3 contractors, 27 cost_data rows), but full verification blocked on #14 |
| 4 | Rework estimate flow into public lead magnet | Not started |
| 5 | Stripe integration | Not started — assigned to Sameer |
| 6 | Pre-launch hardening | Not started, depends on #3/#4 |
| 7 | Final QA + launch checklist | Not started, the launch gate |
| 8 | Job completion + review flow (data moat) | Not started |
| 9 | Contractor waitlist | Not started — zero dependencies, quick win |
| 10 | Forgot-password flow | Not started — zero dependencies, quick win |
| 11 | Homeowner preference profiling | Not started |
| 12 | Fix createAdminClient() RLS bug | Code fixed + deployed, verification blocked on the migration above |
| 13 | Fix cost_data lookup (trade_id not text) | **CLOSED** — verified live, seeded data now correctly surfaces in estimates |
| 14 | [CRITICAL] Candidate matching returns zero results | Code fixed + deployed, verification blocked on the migration above |

**Read the full text of every open issue before working on it** — each one has verified current-state notes, exact file references, and acceptance criteria. Don't re-derive context that's already written down.

## Immediate next steps, in order

1. Confirm the migration ran (see above). If not, get it run.
2. Re-verify #14 live: sign up a fresh test homeowner + contractor pair via the actual `/signup` flow (not just SQL inserts), submit a real project, confirm the contractor actually appears as a swipeable candidate. See "How to verify anything" below.
3. Re-verify #12 live: hit `/api/density?zip=<seeded ZIP>` both logged out and logged in as any user, confirm identical results.
4. Close #3 once #14 is confirmed.
5. Pick up #9 (waitlist) and #10 (forgot password) — zero dependencies, can be done any time, good quick wins.
6. Sameer: #5 (Stripe) — see his task PDF, or just read issue #5 directly.
7. After that: #4, #8, #11 in whatever order makes sense, then #6, then #7 (launch gate).

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
- Full plan + business model narrative: `docs/LAUNCH_PLAN.md`
- Sameer's specific task brief: `Groundwork_Tasks_for_Sameer_2026-07-08.pdf` (was placed on Ryan's Desktop, not in the repo — ask Ryan for a copy if you need it, or just read issue #5 directly, it has the same content).

## Keeping this file current

If you're an agent that just closed an issue, fixed a bug, or changed the plan: **update the status table and "immediate next steps" section above before ending your session.** This file is only useful if it stays accurate. Stale status here is worse than no file at all — someone will trust it and waste time.
