# Groundwork — 14-Day Sprint Plan (v3: Full Capacity)

**For:** Ryan + Sameer + Armin
**Date:** 2026-07-13 → 2026-07-26
**Supersedes:** v2 (lighter pacing, reactive days 10–13). Rebuilt again at explicit direction: schedule every hour of Ryan and Sameer's 18h/day, no noise, backlog exhausted rather than left as slack.
**Companion docs:** `LAUNCH_PLAN.md` (core 11 tracks), `GROWTH_OPERATOR_ROLE.md` (Armin), `BUSINESS_MODEL.md`, `FINANCIAL_PLAN.md`

## What changed from v2

v2 deliberately left slack — QA depth and live-iteration time, no filler. This version fills it: every one of Ryan's and Sameer's 18 daily hours is assigned, for all 14 days, including days 10–13 which v2 left reactive. The extra capacity goes to a real backlog — 13 new tracked issues (#20–#32) covering admin/analytics, verification, trust & safety, Stripe hardening, test coverage, performance, security, legal copy, onboarding polish, email polish, docs, and beta feedback tooling. Nothing here is invented busywork; every block is a real, shippable, individually-scoped piece of work now sitting in GitHub.

**Still unchanged:** Beta 1 opens to a real cohort on Day 9, not Day 14 — that sequencing is a real dependency (you can't harden and QA before you build), not a pacing choice. And the one honest constraint from v2 still holds: SMS carrier/compliance approval (part of #6) doesn't move faster with more hours — it's scheduled to *start* early and gets checked on throughout, not force-completed.

## New backlog issues this version adds

| # | Title |
|---|---|
| [#20](https://github.com/Rycrypn/Groundwork-platform/issues/20) | Admin + founder analytics dashboard |
| [#21](https://github.com/Rycrypn/Groundwork-platform/issues/21) | Automated contractor verification research (Checkr) |
| [#22](https://github.com/Rycrypn/Groundwork-platform/issues/22) | Property manager portal build-out + realtor/PM pricing |
| [#23](https://github.com/Rycrypn/Groundwork-platform/issues/23) | Trust & safety: message filtering + flagging queue |
| [#24](https://github.com/Rycrypn/Groundwork-platform/issues/24) | Stripe hardening: dunning, invoices, subscription management |
| [#25](https://github.com/Rycrypn/Groundwork-platform/issues/25) | Automated integration test coverage |
| [#26](https://github.com/Rycrypn/Groundwork-platform/issues/26) | Performance + load testing pass |
| [#27](https://github.com/Rycrypn/Groundwork-platform/issues/27) | Security review pass + backup/DR verification |
| [#28](https://github.com/Rycrypn/Groundwork-platform/issues/28) | Legal: ToS + Privacy Policy real drafting |
| [#29](https://github.com/Rycrypn/Groundwork-platform/issues/29) | Onboarding UX polish (contractor + homeowner) |
| [#30](https://github.com/Rycrypn/Groundwork-platform/issues/30) | Email template polish (all transactional emails) |
| [#31](https://github.com/Rycrypn/Groundwork-platform/issues/31) | Internal documentation + onboarding runbook |
| [#32](https://github.com/Rycrypn/Groundwork-platform/issues/32) | Beta feedback intake system |

## Daily block structure

Six 3-hour blocks per person per day: **6–9a · 9a–12p · 12–3p · 3–6p · 6–9p · 9p–12a** = 18h. Armin's track keeps the pacing already defined in `GROWTH_OPERATOR_ROLE.md` — not hour-blocked the same way, since his work is continuous/creative rather than discrete build tasks.

---

## Day 1 — 2026-07-13

**Ryan**
- 6–9a: Migrations (with Sameer, ~30 min) → re-verify #12 + #14 live, close both → close #3, close #9
- 9a–12p: #4 lead magnet build
- 12–3p: #4 finish + verify live
- 3–6p: #11 homeowner preferences
- 6–9p: #29 — start contractor profile-completion wizard polish
- 9p–12a: #30 — welcome + password-reset email templates

**Sameer**
- 6–9a: Migrations (with Ryan) → decide domain name + Homeowner Plus/unlock question with Ryan (10 min each) → start #5 Stripe base products
- 9a–12p: #5 — Standard/Growth/$9.99 unlock products
- 12–3p: #5 — Homeowner Plus product + test-mode verification
- 3–6p: #24 — invoice/receipt email setup
- 6–9p: #22 — realtor/PM pricing model draft + Stripe product stub
- 9p–12a: #28 — ToS/Privacy: SMS consent + anti-poaching clause draft

**Armin**: read `GROWTH_OPERATOR_ROLE.md`, build the outreach list, draft content calendar, first post drafted.

## Day 2 — 2026-07-14

**Ryan**
- 6–9a: #8 review-flow UI
- 9a–12p: #8 — review prompt logic/framing
- 12–3p: #8 core finished (pending Sameer's webhook)
- 3–6p: #17 — matching v2 scoring engine
- 6–9p: #29 — homeowner preference-quiz polish
- 9p–12a: #26 — Lighthouse baseline audit + quick fixes

**Sameer**
- 6–9a: #15 Communities — schema/RLS
- 9a–12p: #15 — post/comment core
- 12–3p: #15 — homeowner-only visibility enforcement
- 3–6p: payment-confirmed webhook for #8 (coordinate with Ryan)
- 6–9p: #21 — Checkr API research
- 9p–12a: #28 — finish ToS/Privacy draft

**Armin**: first content post live, outreach sends begin, waitlist video script + AI generation pass begins.

## Day 3 — 2026-07-15

**Ryan**
- 6–9a: #17 scoring engine continued
- 9a–12p: #17 — multi-portal weighting
- 12–3p: #17 finish + test
- 3–6p: #18 landing page — form scaffold
- 6–9p: #20 — admin dashboard user-management table
- 9p–12a: #20 — basic analytics view (signups/matches)

**Sameer**
- 6–9a: #15 — photo upload
- 9a–12p: #15 finish — homeowner-create / realtor-create community types
- 12–3p: #16 referral program — schema, discount tiers
- 3–6p: #16 — link generation + tracking
- 6–9p: #6 SMS — Twilio vendor account + sandbox config
- 9p–12a: #27 — enable + verify Supabase point-in-time recovery

**Armin**: video generation continues, content post #2, outreach follow-ups.

## Day 4 — 2026-07-16

**Ryan**
- 6–9a: #18 — video embed integration
- 9a–12p: #18 finish + test live
- 12–3p: #22 PM portal — area-selection onboarding flow
- 3–6p: #22 — PM dashboard skeleton
- 6–9p: #23 — message filter (profanity/slur blocklist)
- 9p–12a: #23 — flagging queue UI (basic)

**Sameer**
- 6–9a: #16 finish — Stripe coupon wiring for the discount ladder
- 9a–12p: #16 — anti-abuse pass (self-referral/fake-account checks)
- 12–3p: #22 — finalize realtor/PM pricing + live test-mode product
- 3–6p: #24 — dunning/failed-payment retry logic
- 6–9p: #6 SMS — draft + submit carrier (10DLC) registration
- 9p–12a: #27 — RLS policy audit, pass 1 (core tables)

**Armin**: video finalized and handed off, content post #3, outreach continues.

## Day 5 — 2026-07-17

**Ryan**
- 6–9a: Bug bash — #4, #8, #11, #17, #18
- 9a–12p: bug bash continued
- 12–3p: #6 hardening — contractor verification lite
- 3–6p: #6 — email notifications (match/message)
- 6–9p: #31 — internal API docs, start
- 9p–12a: #25 — integration tests: signup + estimate flow

**Sameer**
- 6–9a: Bug bash — #5, #15, #16
- 9a–12p: bug bash continued
- 12–3p: #6 — domain wired in Vercel
- 3–6p: #6 SMS — final ToS/privacy copy, consent checkbox live on waitlist form
- 6–9p: #27 — Stripe webhook signature verification, secrets check
- 9p–12a: #26 — load-test script + run (concurrent signups)

**Armin**: **waitlist landing page goes public** — push content hard, monitor signups, outreach continues.

## Day 6 — 2026-07-18

**Ryan**
- 6–9a: finish #6 core items
- 9a–12p: full bug bash, everything built so far
- 12–3p: bug bash continued
- 3–6p: #20 — founder metrics wiring (churn/conversion)
- 6–9p: #26 — DB indexes / query optimization, round 2
- 9p–12a: #21 — Checkr stub integration

**Sameer**
- 6–9a: #6 SMS — whatever's actionable pre-approval
- 9a–12p: full bug bash (join Ryan)
- 12–3p: bug bash continued
- 3–6p: #20 — referral analytics dashboard
- 6–9p: #25 — integration tests: payment + matching flow
- 9p–12a: #32 — beta feedback widget + triage board

**Armin**: content + outreach continue at pace; first referral-loop push now that #16 is live.

**End of Day 6 checkpoint:** every core track (#3–#18) built. Days 7–8 are QA.

## Day 7 — 2026-07-19 (QA day 1)

**Ryan**: full homeowner journey, repeated passes across device/browser variants, all day — log every issue, fix critical ones same day.
**Sameer**: full contractor journey, same intensity, same day.
**Both**: joint evening triage session on what was found.
**Armin**: prep beta invite cohort + messaging.

## Day 8 — 2026-07-20 (QA day 2)

**Ryan**
- 6–9a: regression pass on Day 7 fixes
- 9a–12p: #27 — RLS audit close-out
- 12–3p: #29 — basic accessibility (WCAG) pass
- 3–6p: regression continued
- 6–9p: go/no-go prep
- 9p–12a: buffer

**Sameer**
- 6–9a: confirm all 4 Stripe products + referral discount end to end, test mode
- 9a–12p: directly verify Communities homeowner-only visibility (don't assume the RLS policy is enough)
- 12–3p: #26 — performance, final pass
- 3–6p: regression continued
- 6–9p: joint go/no-go review
- 9p–12a: buffer

**Armin**: finalize invite list + messaging, queue sends for Day 9 morning.

## Day 9 — 2026-07-21 — Beta 1 opens

**Ryan + Sameer**: war-room posture all day — monitor Vercel/Supabase logs live, fix real-time issues as they surface.
**Armin**: send invites, personal follow-up with early testers, real-time feedback collection, "we're live" content.

## Day 10 — 2026-07-22

**Ryan**: 6a–3p bug triage from real users → 3–6p: #22 PM portal finish → 6–9p: #31 docs continued → 9p–12a: triage buffer
**Sameer**: 6a–3p bug triage → 3–6p: #21 Checkr integration polish → 6–9p: #6 SMS — check carrier approval status → 9p–12a: triage buffer
**Armin**: daily check-ins with beta users, content + outreach continue.

## Day 11 — 2026-07-23

**Ryan**: bug triage AM/midday → 3–6p: #30 remaining transactional email templates → 6–9p: #20 analytics dashboard polish → 9p–12a: buffer
**Sameer**: bug triage AM/midday → 3–6p: #20 referral analytics polish → 6–9p: #24 dunning flow testing → 9p–12a: buffer
**Armin**: daily check-ins, referral-loop push with real users.

## Day 12 — 2026-07-24

**Ryan**: bug triage AM/midday → 3–6p: #26 performance re-audit → 6–9p: #32 feedback-system polish → 9p–12a: buffer
**Sameer**: bug triage AM/midday → 3–6p: #27 secrets-rotation check → 6–9p: #27 backup/DR final verification → 9p–12a: buffer
**Armin**: daily check-ins, content continues.

## Day 13 — 2026-07-25

**Ryan**: bug triage AM/midday → 3–6p: #31 onboarding runbook finished → 6–9p: buffer for anything slipped → 9p–12a: buffer
**Sameer**: bug triage AM/midday → 3–6p: #6 SMS status check, whatever's actionable → 6–9p: buffer → 9p–12a: buffer
**Armin**: daily check-ins, prep Day-14 waitlist/beta numbers for the retro.

## Day 14 — 2026-07-26 — Retro + firm launch date

All three, together: review real beta metrics via #20's dashboard (activation, matches made, contractor drop-off, any trust/safety flags), waitlist pace against the 5,000/60-day target in `GROWTH_OPERATOR_ROLE.md`, set a **firm public launch date and metro/ZIP scope**, and triage whatever from #20–#32 didn't get finished into the next sprint.

## What's still not fully done by Day 14, regardless of hours worked

- **SMS integration (#6)** — the carrier/compliance approval step is external; scheduled to start Day 3, checked on repeatedly, realistically still "in the pipeline" not "live" by Day 14
- **Legal review of #28's ToS/Privacy Policy by an actual attorney** — the drafting gets done, a real legal review before this goes past beta is a separate, explicit gap worth flagging, not something either founder working more hours substitutes for
