import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { zipToLatLng, haversineDistanceMiles } from '@/lib/geo'

const CONTRACTOR_THRESHOLD = 3   // min active contractors within radius to be "match-ready"
const RADIUS_MILES = 25

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip')?.trim()
  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'Invalid ZIP' }, { status: 400 })
  }

  const coords = await zipToLatLng(zip)
  if (!coords) {
    return NextResponse.json({ error: 'ZIP not found' }, { status: 404 })
  }

  const supabase = await createAdminClient()

  // Fetch all active contractors that have a location
  const { data: contractors } = await supabase
    .from('contractor_profiles')
    .select('profiles(lat, lng)')
    .eq('subscription_active', true)
    .eq('active', true)

  const nearby = (contractors ?? []).filter((c: any) => {
    const p = c.profiles as any
    if (!p?.lat || !p?.lng) return false
    return haversineDistanceMiles(coords.lat, coords.lng, p.lat, p.lng) <= RADIUS_MILES
  })

  // Also get city name from zippopotam for display
  let city: string | null = null
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (res.ok) {
      const data = await res.json()
      const place = data.places?.[0]
      if (place) city = `${place['place name']}, ${place['state abbreviation']}`
    }
  } catch { /* non-fatal */ }

  const count = nearby.length
  return NextResponse.json({
    zip,
    city,
    count,
    threshold: CONTRACTOR_THRESHOLD,
    ready: count >= CONTRACTOR_THRESHOLD
  })
}
