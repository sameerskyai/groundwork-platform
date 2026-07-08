# Next Steps — Priority Order

## Immediate (before showing investors/partners)

1. **Add Anthropic API key**
   - Get from console.anthropic.com
   - Add to .env.local: `ANTHROPIC_API_KEY=sk-ant-...`
   - This unlocks: estimates, AI matching, bio generation

2. **Create test contractor accounts**
   - Sign up 2-3 contractor accounts at /signup
   - Complete their onboarding + pricing interview
   - This makes the ZIP density checker show "Available" for those ZIPs

3. **Seed cost_data with sample records**
   - Without real jobs, estimates fall back to generic ranges
   - Can manually insert 20-30 sample rows in Supabase SQL editor
   - One per trade per ZIP code you want to demo in

4. **Test the full homeowner flow end to end**
   - Sign up as homeowner → onboarding → post a project → get estimate → match → chat

---

## Short Term (week 1-2)

5. **Set up Stripe**
   - Create products in Stripe dashboard (Standard $79, Growth $149)
   - Add real keys to .env.local
   - Test subscription checkout for contractor signup

6. **Deploy to Vercel**
   - `vercel --prod` from project root
   - Add all .env.local vars to Vercel environment settings
   - Custom domain: groundworkapp.com (or whatever you buy)

7. **Fill out blog articles**
   - 6 placeholder articles exist — write or generate real content
   - Helps with SEO + trust

8. **Contractor verification flow**
   - Right now contractors self-report license/insurance
   - Need a real verification step (manual review or API like Checkr)

---

## Medium Term (month 1)

9. **Email notifications**
   - "You have a new match" email to homeowner
   - "A homeowner wants you" email to contractor
   - Use Resend or SendGrid

10. **Photo upload for projects**
    - Schema + storage bucket ready in Supabase
    - Just need to wire up the file input in the estimate form

11. **Admin dashboard**
    - View all users, projects, matches
    - Approve/reject contractor verifications
    - Flag feed entries

12. **Property manager flow**
    - Multi-unit project posting
    - Portfolio management dashboard

---

## Revenue Milestones

| Milestone | What it means |
|-----------|--------------|
| 10 contractors signed up | $790–$1,490/mo MRR |
| 50 contractors | $3,950–$7,450/mo MRR |
| 200 contractors | $15,800–$29,800/mo MRR |
| 1,000 contractors | $79,000–$149,000/mo MRR |

No per-job cut means revenue is predictable and contractors are incentivized to close every job they get (no reason to go around the platform).

---

## Key Metrics to Track

- Homeowner → estimate completion rate (target: >70%)
- Estimate → match request rate (target: >40%)
- Match request → contractor accept rate (target: >60%)
- Days to match (target: <48hrs)
- Contractor churn rate (monthly, target: <5%)
- ZIP coverage (% of US ZIPs with 3+ active contractors)
