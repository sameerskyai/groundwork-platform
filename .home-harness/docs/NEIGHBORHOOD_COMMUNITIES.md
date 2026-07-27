# Neighborhood-Level Communities

## Overview

Communities in Groundwork are now **neighborhood-based**, not just ZIP-code-based. Same ZIP code can have multiple neighborhoods (e.g., "Lake Manassas" and "Glencairn Estates" in 20155).

When a homeowner signs up:
1. **Primary enrollment** — Auto-enrolled in their exact neighborhood (via location services)
2. **Discovery** — Can browse and join communities in nearby ZIP codes (25-mile radius)
3. **Control** — Can stay private or share neighborhood details

## Example

**Homeowner: Glencairn Estates, 20155**

1. **Primary Community:** "Glencairn Estates, 20155" (auto-joined)
   - Sees other Glencairn homeowners
   - Posts visible only to Glencairn members

2. **Discoverable:** Other 20155 neighborhoods
   - "Lake Manassas, 20155" (can join)
   - Other unnamed 20155 areas

3. **Nearby ZIPs** (25 miles)
   - 20156 Area
   - 20157 Area
   - etc.

## How It Works

### 1. Homeowner Creates Project

**Frontend sends:**
```json
POST /api/projects
{
  "description": "Kitchen remodel",
  "zipCode": "20155",
  "clientLat": 38.8103,
  "clientLng": -77.2452,
  "trade_slug": "kitchen-remodel"
}
```

**`clientLat/clientLng`** — From browser geolocation API (if user granted permission)

### 2. Backend Determines Neighborhood

Uses **Mapbox Reverse Geocoding** (or Apple Maps if preferred):
- Takes lat/lng coordinates
- Returns neighborhood name: "Glencairn Estates"
- Returns ZIP code: "20155"

### 3. Auto-Enroll in Primary

Creates/joins community: **"Glencairn Estates, 20155"**
- User marked as primary member (`is_primary = true`)
- This is their default/home community

### 4. Discover Nearby ZIPs

Finds 25 other ZIP codes within 25 miles:
- Creates ZIP-level communities if they don't exist
- Auto-enrolls user (but `is_primary = false`)
- User can toggle visibility/participation per community

## Database Schema

### communities
```sql
id UUID PRIMARY KEY
name TEXT — "Glencairn Estates, 20155"
neighborhood TEXT — "Glencairn Estates" (nullable for ZIP-only communities)
zip_code TEXT — "20155"
type TEXT — 'homeowner' | 'realtor'
lat DECIMAL, lng DECIMAL — centroid of neighborhood
published BOOLEAN
created_at TIMESTAMPTZ
```

### community_members
```sql
community_id UUID
user_id UUID
is_primary BOOLEAN — true if user's primary neighborhood
role TEXT — 'member' | 'owner'
joined_at TIMESTAMPTZ
```

## API Endpoints

### Get My Communities (Sorted)
```
GET /api/homeowner/communities
```
Returns all communities, primary neighborhoods first.

**Response:**
```json
{
  "communities": [
    {
      "id": "c1",
      "name": "Glencairn Estates, 20155",
      "neighborhood": "Glencairn Estates",
      "zip_code": "20155",
      "is_primary": true,
      "post_count": 12
    },
    {
      "id": "c2",
      "name": "20155 Area",
      "neighborhood": null,
      "zip_code": "20155",
      "is_primary": false,
      "post_count": 3
    }
  ]
}
```

### Create Post in Community
```
POST /api/communities/[id]/posts
```
User can only post in communities they're enrolled in.

### Browse Nearby Communities
```
GET /api/communities?zip=20155&radius=25
```
Get all communities in a ZIP + nearby ZIPs (future endpoint).

## Location Services Setup

### Required Environment Variables

```bash
# Mapbox (recommended for production)
MAPBOX_API_TOKEN=pk_live_xxx

# OR Apple Maps (enterprise)
APPLE_MAPS_KEY=xxx

# OR IP geolocation fallback (free tier available)
MAXMIND_LICENSE_KEY=xxx
```

### Frontend Integration

Homeowner allows browser geolocation:
```javascript
// During project creation form
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const { latitude, longitude } = pos.coords
    // Pass to POST /api/projects
    submitProject({
      zipCode: '20155',
      clientLat: latitude,
      clientLng: longitude
    })
  },
  (err) => {
    // Fallback: use ZIP code only (less precise)
    submitProject({ zipCode: '20155' })
  }
)
```

## Privacy & Control

**Homeowner choices:**
1. **Precise location** — Share exact coordinates → More accurate neighborhood matching
2. **ZIP only** — Only provide ZIP → Matched to ZIP-level community instead
3. **Opt-in discovery** — Control which nearby communities are visible in their feed

## Multi-Neighborhood Scenarios

### Same ZIP, Different Neighborhoods
- User can see their primary (Glencairn)
- Browse other neighborhoods in 20155
- Each has separate post feed

### Cross-ZIP Discovery
- User can see nearby ZIP communities
- Optional: Only show primary ZIP + immediate neighbors

### Realtor Communities
- Realtors create branded communities
- Not tied to specific neighborhoods
- Market-wide visibility

## Contractor Blocking

RLS policies ensure:
- Contractors cannot see ANY community posts
- Cannot view post feeds
- Cannot comment or interact
- Completely transparent to homeowners

Anti-poaching: Communities remain **homeowner-only space**.

## Future Enhancements

1. **Neighborhood names enrichment** — Use official neighborhood databases (city records)
2. **Community moderation** — Allow neighborhood admins to moderate posts
3. **Featured projects** — Highlight urgent/recent projects in feed
4. **Contractor reviews** — Community-level ratings separate from platform-wide
5. **Neighborhood insights** — Aggregate project type/cost data per neighborhood
6. **Realtor partnerships** — Realtor communities + branding
7. **Moving management** — User moves to new neighborhood, primary switches automatically

## Troubleshooting

**User not enrolled in their neighborhood?**
- Check MAPBOX_API_TOKEN is set
- Verify browser geolocation was granted
- Check logs for reverse geocoding errors
- Fallback: User enrolled in ZIP-level community instead

**Same ZIP shows as multiple communities?**
- Expected: Each neighborhood in that ZIP is separate
- "Lake Manassas, 20155" ≠ "Glencairn Estates, 20155"
- Both in same ZIP (20155) but different communities

**Contractors seeing communities?**
- RLS policy violation — check contractor_profiles row exists
- Verify all SELECT policies are returning empty results for contractors
