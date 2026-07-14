import { getStore } from './store'

export interface RateLimitConfig {
  windowSeconds: number
  maxRequests: number
}

export const RATE_LIMITS = {
  // Auth endpoints: 5 per minute per IP
  auth: { windowSeconds: 60, maxRequests: 5 },

  // Waitlist signup: 1 per hour per email
  waitlist: { windowSeconds: 3600, maxRequests: 1 },

  // Estimate: 5 per hour per user
  estimate: { windowSeconds: 3600, maxRequests: 5 },

  // Chat: 30 per hour per match
  chat: { windowSeconds: 3600, maxRequests: 30 },

  // Projects: 20 per day per user
  projects: { windowSeconds: 86400, maxRequests: 20 },

  // Default: 100 per minute per IP
  default: { windowSeconds: 60, maxRequests: 100 }
}

/**
 * Check if request exceeds rate limit
 * @returns { allowed: true } OR { allowed: false, retryAfterSeconds }
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const store = getStore()
  const count = await store.increment(key, config.windowSeconds)

  if (count > config.maxRequests) {
    return { allowed: false, retryAfterSeconds: config.windowSeconds }
  }

  return { allowed: true }
}

/**
 * Create a rate limit key for an endpoint + identifier
 * @example makeKey('waitlist', 'user@example.com') → 'rl:waitlist:user@example.com'
 */
export function makeKey(endpoint: string, identifier: string): string {
  return `rl:${endpoint}:${identifier}`
}
