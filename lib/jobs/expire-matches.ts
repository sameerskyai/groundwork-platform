/**
 * Background job: Expire matches older than 72 hours
 * Runs via cron job (external scheduler like Vercel Cron, GitHub Actions, etc.)
 *
 * DESIGN ONLY: No database connection in test environment
 * In production: Connect via Supabase service role key
 */

const MATCH_EXPIRY_HOURS = 72

export interface Match {
  id: string
  created_at: string
  status: 'pending' | 'contractor_review' | 'matched' | 'expired'
}

/**
 * Check if a match should be expired
 * @param createdAt ISO timestamp of match creation
 * @param now Current time (default: now)
 * @returns true if match is older than MATCH_EXPIRY_HOURS
 */
export function shouldExpireMatch(createdAt: string, now: Date = new Date()): boolean {
  const createdTime = new Date(createdAt)
  const ageHours = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60)
  return ageHours >= MATCH_EXPIRY_HOURS
}

/**
 * Filter matches that should be expired
 */
export function filterExpiredMatches(matches: Match[], now: Date = new Date()): Match[] {
  return matches.filter(m => shouldExpireMatch(m.created_at, now))
}

/**
 * Mark matches as expired (database operation)
 * WRITTEN BUT NOT RUN: Requires Supabase service role key
 */
export async function expireMatches(expiredIds: string[]) {
  // In production:
  // const supabase = createClient()
  // return supabase
  //   .from('matches')
  //   .update({ status: 'expired' })
  //   .in('id', expiredIds)

  console.log(`[DESIGN ONLY] Would expire ${expiredIds.length} matches: ${expiredIds.join(', ')}`)
  return { success: true, count: expiredIds.length }
}

/**
 * Main job handler - called by cron
 * WRITTEN BUT NOT RUN: Requires database credentials
 */
export async function runMatchExpiryJob(now: Date = new Date()): Promise<{ expired: number; error?: string }> {
  try {
    // In production:
    // const supabase = createClient()
    // const { data: matches } = await supabase
    //   .from('matches')
    //   .select('id, created_at, status')
    //   .neq('status', 'expired')

    const matches: Match[] = [] // Placeholder for production code
    const expiredMatches = filterExpiredMatches(matches, now)
    const expiredIds = expiredMatches.map(m => m.id)

    if (expiredIds.length === 0) {
      return { expired: 0 }
    }

    await expireMatches(expiredIds)
    return { expired: expiredIds.length }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Match expiry job failed:', message)
    return { expired: 0, error: message }
  }
}
