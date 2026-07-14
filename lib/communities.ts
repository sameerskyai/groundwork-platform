import { createClient, createAdminClient } from '@/lib/supabase/server'
import { zipToLatLng, haversineDistanceMiles } from '@/lib/geo'

/**
 * Reverse-geocode lat/lng to get neighborhood name using Apple Maps API
 * Falls back to ZIP code if neighborhood lookup fails
 */
export async function getNeighborhoodFromCoordinates(
  lat: number,
  lng: number
): Promise<{ neighborhood: string; zip_code: string } | null> {
  try {
    // Apple Maps reverse geocoding endpoint (requires API key)
    // For now, integrate with your preferred location service
    // This is a placeholder — actual implementation depends on your API setup

    // Option 1: Use Mapbox Reverse Geocoding (easier setup)
    const mapboxToken = process.env.MAPBOX_API_TOKEN
    if (!mapboxToken) {
      console.warn('MAPBOX_API_TOKEN not set — using ZIP code fallback')
      return null
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
    )

    if (!response.ok) {
      console.error('Mapbox reverse geocoding failed:', response.status)
      return null
    }

    const data = await response.json()
    const features = data.features || []

    // Extract neighborhood and ZIP from features
    let neighborhood = ''
    let zipCode = ''

    for (const feature of features) {
      if (feature.id.startsWith('place.')) {
        // Place-level feature (city/neighborhood)
        neighborhood = feature.text || neighborhood
      }
      if (feature.id.startsWith('postcode.')) {
        // Postal code feature
        zipCode = feature.text || zipCode
      }
    }

    return neighborhood && zipCode ? { neighborhood, zip_code: zipCode } : null
  } catch (err) {
    console.error('Error reverse-geocoding location:', err)
    return null
  }
}

/**
 * Get user's neighborhood based on IP address + location services
 * Prioritizes client-side location data if available
 */
export async function getUserNeighborhood(
  req: Request,
  clientLat?: number,
  clientLng?: number
): Promise<{ neighborhood: string; zip_code: string } | null> {
  try {
    // If client provided precise lat/lng (from device geolocation), use that
    if (clientLat && clientLng) {
      const result = await getNeighborhoodFromCoordinates(clientLat, clientLng)
      if (result) return result
    }

    // Fallback: Extract IP and use geolocation lookup
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // Use IP geolocation service (e.g., MaxMind, IPStack)
    // This is a placeholder for your actual IP geolocation integration
    console.log(`IP-based geolocation for ${ip} — not yet implemented`)

    return null
  } catch (err) {
    console.error('Error getting user neighborhood:', err)
    return null
  }
}

/**
 * Auto-enroll homeowner in their specific neighborhood community
 * Also allows browsing/joining communities in nearby ZIPs
 */
export async function autoEnrollInPrimaryNeighborhood(
  userId: string,
  neighborhood: string,
  zipCode: string
): Promise<{ communityId: string; isPrimary: boolean } | null> {
  try {
    const adminClient = await createAdminClient()

    // Create unique identifier for this neighborhood+ZIP combination
    const communityName = `${neighborhood}, ${zipCode}`

    // Check if community exists for this neighborhood
    const { data: existing } = await adminClient
      .from('communities')
      .select('id')
      .eq('name', communityName)
      .eq('type', 'homeowner')
      .maybeSingle()

    let communityId: string

    if (existing) {
      communityId = existing.id
    } else {
      // Create community for this neighborhood
      const { data: newCommunity, error } = await adminClient
        .from('communities')
        .insert({
          creator_id: userId,
          name: communityName,
          description: `Community for ${neighborhood}, ${zipCode}`,
          zip_code: zipCode,
          neighborhood: neighborhood, // Store neighborhood name separately
          type: 'homeowner',
          published: true
        })
        .select('id')
        .single()

      if (error) {
        console.error(`Error creating neighborhood community:`, error)
        return null
      }

      communityId = newCommunity.id
    }

    // Add user as primary member (mark their primary neighborhood)
    const { data: membership } = await adminClient
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!membership) {
      await adminClient.from('community_members').insert({
        community_id: communityId,
        user_id: userId,
        role: 'member',
        is_primary: true // Mark this as the user's primary neighborhood
      })
    }

    return { communityId, isPrimary: true }
  } catch (err) {
    console.error('Error auto-enrolling in neighborhood community:', err)
    return null
  }
}

