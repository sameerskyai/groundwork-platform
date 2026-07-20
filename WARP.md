# WARP — Groundwork Engineering Rules

**Last Updated:** 2026-07-17 (GitHub Migration)  
**Enforced Since:** Phase 0 Rebuild (Post-Audit)  
**GitHub:** https://github.com/sameerskyai/groundwork-platform (Private)

These rules are non-negotiable and apply to all work on this codebase.

---

## PERMANENT WORKING RULES

### 1. Every Piece of Work Ends with EVIDENCE

- **File path** where code was written
- **Git commit hash** (from `git log --oneline`)
- **Command output** from executing the work (tests, migrations, builds, etc.)
- **No evidence = not done.** Work without evidence is not considered complete.

### 2. Code in Conversation is Labeled Explicitly

- Code that is a **proposal** (not yet written to disk) is labeled: **[PROPOSAL]**
- Code that **has been written to disk** cites the file path and commit hash.
- Prevents confusion between "what I'm suggesting" and "what I've built."

### 3. Never Fabricate Output

- Do not generate plausible-looking command output, test logs, or database results.
- If a command has not been run, say: **"NOT RUN"** or **"NOT EXECUTED"**
- Real output is always preferred over simulated output, even if it includes errors.
- A real log with 3 failures is worth infinitely more than a perfect imaginary one.

### 3.5. Gate/Milestone Completion: Evidence Required, Definition Binding

- **No J-step or Gate is "complete" based on build-clean alone.**
- Every completion claim MUST cite the specific WAR_PLAN.md or TIMELINE.md definition being satisfied.
- Every completion claim MUST include evidence: functional test, founder walkthrough, or real end-to-end verification.
- "Build clean ✓" proves compilation only, not function. It is not evidence of feature completion.
- False completion claims must be corrected immediately in TIMELINE.md and PROGRESS_MAP.md.
- Gate 4 (Walkthrough): Founder alone declares this clear. Only the founder completing estimate → questions → match → message end-to-end with zero broken steps satisfies this gate.

### 4. Work in Small Verified Increments

- One migration or one feature at a time.
- Sequence: **Write file → Run it → Show real output → Commit → Next.**
- Never stack multiple unverified changes before committing.
- Each increment must be independently auditable in git history.

### 5. Commit After Every Verified Increment

- Commit message format: `<phase>-<letter>: <description>`
- Examples:
  - `phase-0a: vitest setup + trivial passing test`
  - `phase-1d: migration 008 - subscription columns`
  - `phase-1e: subscription checkout route + test`
- Every commit must reference evidence (file paths, test output, or both).
- Commit messages must be descriptive so `git log` is a readable audit trail.

---

## SECURITY & DATA RULES

### 6. Restrictive RLS Policies Only

- All demo isolation RLS policies use **`AS RESTRICTIVE`** mode.
- Restrictive policies combine with AND logic; permissive policies combine with OR.
- `RESTRICTIVE` policies are the **only** protection against demo data leaking to real users.
- Never use `OR` in a filter meant to exclude demo data.
- Service-role client bypasses RLS entirely (no exception clause needed in policy definition).

### 7. No Pattern-Based Deletion from Auth Schema

- Never delete from `auth.users` using email patterns (e.g., `WHERE email LIKE '%@example.com'`).
- Real users may match the pattern and be destroyed.
- Instead: Use metadata flags set at user creation time.
  - `user_metadata->>'is_demo' = 'true'` for demo users
  - `user_metadata->>'test_fixture' = 'true'` for test fixture users
- Delete by metadata flag: `DELETE FROM auth.users WHERE raw_user_meta_data->>'is_demo' = 'true'`

### 8. Server-Side Business Rules Enforcement

- **80% threshold** enforced in API response, not client-side only.
  - API must never return sub-80% matches, even if DB contains them.
  - Client-side filtering is defense-in-depth; server is the enforcement point.
- **Subscription pricing** enforced by Stripe product IDs, not application logic.
  - Config flags (e.g., `CONTRACTOR_PRICING_MODEL=freemium`) can swap models without deploy.
  - Actual pricing comes from Stripe products; app logic references them.

