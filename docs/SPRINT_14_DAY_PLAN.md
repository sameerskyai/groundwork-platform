# Groundwork — 14-Day Sprint Plan (v2: Beta 1)

**For:** Ryan + Sameer + Armin
**Date:** 2026-07-13 → 2026-07-26
**Supersedes:** the v1 schedule in this file's prior version (day-per-task pacing). Rebuilt around real Ryan/Sameer capacity — 18h/day, no noise, signal only.
**Companion docs:** `LAUNCH_PLAN.md` (the 11 tracks), `GROWTH_OPERATOR_ROLE.md` (Armin's brief), `BUSINESS_MODEL.md`, `FINANCIAL_PLAN.md`

## What changed from v1, and why

v1 paced each issue at roughly a calendar day, matching normal part-time-adjacent estimates. At 18h/day focused work from both Ryan and Sameer, that's wrong by a wide margin — most of those "1-2 day" tasks are hours, not days, at this intensity.

**But the extra time isn't spent inventing more line items to fill a calendar.** It's spent on the thing that actually makes "Beta 1" mean something: real outside users in the product, with days of runway to fix what breaks under real usage before calling it done. Code passing your own QA is not the same claim as a stranger successfully getting matched with a contractor. This plan targets **Beta 1 live to a real cohort by Day 9**, then uses Days 10–14 as live iteration, not more internal building.

**One honest constraint that hours can't compress:** SMS integration (#6) involves carrier/compliance approval lag that doesn't move faster because you work more hours — it's external to your control. This plan starts it early and treats it as a background task that likely isn't finished by day 14 regardless. Flagging that now so it isn't a day-13 surprise.

## The shape of it

- **Days 1–6: Build.** Every remaining track from `LAUNCH_PLAN.md` (#3, #4, #5, #6 core, #8, #9, #10, #11, #12, #14, #15, #16, #17, #18) gets built. Migrations unblock everything on Day 1, hour 1.
- **Days 7–8: Harden + QA.** Both of you, full focus, breaking your own product on purpose.
- **Day 9: Beta 1 opens.** Real users — first cohort from the waitlist plus personal network — get real access.
- **Days 10–13: Live iteration.** You're now fixing what real usage actually breaks, not hypothetical edge cases. This is higher-signal debugging than anything in days 1–8.
- **Day 14: Retro + firm launch date.** By now you have real activation, match, and (if any land) job-completion data — enough to set a public launch date with actual evidence instead of a guess.

## Days 1–6: Build

| Day | Ryan | Sameer | Armin (parallel, unchanged pace logic from `GROWTH_OPERATOR_ROLE.md`, compressed timeline) |
|---|---|---|---|
| **1** | Migrations (with Sameer) → re-verify #12 + #14 live, close both → close #3, close #9. Decide domain name (10 min, with Sameer). Start #4 lead magnet, aim to finish same day. | Migrations (with Ryan) → decide with Ryan whether Homeowner Plus (#15) replaces or supplements the $9.99 unlock (10 min, needed before Stripe catalog work) → build #5 Stripe base products (Standard $79, Growth $149, $9.99 unlock) → start Homeowner Plus product. | Read `GROWTH_OPERATOR_ROLE.md`, build the outreach list (real estate agencies + PE real estate groups), draft content calendar, first post drafted. |
| **2** | Finish #4 if not done. #11 homeowner preferences (2-3 onboarding questions). Start #8 review flow UI. | Finish #5 Stripe incl. Homeowner Plus. Start #15 Communities backend — schema, RLS (homeowner-only visibility is the load-bearing rule here, see `BUSINESS_MODEL.md`'s anti-poaching section). | First content post live. Start outreach sends. Waitlist video: script + AI generation pass begins. |
| **3** | Finish #8 incl. the "24h after payment confirmed" trigger — needs Sameer's Stripe webhook, coordinate directly rather than over docs. Start #17 matching v2 scoring engine (85%+ threshold, budget/ZIP/timeframe/personality factors). | #15 Communities MVP: post + comment, photo upload, homeowner-can-create / realtor-can-create. Payment-confirmed webhook for #8 (coordinate with Ryan). | Video generation continues. Content cadence holds. Outreach continues. |
| **4** | Finish #17 (multi-portal weighting: homeowner/contractor/realtor share one engine, different weights). Start #18 landing page dev (form + video embed — video itself is Armin's). | Finish #15. Start #16 referral program — discount ladder (5 refs → $5/mo, 10 refs → $10/mo), depends on #15. | Video finalized, handed to Ryan for embed. Content + outreach continue. |
| **5** | Finish #18, video live on the page. Start #6 hardening: contractor verification (manual review flag), email notifications. | Finish #16 incl. Stripe coupon wiring for the discount ladder. Start #16 anti-abuse pass (self-referral / fake-account check — flagged unscoped when #16 was filed, first real pass now). Help wire domain in Vercel. | **Waitlist landing page goes public.** Push content hard now that there's somewhere real to send traffic. Outreach continues. |
| **6** | Finish #6 core (verification, notifications, domain). Full-day bug bash across everything built so far — #4, #8, #11, #15, #16, #17, #18. | Start #6 SMS: ToS/privacy policy language, consent checkbox on waitlist form, vendor selection — this is the part that *can* move now; full carrier-approved integration is the part that can't be rushed. Join the bug bash. | Content + outreach continue. First referral-loop messaging now that #16 is live. |

**End of Day 6 checkpoint:** #3, #4, #5, #6 (core, minus SMS), #8, #9, #10, #11, #12, #14, #15, #16, #17, #18 all built. This is every track from `LAUNCH_PLAN.md` except SMS's external approval step and final QA.

## Days 7–8: Harden + QA

- **Day 7**: Ryan and Sameer independently walk the full homeowner journey and the full contractor journey end to end (#7's original acceptance criteria) — signup through match through (simulated) payment through review prompt. Log every rough edge, not just breaks. Fix anything critical same day.
- **Day 8**: Regression pass on fixes from Day 7. Confirm Stripe test-mode transactions work for all four products including the referral discount. Confirm the Communities homeowner-only visibility rule actually holds (a contractor account should not be able to see or post in a community thread — verify this directly, don't assume the RLS policy is enough given the RLS-silently-nulls lesson already in `AGENT_HANDOFF.md`). Armin preps the first invite cohort and beta invite messaging.

## Day 9: Beta 1 opens

Invite the first real cohort — the earliest waitlist signups plus personal network, not a public announcement. Both of you in a war-room posture: watch Vercel function logs and Supabase directly, fix anything that breaks in real time rather than batching it. This is the actual test the last 8 days of internal QA can't replace.

## Days 10–13: Live iteration

- Daily triage of real bugs and friction points from actual beta users — this list is higher-signal than anything generated internally, prioritize it above new feature work.
- SMS integration continues in the background, at whatever pace the external approval process allows.
- Watch whether `cost_data` actually starts accumulating from any completed jobs — the first real signal on whether the moat mechanism (#8) works outside a test account.
- Armin: daily (not weekly, given the pace) check-ins with beta users, push referral-loop adoption with real people now that there's a real loop to push, keep content flowing — you can now post real "we're live" material instead of pre-launch teasers.

## Day 14: Retro + firm launch date

All three, together: review real beta numbers — signups activated, matches made, any contractor drop-off, any trust/safety flags, waitlist pace against the 5,000/60-day target in `GROWTH_OPERATOR_ROLE.md`. This is the point where a **firm public launch date and metro/ZIP scope** gets set from actual evidence — the open decision that's been sitting unresolved since the 2026-07-13 session (`AGENT_HANDOFF.md`) — instead of picking a date and hoping.

## What's still deliberately not in scope for Day 14

Unchanged from `LAUNCH_PLAN.md`'s original exclusions, plus one addition specific to this compressed plan:

- Full admin dashboard, automated license/insurance verification API, property-manager-specific UI, dispute resolution workflow, 2FA — same as always, not launch-blocking
- **SMS integration fully live** — the compliance/carrier lag genuinely doesn't compress with more hours; treat "started, ToS updated, in the approval pipeline" as the realistic Day 14 state, not "done"
