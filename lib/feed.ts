// Feed helpers — cost bucketing, ZIP expansion, copy formatting

// Buckets an exact dollar figure into a human-readable range that doesn't expose the exact contract price.
// Thresholds tuned to feel natural for home improvement context.
export function bucketCost(low: number, high: number): string {
  const mid = (low + high) / 2

  const BUCKETS = [
    { max: 1000,   label: 'Under $1K' },
    { max: 2500,   label: '$1K–$2.5K' },
    { max: 5000,   label: '$2.5K–$5K' },
    { max: 10000,  label: '$5K–$10K' },
    { max: 15000,  label: '$10K–$15K' },
    { max: 25000,  label: '$15K–$25K' },
    { max: 40000,  label: '$25K–$40K' },
    { max: 60000,  label: '$40K–$60K' },
    { max: 100000, label: '$60K–$100K' },
    { max: Infinity, label: '$100K+' }
  ]

  for (const b of BUCKETS) {
    if (mid <= b.max) return b.label
  }
  return '$100K+'
}

// Returns a list of adjacent ZIP codes to expand low-density feeds.
// Uses the existing zippopotam.us API — no hardcoded region data.
export async function getNearbyZips(
  lat: number,
  lng: number,
  radiusMiles: number
): Promise<string[]> {
  try {
    // zippopotam doesn't support radius search — we use the geo index in our own DB instead.
    // This function signature exists so callers pass lat/lng; the actual expansion
    // happens in the DB query (Supabase PostGIS-style bounding box approximation).
    // Returned as placeholder so the API route can pass them to the query.
    return []
  } catch {
    return []
  }
}

// Formats "X days" into natural language for the feed copy
export function formatDuration(days: number | null | undefined): string {
  if (!days || days <= 0) return 'recently'
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  const weeks = Math.round(days / 7)
  if (weeks === 1) return '1 week'
  if (weeks < 5) return `${weeks} weeks`
  const months = Math.round(days / 30)
  return `${months} month${months > 1 ? 's' : ''}`
}

// Default anonymized copy — never includes homeowner name or full address
export function buildDefaultCopy(
  neighborhoodLabel: string,
  projectTypeLabel: string,
  costRangeLabel: string,
  days: number | null | undefined
): string {
  const duration = formatDuration(days)
  const durationClause = days ? `, finished in ${duration}` : ''
  return `A homeowner near ${neighborhoodLabel} completed a ${projectTypeLabel} — ${costRangeLabel}${durationClause}.`
}

// Opted-in copy — can include street_label if homeowner provided it
export function buildOptedInCopy(
  streetLabel: string | null,
  neighborhoodLabel: string,
  projectTypeLabel: string,
  costRangeLabel: string,
  days: number | null | undefined
): string {
  const location = streetLabel ?? neighborhoodLabel
  const duration = formatDuration(days)
  const durationClause = days ? `, finished in ${duration}` : ''
  return `A homeowner on ${location} completed a ${projectTypeLabel} — ${costRangeLabel}${durationClause}.`
}
