# Granola Meeting Context — Groundwork Founder Sessions

Paste-ready context block for Granola (or any AI notetaker) so its summaries understand the project, the people, and the jargon. Update the "Status going into this meeting" section from docs/AGENT_HANDOFF.md before each session.

---

**GROUNDWORK — FOUNDER WORKING SESSION**
**Attendees: Ryan (product/AI/growth track) and Sameer (payments/Stripe track)**

**Company context:** Groundwork is a two-sided marketplace for home improvement. Homeowners describe a project and get a free AI-generated cost estimate in 30 seconds, then swipe-to-match (Tinder-style) with vetted contractors who fit their budget. Contractors pay a flat subscription — Standard $79/mo or Growth $149/mo — with no per-job cut and no lead fees ever. The long-term moat is cost data: every completed job feeds a ZIP-level pricing dataset that makes estimates more accurate over time. Strategy target: $100M valuation ~ $8-12M ARR ~ roughly 150 paying contractors per metro across 50 metros. Phase 1 is dominating one metro (Northern Virginia) before expanding.

**The stack (terms that will come up):** Next.js app, Supabase (database + auth, "RLS" = row-level security), Vercel (hosting, auto-deploys from GitHub main), Anthropic Claude (8 AI agents: estimator, matcher, bio writer, classifier, etc.), Stripe (payments, test mode). Work is tracked as GitHub issues — "number five" / "#5" means a GitHub issue number.

**Status going into this meeting:** (refresh from docs/AGENT_HANDOFF.md — as of 2026-07-13: two SQL migrations 006/007 still pending in Supabase SQL Editor, blocking #3/#9/#12/#14; #5 Stripe and #4 lead magnet not started; #10 forgot-password and #9 waitlist built and deployed)

**Standing decision agenda:**
1. Any pending migrations/blockers — resolve live during the meeting
2. Sameer's Stripe track (#5) — status and timeline
3. Ryan's build track (#4 lead magnet, then #8 review flow) — status and timeline
4. Launch target date and definition (which ZIPs, how many contractors first)
5. Founder content plan — who posts what, where, starting when
6. Anything new to file as GitHub issues

**Capture for every decision: what was decided, who owns it, by when.**

---

After the meeting: paste the Granola summary to Claude Code, which will convert decisions into GitHub issue updates and refresh docs/AGENT_HANDOFF.md.