### 9. No Silent Test Skips

- Every test must create its own fixtures or **FAIL** if prerequisites are missing.
- No `.skip()` or conditional return on missing data (unless explicitly documented as xfail).
- If a test needs an auth user, it must create one in `beforeAll`; if that fails, the suite fails.
- Pagination on paginated API calls (e.g., `auth.admin.listUsers({ page, perPage: 1000 })`).
- Verify across **ALL pages**, not just page 1.

---

## CODE ORGANIZATION

### 10. Immutability First (from Common Rules)

- Always create new objects; never mutate existing ones.
- Prevents hidden side effects and enables safe concurrency.

### 11. Small Files, High Cohesion

- Max 800 lines per file. Typical 200-400 lines.
- Organize by feature/domain, not by file type.
- Extract utilities when repetition is real (not speculative).

### 12. Explicit Error Handling

- Handle errors at every layer.
- User-friendly messages in UI-facing code.
- Detailed logs on server side.
- Never silently swallow errors.

### 13. Naming Conventions

- Variables/functions: `camelCase` (descriptive names)
- Booleans: `is`, `has`, `should`, `can` prefixes
- Components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Custom hooks: `useX` prefix

---

## MIGRATION STANDING RULES

### 14. Demo Isolation Coverage (Migration 012 Pattern)

**Context:** Migration 012 (`demo_isolation_secured.sql`) added `is_demo` isolation to existing tables but was written against a spec that included 8 non-existent tables (conversations, invoices, payouts, notifications, personality_responses, compatibility_scores, etc.). These tables were removed from the migration before application.

**Rule:** **ANY future migration that creates a new table MUST include:**

1. **is_demo Column:** `is_demo BOOLEAN NOT NULL DEFAULT false`
2. **RESTRICTIVE RLS Policy:**
   ```sql
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "demo_isolation_new_table" ON new_table
     AS RESTRICTIVE
     FOR SELECT
     USING (is_demo = false);
   ```
3. **Purge Function Coverage:** Add DELETE statement to `purge_demo_data()` function with:
   - `DELETE FROM new_table WHERE is_demo = true;`
   - `GET DIAGNOSTICS var_count = ROW_COUNT;`
   - Entry in return JSONB object
   - Inclusion in `total_purged` calculation

**Why:** Without this coverage, future tables will not be isolated from demo data and purge failures will leave orphaned records.

**Tables Affected (Candidates for Future Creation):**
- conversations (currently removed from 012, needs: is_demo column + RESTRICTIVE policy + purge coverage)
- invoices (currently removed from 012, needs: is_demo column + RESTRICTIVE policy + purge coverage)
- payouts (currently removed from 012, needs: is_demo column + RESTRICTIVE policy + purge coverage)
- notifications (currently removed from 012, needs: is_demo column + RESTRICTIVE policy + purge coverage)
- personality_responses (currently removed from 012, needs: is_demo column + RESTRICTIVE policy + purge coverage)
- compatibility_scores (currently removed from 012, needs: is_demo column + RESTRICTIVE policy + purge coverage)

**Verification:** Before applying a new table creation migration, grep the migration file for the table name in the `purge_demo_data()` function. If not found and the table is new, the migration is incomplete.

### 15. Role Constraint Maintenance

**Current Status:** Migration 017 removed 'property_manager' role (deprecated from product roadmap).

**Valid Roles:** `'homeowner'`, `'contractor'`, `'user'`, `'admin'`  
**Deprecated:** `'property_manager'`, `'standard'` (subscription), `'growth'` (subscription)

Never re-introduce deprecated roles without explicit product decision and a new migration.

---

## GIT WORKFLOW

### 14. Commit Message Format

```
<phase>-<letter>: <description>

<optional body>
```

Examples:
- `phase-1d: migration 008 - subscription columns`
- `phase-1e: subscription checkout route with Stripe test products`
- `phase-2g: migration 011 - is_demo flag + RESTRICTIVE RLS policies`

### 15. No Fabricated Commits

- Never claim a commit was made without running `git commit` and showing the hash.
- `git log --oneline` is the source of truth for what was built.

---

## EVIDENCE CHECKLIST

