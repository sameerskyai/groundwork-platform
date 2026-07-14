/**
 * Rate limit store interface
 * Designed for swappable implementations: in-memory (now), Redis/Upstash (later)
 */

export interface RateLimitRecord {
  count: number
  resetAt: number
}

export interface RateLimitStore {
  increment(key: string, windowSeconds: number): Promise<number>
  reset(key: string): Promise<void>
  getCount(key: string): Promise<number>
}

/**
 * In-memory rate limit store
 * Data structure: Map<key, { count, resetAt }>
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, RateLimitRecord> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Auto-cleanup expired records every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000)
  }

  async increment(key: string, windowSeconds: number): Promise<number> {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetAt) {
      // New window
      this.store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
      return 1
    }

    // Increment existing
    record.count += 1
    return record.count
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  async getCount(key: string): Promise<number> {
    const record = this.store.get(key)
    if (!record || Date.now() > record.resetAt) {
      return 0
    }
    return record.count
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Singleton instance
let storeInstance: RateLimitStore | null = null

export function getStore(): RateLimitStore {
  if (!storeInstance) {
    storeInstance = new InMemoryRateLimitStore()
  }
  return storeInstance
}
