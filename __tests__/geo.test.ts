import { describe, it, expect } from 'vitest'
import { haversineDistanceMiles, findNearestCostData } from '@/lib/geo'

describe('haversineDistanceMiles', () => {
  it('calculates distance between two points correctly', () => {
    // NYC to LA: approximately 2450 miles
    const distance = haversineDistanceMiles(40.7128, -74.0060, 34.0522, -118.2437)
    expect(distance).toBeGreaterThan(2400)
    expect(distance).toBeLessThan(2500)
  })

  it('returns 0 for same coordinates', () => {
    const distance = haversineDistanceMiles(40.7128, -74.0060, 40.7128, -74.0060)
    expect(distance).toBe(0)
  })

  it('handles small distances (< 1 mile)', () => {
    // Two points ~0.1 miles apart
    const distance = haversineDistanceMiles(40.7128, -74.0060, 40.7138, -74.0050)
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThan(1)
  })

  it('is symmetric (distance from A to B = B to A)', () => {
    const d1 = haversineDistanceMiles(40.7128, -74.0060, 34.0522, -118.2437)
    const d2 = haversineDistanceMiles(34.0522, -118.2437, 40.7128, -74.0060)
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001)
  })

  it('handles equator crossing', () => {
    // Point in Northern Hemisphere to Southern Hemisphere
    const distance = haversineDistanceMiles(10.0, 0.0, -10.0, 0.0)
    expect(distance).toBeGreaterThan(1300)
    expect(distance).toBeLessThan(1400)
  })

  it('handles antimeridian crossing (Pacific routes)', () => {
    // Tokyo to Honolulu: ~3858 miles
    const distance = haversineDistanceMiles(35.6762, 139.6503, 21.3099, -157.8581)
    expect(distance).toBeGreaterThan(3800)
    expect(distance).toBeLessThan(3900)
  })

  it('handles contractor service radius boundary checks', () => {
    // If contractor has 15 mile radius
    const homeownerLat = 40.7128
    const homeownerLng = -74.0060
    const contractorLat = 40.7128
    const contractorLng = -74.0060
    const serviceRadius = 15

    const distance = haversineDistanceMiles(homeownerLat, homeownerLng, contractorLat, contractorLng)
    expect(distance).toBeLessThanOrEqual(serviceRadius)
  })
})

describe('findNearestCostData', () => {
  it('finds nearest candidate by distance', () => {
    const target = { lat: 40.7128, lng: -74.0060 } // NYC
    const candidates = [
      { id: 1, lat: 34.0522, lng: -118.2437 }, // LA: ~2450 miles
      { id: 2, lat: 39.7392, lng: -104.9903 }, // Denver: ~1800 miles
      { id: 3, lat: 41.8781, lng: -87.6298 }   // Chicago: ~800 miles
    ]

    const nearest = findNearestCostData(target.lat, target.lng, candidates)
    expect(nearest?.id).toBe(3) // Chicago is nearest
  })

  it('returns null for empty candidates', () => {
    const result = findNearestCostData(40.7128, -74.0060, [])
    expect(result).toBeNull()
  })

  it('skips candidates with null coordinates', () => {
    const target = { lat: 40.7128, lng: -74.0060 }
    const candidates = [
      { id: 1, lat: null, lng: -118.2437 },
      { id: 2, lat: 39.7392, lng: -104.9903 }
    ]

    const nearest = findNearestCostData(target.lat, target.lng, candidates)
    expect(nearest?.id).toBe(2)
  })

  it('returns only valid candidate when others have null coords', () => {
    const target = { lat: 40.7128, lng: -74.0060 }
    const candidates = [
      { id: 1, lat: null, lng: null },
      { id: 2, lat: null, lng: -118.2437 },
      { id: 3, lat: 39.7392, lng: -104.9903 }
    ]

    const nearest = findNearestCostData(target.lat, target.lng, candidates)
    expect(nearest?.id).toBe(3)
  })

  it('returns null when all candidates have null coordinates', () => {
    const target = { lat: 40.7128, lng: -74.0060 }
    const candidates = [
      { id: 1, lat: null, lng: null },
      { id: 2, lat: null, lng: null }
    ]

    const result = findNearestCostData(target.lat, target.lng, candidates)
    expect(result).toBeNull()
  })
})