Before closing any task:

- [ ] File was created or modified → **file path shown**
- [ ] Code was tested → **real command output shown** (not simulated)
- [ ] Change was committed → **commit hash shown** (via `git log --oneline`)
- [ ] Tests pass → **raw test output shown** (including any warnings/failures)
- [ ] No fabricated output

---

## PHASE REBUILD ORDER

**Phase 0 — Foundation Hygiene** (Current)
- 0a: ✅ vitest setup + test script (COMPLETE: commit 4d6ae3c)
- 0b: Verify DB migrations (in progress)
- 0c: Create WARP.md (in progress)

**Phase 1 — Money + Core Business Rules**
- 1d: Migration 008 — subscription columns
- 1e: Subscription checkout + webhook completion
- 1f: Fix 80% threshold + server-side enforcement

**Phase 2 — Demo Isolation**
- 2g: Migration 011 + RESTRICTIVE RLS + purge function
- 2h: Idempotent seed (auth-first UUIDs)
- 2i: 6-test security suite (real run, raw output)

**Phase 3 — Referrals + Expiry + Moderation**
- 3j: Referral tables + verified-count logic
- 3k: 72h match expiry job
- 3l: Basic message filtering

**Phase 4 — Design System (Direction A)**
- Applied to existing screens
- Consensus panel (8/10 design, 7/10 product)

Deferred:
- Mobile scaffold (React Native + Expo)
- Density-unlock full logic
- Metrics dashboard
- RTP payouts (Stripe products already exist)

---

## VERSION CONTROL & BACKUP RULES (GitHub Era)

### 16. GitHub is the Single Source of Truth

- **One repo:** https://github.com/sameerskyai/groundwork-platform (Private)
- **One main branch:** All work branches from main, merged via PR once PR workflow starts
- **No dark work:** All code exists in GitHub. Local-only work is invisible and unauditable.
- **Backup routine (effective 2026-07-17):**
  1. After every task completion: `git push origin main` (GitHub is primary backup)
  2. Every 5 commits: `git bundle create ~/groundwork-backup-$(date +%s).bundle main` (local insurance policy)
  3. Safety bundle pre-migration: `~/groundwork-backup-pre-github.bundle` (preserved as archive)

### 17. Branch Discipline (Future, When PR Workflow Activates)

- **Feature branches:** `feature/<issue-number>-<slug>` (e.g., `feature/J3-swipe-cards`)
- **Bugfix branches:** `bugfix/<issue-number>-<slug>`
- **Hotfix branches:** `hotfix/<issue-number>-<slug>` (emergency only, must be approved before merge)
- All PRs require:
  - Evidence: commit hashes, test output, migration applied confirmations
  - Code review approval (peer or founder)
  - All checks green (build, tests, type checking)
  - Squash-and-merge into main (maintains clean history)

### 18. Collaborators & Access Control

- **GitHub repo:** Private, only collaborators can access
- **Collaborators:** Sameer (owner), Ryan (TBD — awaiting username), Armin (TBD — awaiting invite)
- **CI/CD:** Not yet wired; manual push/verify until automated
- **Secrets:** .env files NEVER tracked; CREDENTIALS.md is reference only

---

## 19. MANDATORY CODE REVIEW WORKFLOW (As of 2026-07-18)

**This is the new standing rule.** Every task from this point forward follows this workflow:

### The Workflow
1. **Branch**: Create feature branch (`feature/<slug>`)
2. **Code**: Write code, commit locally
3. **Push**: Push branch to GitHub
4. **PR**: Create PR to main
5. **CodeRabbit**: Wait for automated review (CodeRabbit reviews automatically)
6. **Address Findings**: Fix any issues CodeRabbit raises
7. **Merge**: Merge to main only after CodeRabbit passes and findings are addressed
8. **Report**: Report to founder AFTER merged to main with evidence

### CodeRabbit Wait Time
- **Normal case**: CodeRabbit completes within 2-5 minutes
- **If delayed past 10 minutes**: Check PR status via `gh pr view <number> --json statusCheckRollup`
- **If CodeRabbit stalls beyond 15 minutes**: Proceed with merge anyway (log in DECISIONS.md: "CodeRabbit delayed, merged without findings")
- **Never commit directly to main.** All work goes through PR + review.

