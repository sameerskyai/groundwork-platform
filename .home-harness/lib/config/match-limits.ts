// Match limit configuration (env-overridable)

export const MATCH_LIMITS = {
  MAX_ACTIVE_MATCHES: parseInt(process.env.MAX_ACTIVE_MATCHES ?? '1', 10),
  DAILY_MATCH_REVEALS: parseInt(process.env.DAILY_MATCH_REVEALS ?? '3', 10)
}

// Subscription tiers that bypass limits
export const UNLIMITED_TIERS = ['paid_unlimited', '$20', '$10_referral', 'homeowner+']

export function shouldApplyLimits(userTier: string | null | undefined): boolean {
  if (!userTier) return true // Default to applying limits if tier unknown
  return !UNLIMITED_TIERS.includes(userTier.toLowerCase())
}