/**
 * Find and enroll in other communities nearby (within 25-mile radius)
 * User can browse/join these optionally
 */
export async function discoverNearbyZipCommunities(
  userId: string,
  zipCode: string,
  radiusMiles: number = 25
): Promise<{ communityId: string; isPrimary: boolean }[]> {
  try {
    const adminClient = await createAdminClient()

    const centerCoords = await zipToLatLng(zipCode)
    if (!centerCoords) return []

    // Approximate bounding box
    const latDelta = radiusMiles / 69
    const lngDelta = radiusMiles / (69 * Math.cos(centerCoords.lat * Math.PI / 180))

    // Find nearby ZIPs
    const { data: nearbyData } = await adminClient
      .from('cost_data')
      .select('zip_code')
      .gte('lat', centerCoords.lat - latDelta)
      .lte('lat', centerCoords.lat + latDelta)
      .gte('lng', centerCoords.lng - lngDelta)
      .lte('lng', centerCoords.lng + lngDelta)

    if (!nearbyData || nearbyData.length === 0) return []

    const nearbyZips = new Set<string>()
    for (const row of nearbyData) {
      if (row.zip_code) nearbyZips.add(row.zip_code)
    }

    // Find/create communities for nearby ZIPs (not neighborhoods, just ZIP-level)
    const enrollments: { communityId: string; isPrimary: boolean }[] = []

    for (const zip of nearbyZips) {
      if (zip === zipCode) continue // Skip primary ZIP (already enrolled)

      // Find or create ZIP-level community
      const { data: zipCommunity } = await adminClient
        .from('communities')
        .select('id')
        .eq('zip_code', zip)
        .eq('type', 'homeowner')
        .is('neighborhood', null) // ZIP-level communities have no neighborhood
        .maybeSingle()

      let communityId: string

      if (zipCommunity) {
        communityId = zipCommunity.id
      } else {
        // Create ZIP-level community
        const { data: newCommunity } = await adminClient
          .from('communities')
          .insert({
            creator_id: userId,
            name: `${zip} Area`,
            description: `Community for ZIP code ${zip}`,
            zip_code: zip,
            type: 'homeowner',
            published: true
          })
          .select('id')
          .single()

        if (!newCommunity) continue
        communityId = newCommunity.id
      }

      // Optionally add user to nearby ZIP communities (set to false for opt-in instead)
      // For now, add them but mark as not primary
      const { data: existing } = await adminClient
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .maybeSingle()

      if (!existing) {
        await adminClient.from('community_members').insert({
          community_id: communityId,
          user_id: userId,
          role: 'member',
          is_primary: false
        })

        enrollments.push({ communityId, isPrimary: false })
      }
    }

    return enrollments
  } catch (err) {
    console.error('Error discovering nearby communities:', err)
    return []
  }
}

/**
 * Get all communities a user has access to (sorted by primary first)
 */
export async function getUserCommunities(userId: string) {
  try {
    const supabase = await createClient()

    const { data: communities, error } = await supabase
      .from('communities')
      .select(`
        *,
        community_members(count, is_primary),
        community_posts(count)
      `)
      .or(`creator_id.eq.${userId},community_members.user_id.eq.${userId}`, {
        referencedTable: 'community_members'
      })
      .order('name')

    if (error) {
      console.error('Error fetching user communities:', error)
      return []
    }

    return (communities || []).sort((a, b) => {
      // Sort primary neighborhoods first
      const aIsPrimary = a.community_members?.some((m: any) => m.is_primary) ? 1 : 0
      const bIsPrimary = b.community_members?.some((m: any) => m.is_primary) ? 1 : 0
      return bIsPrimary - aIsPrimary
    })
  } catch (err) {
    console.error('Error in getUserCommunities:', err)
    return []
  }
}
