import { createClient, createAdminClient } from '@/lib/supabase/server'
import { zipToLatLng, haversineDistanceMiles } from '@/lib/geo'

/**
 * Find all ZIP codes within a given radius of a center ZIP
 * Uses lat/lng lookup + haversine distance calculation
 */
export async function findNearbyZips(centerZip: string, radiusMiles: number = 25): Promise<string[]> {
  try {
    const centerCoords = await zipToLatLng(centerZip)
    if (!centerCoords) {
      console.warn(`Could not find coordinates for ZIP ${centerZip}`)
      return [centerZip] // Fallback to the input ZIP
    }

    // Approximate bounding box (1 degree ≈ 69 miles)
    const latDelta = radiusMiles / 69
    const lngDelta = radiusMiles / (69 * Math.cos(centerCoords.lat * Math.PI / 180))

    const supabase = await createAdminClient()

    // Query zip_codes table (if it exists) or use hardcoded list
    // For now, we'll work with the ZIPs we know about from projects/cost_data
    const { data: nearbyZips } = await supabase
      .from('cost_data')
      .select('zip_code')
      .gte('lat', centerCoords.lat - latDelta)
      .lte('lat', centerCoords.lat + latDelta)
      .gte('lng', centerCoords.lng - lngDelta)
      .lte('lng', centerCoords.lng + lngDelta)

    if (!nearbyZips || nearbyZips.length === 0) {
      return [centerZip]
    }

    // Filter by actual distance to be precise
    const unique = new Set<string>()
    for (const row of nearbyZips) {
      const zip = row.zip_code
      if (!zip) continue

      const zipCoords = await zipToLatLng(zip)
      if (!zipCoords) continue

      const distance = haversineDistanceMiles(
        centerCoords.lat, centerCoords.lng,
        zipCoords.lat, zipCoords.lng
      )
      if (distance <= radiusMiles) {
        unique.add(zip)
      }
    }

    unique.add(centerZip) // Always include the home ZIP
    return Array.from(unique)
  } catch (err) {
    console.error(`Error finding nearby ZIPs for ${centerZip}:`, err)
    return [centerZip]
  }
}

/**
 * Auto-enroll homeowner in communities within 25 miles
 * Creates missing communities, adds user to all nearby ones
 */
export async function autoEnrollInNearbyCommunities(userId: string, zipCode: string): Promise<void> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Find nearby ZIPs within 25 miles
    const nearbyZips = await findNearbyZips(zipCode, 25)

    // For each ZIP, ensure community exists and enroll user
    for (const zip of nearbyZips) {
      // Check if community exists for this ZIP
      const { data: existing } = await adminClient
        .from('communities')
        .select('id')
        .eq('zip_code', zip)
        .eq('type', 'homeowner')
        .maybeSingle()

      let communityId: string

      if (existing) {
        communityId = existing.id
      } else {
        // Create community for this ZIP
        const { data: newCommunity, error } = await adminClient
          .from('communities')
          .insert({
            creator_id: userId, // System-created, but attribute to current user
            name: `${zip} Neighborhood`, // Will be enriched with real neighborhood name later
            description: `Community for homeowners in ZIP ${zip}`,
            zip_code: zip,
            type: 'homeowner',
            published: true
          })
          .select('id')
          .single()

        if (error) {
          console.error(`Error creating community for ZIP ${zip}:`, error)
          continue
        }

        communityId = newCommunity.id
      }

      // Check if user is already a member
      const { data: membership } = await adminClient
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .maybeSingle()

      if (!membership) {
        // Add user as member
        const { error: memberError } = await adminClient
          .from('community_members')
          .insert({
            community_id: communityId,
            user_id: userId,
            role: 'member'
          })

        if (memberError) {
          console.error(`Error adding user to community ${communityId}:`, memberError)
        }
      }
    }
  } catch (err) {
    console.error(`Error auto-enrolling user in communities:`, err)
    // Don't fail onboarding if community enrollment fails
  }
}

/**
 * Get all communities a user has access to (member or creator)
 */
export async function getUserCommunities(userId: string, zipCode?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('communities')
      .select(`
        *,
        community_members(count),
        community_posts(count)
      `)
      .or(`creator_id.eq.${userId},community_members.user_id.eq.${userId}`, {
        referencedTable: 'community_members'
      })

    if (zipCode) {
      // Optional: filter by ZIP if provided
      query = query.eq('zip_code', zipCode)
    }

    const { data: communities, error } = await query

    if (error) {
      console.error('Error fetching user communities:', error)
      return []
    }

    return communities || []
  } catch (err) {
    console.error('Error in getUserCommunities:', err)
    return []
  }
}
