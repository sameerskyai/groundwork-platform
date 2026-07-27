// All location logic routes through ZIP/lat-long only — no hardcoded cities or states

export function haversineDistanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Lookup ZIP → lat/long via free public API (no hardcoded region lists)
export async function zipToLatLng(zip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places?.[0]
    if (!place) return null
    return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) }
  } catch {
    return null
  }
}

// Find nearest cost data when local data doesn't exist for a ZIP
export function findNearestCostData<T extends { lat: number | null; lng: number | null }>(
  targetLat: number,
  targetLng: number,
  candidates: T[]
): T | null {
  if (!candidates.length) return null
  let nearest: T | null = null
  let minDist = Infinity
  for (const c of candidates) {
    if (c.lat == null || c.lng == null) continue
    const d = haversineDistanceMiles(targetLat, targetLng, c.lat, c.lng)
    if (d < minDist) { minDist = d; nearest = c }
  }
  return nearest
}
