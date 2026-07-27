# Communities Auto-Enrollment

## Overview

When a homeowner creates their first project, they are automatically enrolled in all communities within a **25-mile radius** of their ZIP code. Communities are created automatically if they don't already exist.

## How It Works

### 1. Homeowner Creates First Project
- Call `POST /api/projects` with description, zipCode, etc.
- After project creation succeeds, `autoEnrollInNearbyCommunities()` is triggered

### 2. Find Nearby ZIPs (25-mile radius)
- Use `findNearbyZips(zipCode, 25)` to locate all ZIP codes within 25 miles
- Uses lat/lng lookup + haversine distance calculation
- Includes the homeowner's home ZIP

### 3. For Each Nearby ZIP
- Check if a community exists for that ZIP
- If **no community exists**: Create one automatically (marked as published)
- If **community exists**: Skip creation
- Add the homeowner as a `member` to the community

### 4. Communities Are Accessible
- Homeowner can view/post in all enrolled communities
- Contractors are **blocked from seeing any posts** (RLS policies enforce this)
- Communities are automatically organized by geographic proximity

## Example

**Homeowner ZIP: 60302 (Downers Grove, IL)**

Auto-enrollment finds these ZIPs within 25 miles:
- 60302 (Downers Grove)
- 60304 (Oak Brook)
- 60148 (Hinsdale)
- 60115 (Elmhurst)
- 60173 (Wheaton)
- ... (approximately 15-25 surrounding ZIPs)

For each ZIP:
1. Community `60302 Neighborhood` created (if new)
2. Homeowner added as `member`
3. Homeowner can now post projects + solicit bids in all 20+ communities

## API Endpoints

### Get My Communities
```
GET /api/homeowner/communities
```
Returns all communities the logged-in homeowner is a member of.

### Create Post in Community
```
POST /api/communities/[id]/posts
Body: {
  title: "Kitchen remodel needed",
  description: "...",
  photoUrls: [...],
  projectType: "Kitchen Remodel",
  budgetMin: 5000,
  budgetMax: 10000
}
```

### Comment on Post
```
POST /api/communities/[id]/posts/[postId]/comments
Body: { content: "I can help with this!" }
```

## Database Changes

### migration/005_communities.sql
- Creates communities, community_members, community_posts, community_comments tables
- Enforces homeowner-only visibility via RLS

### New columns (if needed)
None yet — existing tables handle this well.

## Contractor Behavior

Contractors attempting to:
- View communities → See nothing (RLS blocks all SELECT)
- Create post → Error (RLS blocks INSERT)
- View posts → Error (RLS blocks SELECT)
- Comment → Error (RLS blocks INSERT)

This is intentional — communities are a homeowner-only space to prevent free lead generation.

## Future Enhancements

1. **Neighborhood enrichment** — Replace ZIP names with real neighborhood names (e.g., "Downers Grove, IL" instead of "60302")
2. **Realtor communities** — Allow realtors to create branded communities for their service areas
3. **Community moderation** — Allow community owners to moderate posts/comments
4. **Featured posts** — Highlight urgent/recent projects
5. **Contractor reviews within communities** — Community-specific contractor ratings

## Troubleshooting

**No communities showing after project creation?**
- Check that the ZIP code is valid and in the database (need at least some cost_data for those ZIPs)
- Check logs for `autoEnrollInNearbyCommunities` errors
- Manually verify `community_members` table shows the user enrolled

**Communities showing up for contractors?**
- RLS policies should block all access — if they're seeing communities, there's an RLS bug
- Check that contractor_profiles row exists for the user
