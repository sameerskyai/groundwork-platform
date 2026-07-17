# RUNBOOK — Groundwork Development & Deployment

**Last Updated:** 2026-07-17  
**Audience:** Developers, founders, oncall maintainers

---

## CREDENTIALS & SECRETS

### .env.local (Local Development)
Location: `/tmp/Groundwork-platform/.env.local`

**Required keys:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public API key (safe to commit)
- `SUPABASE_URL` — Same as NEXT_PUBLIC (for server-side)
- `SUPABASE_ANON_KEY` — Same as NEXT_PUBLIC
- `SUPABASE_SERVICE_ROLE_KEY` — Admin key (NEVER commit this)
- `ANTHROPIC_API_KEY` — Claude API key (for estimate agent)
- `CODERABBIT_API_KEY` — Code review API key (optional)
- `SEED_DEMO_TOKEN` — Token for POST /api/seed-demo endpoint

**Supabase Project:**
- Project: groundwork-platform
- URL: https://dhmxxywdsdxzzcuezztv.supabase.co
- Dashboard: https://supabase.com/dashboard/project/dhmxxywdsdxzzcuezztv

**GitHub:**
- Repo: https://github.com/sameerskyai/groundwork-platform
- Private access via GitHub CLI: `gh auth login` then `gh repo view`

---

## STARTING DEVELOPMENT

### 1. Install Dependencies
```bash
cd /tmp/Groundwork-platform
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
- Server runs on http://localhost:3000
- Rebuilds on file changes
- Check `/tmp/dev.log` if issues occur

### 3. Database Setup (First Time Only)
```bash
# Migrations auto-apply when server starts (via Supabase connection)
# To manually verify migrations:
npm run migrate:status
```

### 4. Seed Demo Data
```bash
# Create demo accounts + test data
curl -X POST http://localhost:3000/api/seed-demo \
  -H "x-seed-token: dev_seed_token_groundwork_2024"
```

---

## TESTING

### Unit & Integration Tests
```bash
# Run all tests (excludes demo-isolation tests)
npm run test

# Watch mode
npm run test:watch

# Single test file
npm run test -- __tests__/estimate.test.ts

# Coverage report
npm run test:coverage
```

### Live DB Tests (Hit Real Supabase)
```bash
# Run tests against live instance
npm run test -- __tests__/j-queue-end-to-end.test.ts
```

### Manual E2E (Browser)
1. Dev server running (`npm run dev`)
2. Open http://localhost:3000
3. Sign up or log in as founder.demo@groundwork.local
4. Walk through journey: estimate → questions → matches → messages

---

## BUILD & DEPLOY

### Local Build
```bash
npm run build
```
Outputs to `.next/` directory. Check for TypeScript errors and bundle warnings.

### Type Check
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

---

## VERIFY WORK FOR EVIDENCE

### After Making Changes
Run this checklist before calling work "done":

1. **Type check passes:**
   ```bash
   npm run build 2>&1 | grep "Running TypeScript"
   ```

2. **Tests pass:**
   ```bash
   npm run test 2>&1 | tail -5
   ```
   Should show: `Test Files X passed`

3. **Commit includes evidence:**
   ```bash
   git log -1 --format="%B"
   ```
   Message should cite file paths and test results.

4. **For features, manual test in browser:**
   - Dev server (`npm run dev`)
   - Go to http://localhost:3000
   - Exercise the feature
   - Take screenshot if needed

### Verify DB Changes
Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/dhmxxywdsdxzzcuezztv
2. Select SQL Editor
3. Run your query:
   ```sql
   SELECT * FROM your_table WHERE ... LIMIT 5;
   ```

---

## COMMON TASKS

### Reset Demo Data
```bash
# Option 1: Re-seed (creates new if not exists)
curl -X POST http://localhost:3000/api/seed-demo \
  -H "x-seed-token: dev_seed_token_groundwork_2024"

# Option 2: Delete and re-seed (manual via Supabase dashboard)
DELETE FROM profiles WHERE email LIKE '%.demo@%';
```

### Check API Costs
```bash
# Query: Weekly spend summary
SELECT call_type, SUM(total_cost_cents) as cost_cents
FROM ai_api_calls
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY call_type;
```

### View Recent Commits
```bash
git log --oneline -20
```

### Deploy to Production
```bash
# Build
npm run build

# Push to GitHub (auto-deploys via CI/CD)
git push origin main
```

---

## WHO HAS ACCESS TO WHAT

| Resource | Owner | Access Method |
|----------|-------|---|
| Supabase Project | Sameer + Ryan | https://supabase.com/dashboard (invite-based) |
| GitHub Repo | Sameer (owner) | GitHub CLI or https://github.com/sameerskyai |
| .env.local Secrets | Local dev machine | File-based (not committed) |
| API Keys | Ryan (Anthropic), Sameer (CodeRabbit) | .env.local on dev machine |
| Prod Deployment | CI/CD (GitHub Actions) | Auto-deploys on push to main |

---

## TROUBLESHOOTING

### Dev Server Won't Start
```bash
# Check for port conflicts
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Check logs
tail -50 /tmp/dev.log
```

### Tests Fail
```bash
# Clear cache
rm -rf .next node_modules/.vite

# Re-install
npm install

# Re-run
npm run test
```

### Type Errors During Build
```bash
# Check for missing types
npm run type-check

# This often catches issues `build` misses
```

### Supabase Connection Issues
1. Check `.env.local` has correct URL and keys
2. Verify Supabase project is not paused
3. Try: `npm run test` (hits Supabase directly, gives clear error)

---

## ON-CALL / MAINTENANCE

### If Production is Down
1. Check GitHub Actions: https://github.com/sameerskyai/groundwork-platform/actions
2. Check Supabase status: https://status.supabase.com
3. Review recent commits: `git log --oneline -10`
4. Rollback if needed: Contact Sameer (repo owner)

### Weekly Metrics
Run these queries manually (or set up scheduled reports):
```sql
-- Weekly API spend
SELECT DATE_TRUNC('week', created_at) as week, SUM(total_cost_cents) / 100.0 as cost_dollars
FROM ai_api_calls
WHERE is_demo = false
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;

-- Active users this week
SELECT COUNT(DISTINCT user_id) FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## DOCUMENTATION REFERENCES

- **Architecture:** See `WAR_PLAN.md` Part One
- **Coding Standards:** See `WARP.md`
- **Feature Status:** See `TIMELINE.md` and `PROGRESS_MAP.md`
- **Decisions:** See `DECISIONS.md`
- **Legal/Compliance:** See `LEGAL_TODO.md`
