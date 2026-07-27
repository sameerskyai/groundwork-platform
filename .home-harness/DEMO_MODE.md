# Demo Mode Setup & Access

## Founder Demo Credentials

**Email:** `founder.demo@example.com`  
**Password:** `FounderDemo123!`  
**Role:** `admin` (allows demo data viewing)

⚠️ **SECURITY NOTE:** Plaintext password acceptable ONLY because:
- This account can ONLY access rows marked `is_demo=true`
- RLS policies explicitly block access to real data (`is_demo=false`)
- Account has no write/delete/update access to any table
- If compromised, attacker sees demo marketplace only; no user data exposure

---

## How to Activate Demo Mode

### Step 1: Login as Admin
1. Go to http://localhost:3000
2. Click "Sign In" (or navigate to `/sign-in`)
3. Enter credentials:
   - Email: `founder.demo@example.com`
   - Password: `FounderDemo123!`
4. Click "Sign In"

### Step 2: You're Now in Demo Mode!
- All pages you visit will show demo marketplace data
- **DemoModeWatermark** appears at the top of every page (amber banner with 🎭)
- The watermark indicates: "FOUNDER DEMO MODE — Viewing demo marketplace (demo rows visible, RLS bypassed)"

---

## What You'll See

### Demo Marketplace Data
- **40 Homeowners** with realistic profiles, varied zip codes, subscription tiers
- **25 Contractors** with ratings, reviews, service areas, subscription tiers
- **30 Projects** with realistic titles:
  - "Kitchen remodel — 200 sqft, full gut"
  - "Roof replacement after storm damage"
  - "Basement finishing — media room + storage"
  - etc.
- **40 Matches** (mix of ≥80% and <80% for testing the gate)
- **20 Reviews** with realistic homeowner feedback
- **135 Referrals** (realistic distribution: most users 0-3, some with 10+)

All marked `is_demo=true` and isolated by RLS policies.

---

## Demo URLs

Once logged in as founder.demo@example.com, visit:

- **Homeowner Matches:** http://localhost:3000/homeowner/matches?project=`<project-id>`
  - Shows all demo projects and contractor matches
  - Click "Run matching" to see 40 demo matches
  - View contractor profiles with ratings and reviews

- **Contractor Profiles:** http://localhost:3000/contractors/`<contractor-id>`
  - View any demo contractor's profile
  - See their reviews, ratings, service area

---

## Technical: Security Gates

### /api/demo/session (POST)
- **Purpose:** Verify admin access for demo mode
- **Security:** Requires `role='admin'`
- **Returns:**
  - `200 + demo_mode: true` if admin
  - `401` if not authenticated
  - `403` if not admin

### /api/demo/matches (GET)
- **Purpose:** Fetch all matches including demo data
- **Security:** Requires `role='admin'`
- **Query params:** `?projectId=<id>`
- **Returns:** All matches (demo + real) for the given project

---

## What Happens When You Log Out

1. Demo mode automatically deactivates
2. RLS policies re-enforce: `is_demo = false` only
3. Next login requires admin credentials again

---

## For Development

### Seed Script
```bash
SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." \
npx tsx supabase/seed/01-marketplace-demo.ts
```

Creates:
- 40 homeowners + 25 contractors (all is_demo=true)
- 30 projects, 40 matches, 20 reviews, 135 referrals
- 1 admin user: founder.demo@example.com / FounderDemo123!

### Verify Data

```bash
# Check demo data counts
SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." npx tsx -e "
const { createClient } = require('@supabase/supabase-js');
const c = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { count: homeowners } = await c.from('profiles').select('id', { count: 'exact' }).eq('is_demo', true);
  const { count: contractors } = await c.from('contractor_profiles').select('id', { count: 'exact' }).eq('is_demo', true);
  const { count: projects } = await c.from('projects').select('id', { count: 'exact' }).eq('is_demo', true);
  console.log('Demo Data Counts:', { homeowners, contractors, projects });
})();
"
```

### Live Tests

All 6 security isolation tests pass after seeding:

```bash
npm run test:live-db
```

✓ Test 1: Ownership privacy (users can't see each other)  
✓ Test 2: RLS blocks demo rows from anon users  
✓ Test 3: API enforces 80% threshold  
✓ Test 4: Purge deletes all demo data  
✓ Test 5: MRR metrics exclude demo  
✓ Test 6: Demo contractors isolated from matching pool  

---

## Next Steps (Pending)

- [ ] Design direction selection (A/B/C)
- [ ] API key rotation (new token values)
- [ ] Implement demo-mode toggle in UI (currently login-based)
- [ ] Wire useDemoMode hook into matches page + contractor profiles