### What If I Disagree with CodeRabbit Findings?
- **Do NOT ignore findings silently**
- **Log disagreement in DECISIONS.md**:
  ```
  ## CodeRabbit Finding Disagreement (Date)
  **Issue**: [CodeRabbit's finding]
  **My assessment**: [Why I disagree]
  **Action**: [Fix / ignore / defer]
  **Reasoning**: [Why this decision]
  ```
- **Then decide**: Fix it, or document the disagreement and proceed
- **Never merge with unlogged disagreements**

### Workflow Summary (Every Task)
```
feature branch
  ↓
code + commit
  ↓
git push -u origin feature/<slug>
  ↓
gh pr create --title "..." --body "..."
  ↓
wait for CodeRabbit (2-5 min)
  ↓
address findings / log disagreements
  ↓
gh pr merge <number> --squash
  ↓
report to founder (with PR link + CodeRabbit findings in response)
```

---

## 20. EXECUTION.MD — DURABLE WORK PLAN (As of 2026-07-20)

The problem: big directives live in chat, chat compacts, the plan fragments, the founder re-routes every tiny bug.

Solution: EXECUTION.md is the only source of truth for multi-phase work. It lives in the repo root and is never replaced, only updated.

### Discipline

1. **Session Start**: Read EXECUTION.md from top. Find first unchecked item. Resume from there.
2. **During Work**: 
   - Work on current unchecked item only
   - If a decision blocker appears: log it specifically in DECISIONS.md, skip that item, keep going. Do not pause.
   - Commit progress when items complete
3. **Session End**: 
   - Check off completed items with commit hashes
   - Note which phase/item you stopped at
   - Push to main
   - Update "Last Updated" at top of EXECUTION.md

### Evidence Standard (§20 applies here too)

No claim is complete without:
- Commit hash (from `git log --oneline`)
- Real command output or Playwright screenshot
- Applies to EVERY phase, including waitlist (not hand-waved)

### Interrupts

Real fires pause the file but never replace it. Return to first unchecked item after fire is out.

### Founder Review

The founder reviews ONCE: when EXECUTION.md is 100% checked. Not before, not during.

---

---

## 22. STATUS LANGUAGE (As of 2026-07-20)

Status is one of four states only:
- **VERIFIED**: Feature works, screenshot + test evidence exists
- **IN PROGRESS**: Active work, next task identified
- **BLOCKED**: Named blocker, workaround documented or founder action logged
- **NOT STARTED**: Waiting for prerequisite

No percentages ("99% ready"), no adjectives ("almost there"), no ETA speculation. Status is fact, not feeling.

---

## 23. PULL REQUEST WORKFLOW — ALL CODE THROUGH REVIEW (As of 2026-07-20)

**Rule**: Every code change ships through PR → CodeRabbit review → address findings → merge. No direct commits to main for code.

**Exception**: Docs-only commits (EXECUTION.md, DECISIONS.md, README updates, no code changes) may commit directly to main.

**Batching**: Group related fixes by phase. One PR per phase completion.

**Process**:
1. Feature branch: `feature/<phase>-<slug>`
2. Write code, commit locally
3. Push branch with `-u flag`
4. Create PR with detailed body + test plan
5. Wait for CodeRabbit (2-5 min typical)
6. Address findings (log disagreements in DECISIONS.md)
7. Merge via `gh pr merge --squash`
8. Report: PR link + CodeRabbit findings + evidence

**If CodeRabbit stalls beyond 15 min**: Log in DECISIONS.md ("CodeRabbit delayed, merged"), proceed.

---

## REFERENCE

- **GitHub:** https://github.com/sameerskyai/groundwork-platform (Private)
- **Database:** Supabase PostgreSQL (RLS-enabled)
- **Auth:** Supabase Auth (with metadata flags for demo/fixture isolation)
- **API:** Next.js App Router (server-side threshold enforcement)
- **Testing:** Vitest (with pagination-aware fixture cleanup)
- **Version Control:** Git + GitHub (commit hash and PR link are proof)
