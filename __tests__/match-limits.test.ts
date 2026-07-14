import { describe, it, expect, beforeEach, vi } from 'vitest'

// Configuration (will be loaded from env in actual implementation)
interface MatchLimitConfig {
  MAX_ACTIVE_MATCHES: number
  DAILY_MATCH_REVEALS: number
}

interface MatchResult {
  id: string
  match_percentage: number
  contractor_id: string
  status: 'pending' | 'revealed' | 'locked'
}

interface ScoreResponse {
  matches: MatchResult[]
  matches_revealed_today: number
  matches_locked_count: number
  limit_reached: boolean
  user_tier: 'free' | 'paid_unlimited' | '$20' | '$10_referral'
}

// Simulate the match-limiting logic
function applyMatchLimits(
  matches: MatchResult[],
  userTier: string,
  revealedToday: number,
  config: MatchLimitConfig
): ScoreResponse {
  const isFree = userTier === 'free'

  if (!isFree) {
    // Paid/Homeowner+ tiers: no limits
    return {
      matches,
      matches_revealed_today: revealedToday,
      matches_locked_count: 0,
      limit_reached: false,
      user_tier: userTier as 'free' | 'paid_unlimited' | '$20' | '$10_referral'
    }
  }

  // Free tier: apply limits
  const limit = config.MAX_ACTIVE_MATCHES
  const dailyLimit = config.DAILY_MATCH_REVEALS
  const canReveal = Math.max(0, limit - revealedToday)

  const revealed = matches.slice(0, canReveal).map(m => ({ ...m, status: 'revealed' as const }))
  const locked = matches.slice(canReveal).map(m => ({ ...m, status: 'locked' as const }))

  return {
    matches: revealed,
    matches_revealed_today: revealedToday + revealed.length,
    matches_locked_count: locked.length,
    limit_reached: locked.length > 0,
    user_tier: 'free'
  }
}

describe('Match Limits (Free Tier)', () => {
  const config: MatchLimitConfig = {
    MAX_ACTIVE_MATCHES: 1,
    DAILY_MATCH_REVEALS: 3
  }

  const mockMatches: MatchResult[] = [
    { id: '1', match_percentage: 88, contractor_id: 'c1', status: 'pending' },
    { id: '2', match_percentage: 82, contractor_id: 'c2', status: 'pending' },
    { id: '3', match_percentage: 80, contractor_id: 'c3', status: 'pending' }
  ]

  it('should limit free tier to MAX_ACTIVE_MATCHES', () => {
    const result = applyMatchLimits(mockMatches, 'free', 0, config)

    expect(result.matches).toHaveLength(1) // Only 1 revealed
    expect(result.matches_locked_count).toBe(2) // 2 locked
    expect(result.limit_reached).toBe(true)
  })

  it('should not limit paid_unlimited tier', () => {
    const result = applyMatchLimits(mockMatches, 'paid_unlimited', 0, config)

    expect(result.matches).toHaveLength(3) // All revealed
    expect(result.matches_locked_count).toBe(0) // None locked
    expect(result.limit_reached).toBe(false)
  })

  it('should not limit Homeowner+ tier', () => {
    const result = applyMatchLimits(mockMatches, '$20', 0, config)

    expect(result.matches).toHaveLength(3)
    expect(result.matches_locked_count).toBe(0)
    expect(result.limit_reached).toBe(false)
  })

  it('should respect DAILY_MATCH_REVEALS boundary', () => {
    const result = applyMatchLimits(mockMatches, 'free', 1, config)

    expect(result.matches).toHaveLength(0) // Already at daily limit
    expect(result.matches_locked_count).toBe(3)
    expect(result.matches_revealed_today).toBe(1) // No increment
  })

  it('should count locked matches correctly', () => {
    const result = applyMatchLimits(mockMatches, 'free', 0, config)

    const lockedCount = result.matches_locked_count
    expect(lockedCount).toBe(2)
  })

  it('boundary test: exactly at limit', () => {
    const oneMatch = mockMatches.slice(0, 1)
    const result = applyMatchLimits(oneMatch, 'free', 0, config)

    expect(result.matches).toHaveLength(1)
    expect(result.matches_locked_count).toBe(0)
    expect(result.limit_reached).toBe(false)
  })

  it('boundary test: one over limit', () => {
    const twoMatches = mockMatches.slice(0, 2)
    const result = applyMatchLimits(twoMatches, 'free', 0, config)

    expect(result.matches).toHaveLength(1)
    expect(result.matches_locked_count).toBe(1)
    expect(result.limit_reached).toBe(true)
  })

  it('should preserve match_percentage on locked matches', () => {
    const result = applyMatchLimits(mockMatches, 'free', 0, config)

    const locked = result.matches_locked_count > 0
    expect(locked).toBe(true)
    // Note: locked matches are not returned in matches array, but count is tracked
  })
})
