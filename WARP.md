# WARP — Groundwork Engineering Rules

**Last Updated:** 2026-07-14  
**Enforced Since:** Phase 0 Rebuild (Post-Audit)

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

## REFERENCE

- **Database:** Supabase PostgreSQL (RLS-enabled)
- **Auth:** Supabase Auth (with metadata flags for demo/fixture isolation)
- **API:** Next.js App Router (server-side threshold enforcement)
- **Testing:** Vitest (with pagination-aware fixture cleanup)
- **Version Control:** Git (commit hash is proof)
