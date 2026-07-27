# Performance Baseline & Optimization (Issue #26)

## Lighthouse Targets

| Metric | Target | Status |
|--------|--------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | TBD - baseline |
| **FID/INP** (Interaction to Next Paint) | < 200ms | TBD - baseline |
| **CLS** (Cumulative Layout Shift) | < 0.1 | TBD - baseline |
| **FCP** (First Contentful Paint) | < 1.5s | TBD - baseline |

## Bundle Budget

| Page Type | JS (gzipped) | CSS |
|-----------|-------------|-----|
| Landing | < 150kb | < 30kb |
| App (homeowner/contractor) | < 300kb | < 50kb |
| Feed | < 120kb | < 20kb |

## Quick Wins Implemented

### ✅ Image Optimization
- All images have explicit `width`/`height` to prevent layout shift
- Using modern formats (AVIF/WebP with fallbacks)
- `loading="lazy"` for below-the-fold images
- Hero images: `loading="eager"` + `fetchpriority="high"`

### ✅ Code Splitting
- Dynamic imports for heavy libraries
- Route-based code splitting via Next.js App Router
- Lazy-load agent modules on-demand

### ✅ Font Loading
- `font-display: swap` for all custom fonts
- Preload critical weight/styles only
- System font fallback to avoid FOUT

### ✅ Composition-Friendly CSS
- No layout-binding animations (width, height, top, left)
- Animations use `transform`, `opacity`, `clip-path` only
- `will-change` used sparingly and removed after animation

### ✅ Database Queries
- Indexed on commonly filtered fields (user_id, status, zip_code, created_at)
- Avoid N+1 queries with proper JOINs
- Paginate large result sets

## Quick Fixes to Implement

### 1. Minify JSON Responses
- All API responses already JSON; ensure proper gzip compression
- **Action:** Verify gzip is enabled on Vercel

### 2. Reduce Geolocation Lookups
- Cache ZIP → lat/lng results for 30 days
- **Action:** Add Redis caching layer or Supabase caching

### 3. Optimize Supabase RLS
- RLS adds ~10-50ms per query due to policy evaluation
- **Action:** Use `service_role` client where RLS not needed (admin operations)

### 4. Lazy-Load Heavy UI Components
- ReviewForm, PreferenceQuiz, CommunityFeed load on-demand
- **Action:** Wrap in `React.lazy()` + `Suspense`

### 5. Prefetch API Routes
- Homeowner dashboard can prefetch `/api/projects` + `/api/matches`
- **Action:** Add `prefetch` to Next.js Link components

## Monitoring

### Local Testing
```bash
npm run build        # Check bundle size
npx next/analyze    # Bundle analysis
lighthouse http://localhost:3000 --output-path=./reports/lighthouse.html
```

### Production (Post-Deploy)
- Monitor via Vercel Analytics
- Check Core Web Vitals in Google Search Console
- Set up alerts for metric regressions

## Database Query Optimization

### Key Indexes (Already Added)
```sql
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_matches_project_status ON matches(project_id, status);
CREATE INDEX idx_community_posts_community ON community_posts(community_id);
CREATE INDEX idx_contractor_profiles_sub ON contractor_profiles(subscription_active);
```

### Queries to Optimize
- `/api/projects/[id]/candidates` — Fetch 50+ contractors per project
  - **Fix:** Add pagination, limit to top 20 by score
- `/api/communities` — Can fetch 100+ communities per user
  - **Fix:** Add pagination, only show recent/primary

## Caching Strategy

### Client-Side
- `stale-while-revalidate` for project listings
- Cache project details for 5 minutes
- Invalidate on mutation (create/update/delete)

### Server-Side
- Cache ZIP code geocoding for 30 days
- Cache contractor profiles for 1 hour
- Cache feed entries for 10 minutes

### Browser
- Static assets cached for 1 year (via `Cache-Control: immutable`)
- API responses cached per endpoint logic

## Vercel Optimization

### Environment
- Enable Edge Functions for authentication/geolocation
- Use Edge Middleware for image optimization
- Deploy to closest region

### Next.js Config
```javascript
// next.config.js
module.exports = {
  compress: true,           // Enable gzip
  poweredByHeader: false,   // Remove header bloat
  productionBrowserSourceMaps: false, // Smaller JS
  swcMinify: true,          // Use SWC minifier (faster)
}
```

## Performance Anti-Patterns (Avoid)

❌ Animating layout properties (width, height, top, left)  
❌ Synchronous API calls in render  
❌ Large CSS/JS files without code splitting  
❌ Unoptimized images without dimensions  
❌ Polling instead of WebSockets for real-time data  
❌ Storing entire user profiles in state  

## Next Steps

1. **Day 7 (QA):** Run baseline Lighthouse audit
   - Document metrics for all pages
   - Identify regressions

2. **Day 8:** Performance regression fixes
   - Image optimization pass
   - Bundle size audit
   - Query optimization

3. **Day 14:** Pre-launch performance sign-off
   - All metrics at target
   - No Core Web Vitals failures
   - Bundle budget compliance

## Tools

- **Lighthouse** — Chrome DevTools / CLI
- **Bundle Analyzer** — `next/analyze` plugin
- **WebPageTest** — Real-world performance simulation
- **Vercel Analytics** — Production monitoring
- **Chrome DevTools** — Network/Performance tabs

