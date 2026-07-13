# Groundwork — 14-Day Sprint Plan

**For:** Ryan + Sameer + Armin
**Date:** 2026-07-13 → 2026-07-26
**Companion docs:** `LAUNCH_PLAN.md` (the 11 tracks this plan schedules), `GROWTH_OPERATOR_ROLE.md` (Armin's full brief), `BUSINESS_MODEL.md`, `FINANCIAL_PLAN.md`

## What this plan is

Fourteen days, three people, every existing track from `LAUNCH_PLAN.md` assigned to a specific person on a specific day. This isn't a new plan — it's the existing 11 tracks and issues #2–#19, scheduled. The goal for day 14 isn't "launched" (the original estimate for the full launch gate was ~3 weeks even before the new features this session added) — it's **launch-gate code complete and QA'd, waitlist and content loop running at pace, ready to set a firm launch date**.

## Ground truth as of day 1 (checked live, 2026-07-13)

**Migrations 006 and 007 are still not applied** — re-checked directly against Supabase's API this morning, same errors as four days ago. This is not a "someday" task. It is the first thing that happens on day 1, before anything else, because #3, #9, #12, and #14 are all sitting behind it.

## The three lanes

| | Owner | Primary focus this sprint |
|---|---|---|
| **Lane R** | Ryan | Product build: lead magnet, preferences, matching v2, review flow |
| **Lane S** | Sameer | Payments + new monetization: Stripe, Homeowner Plus, referral logic |
| **Lane A** | Armin | Growth: content, waitlist video, outreach, referral adoption — runs continuously, not sequentially |

Lane A doesn't block or get blocked by Lanes R/S. It runs all 14 days in parallel, per `GROWTH_OPERATOR_ROLE.md`.

## Day 1 — unblock everything

**All three, first thing:**
- Ryan or Sameer pastes `supabase/migrations/006_contractor_location.sql` and `007_contractor_waitlist.sql` into the Supabase SQL Editor. ~2 minutes each. This has been the single blocker for four days — it ends today.
- Once confirmed live: re-verify #14 (candidate matching) and #12 (RLS bug) with a real signup flow, not SQL inserts. Close both same day if they check out. Close #3 and #9 the same way once verified.
- Decide the two outstanding fast decisions that don't need a build: **custom domain (buy now vs. defer)** and **does Homeowner Plus (#15) replace or supplement the $9.99 unlock** (Sameer needs this before touching Stripe's product catalog). Both take 10 minutes of conversation, not days — do them today so they don't block the rest of the sprint.
- Armin: read `GROWTH_OPERATOR_ROLE.md` in full, start the content calendar and the real-estate-agency/PE-group outreach list.

## Week 1 (Days 1–7)

| Day | Lane R — Ryan | Lane S — Sameer | Lane A — Armin |
|---|---|---|---|
| 1 | Migrations + re-verify #12/#14 live, close if clean | Migrations (with Ryan) + confirm #15's open question | Read role brief, start content calendar + outreach list build |
| 2 | Close #3 (seed data) once #14 confirmed. Start #4 (lead magnet) | Start #5 Stripe — now 4 products: Standard $79, Growth $149, $9.99 unlock, **new** $20/mo Homeowner Plus | First content post live. Waitlist video: script + concept locked |
| 3 | #4 continued | #5 continued — coupon/discount logic for the referral ladder (#16) needs this same billing work, do it together | Waitlist video: AI generation pass |
| 4 | #4 finished — public estimate flow live with zero signup required | #5 finished and tested in Stripe test mode. Start #15 backend (Homeowner Plus gating + Communities schema/RLS) | Waitlist video: audio + edit. Outreach list: start sending |
| 5 | #11 Homeowner preference profiling (2-3 quick onboarding questions) | #15 continued — Communities MVP: post + comment, homeowner-only visibility enforced | Content cadence continues. Coordinate with Ryan/Sameer on waitlist landing page dev handoff |
| 6 | #8 Job completion + review flow — UI and the "24h after payment" trigger logic (trigger itself needs #5's payment-confirmed webhook, coordinate with Sameer) | #16 Referral program — discount ladder (5 refs → $5/mo, 10 refs → $10/mo), depends on #15 | Waitlist landing page goes live (video + signup form, #18) once dev-ready |
| 7 | #8 finished, wired end to end | Buffer — bug fixes from #15/#16, help finish #8's payment trigger | **Week 1 checkpoint**: report waitlist count vs. pace |

**Week 1 exit criteria:** #3, #9, #10, #12, #14 all closed. #4, #5, #8, #11 done. #15, #16 built (may still have rough edges, that's fine — QA catches those in week 2). Waitlist live and collecting signups.

## Week 2 (Days 8–14)

| Day | Lane R — Ryan | Lane S — Sameer | Lane A — Armin |
|---|---|---|---|
| 8 | #17 Matching v2 — percentage score + multi-portal weighting (depends on #11, done) | Polish #15 (photo upload on community posts) + #16 (anti-abuse pass — self-referral/fake-account check, flagged as unscoped in #16) | Content continues. Push referral-loop messaging now that #16 is live |
| 9 | #17 continued | SMS integration (#6) kickoff — full integration is a 2-3 week task per the original estimate, this sprint gets it started (ToS/privacy policy language, consent checkbox on waitlist form), not finished | Outreach list: continue working it, track response rate |
| 10 | #17 finished. Start #6 hardening: contractor verification (manual review flag) | #6 hardening: email notifications (new match / new message) | Content + outreach continue |
| 11 | #6 continued: custom domain wired in Vercel (name decided day 1) | #6 continued, help with email notification testing | Content + outreach continue |
| 12 | #7 Final QA — walk full homeowner journey end to end | #7 Final QA — walk full contractor journey end to end, together with Ryan | Content + outreach continue |
| 13 | Fix bugs found in #7 QA | Fix bugs found in #7 QA | Content + outreach continue |
| 14 | **Sprint close: launch-gate review** | **Sprint close: launch-gate review** | **Sprint close: waitlist number vs. 5,000/60-day pace, report and adjust channel if off-pace** |

**Week 2 exit criteria:** #6 and #7 done or within a day of done. #17 done. SMS integration in progress, not necessarily finished (realistic — the original estimate for that alone is 2-3 weeks). Waitlist and content loop running at a known, measured pace.

## What this sprint deliberately does not finish

- **SMS integration (#6)** — starts day 9, won't fully complete in 14 days given its own 2-3 week estimate. That's fine; day 14 target is "started, ToS updated, consent flow live," not "done."
- **Referral anti-abuse hardening (#16)** — flagged as unscoped when the issue was filed; gets a first pass in week 2, not a full security review.
- Everything already excluded from `LAUNCH_PLAN.md`'s launch gate stays excluded here too: full admin dashboard, automated license/insurance verification, property-manager-specific UI beyond the matching engine's weight profile, dispute resolution workflow, 2FA.
- **A firm launch date isn't set by this plan** — that's still an open founder decision (`AGENT_HANDOFF.md`). Day 14 is when there's enough real information (QA passed, waitlist pace known) to set one with confidence instead of guessing.

## Checkpoints, not just a day-14 review

Waitlist pace is the one number to watch **weekly, not just at the end** — the day-7 checkpoint above exists specifically so a slow start gets a channel change on day 8, not a surprise on day 14. Same logic as `GROWTH_OPERATOR_ROLE.md`: adjust early, don't wait for the deadline to find out something isn't working.
