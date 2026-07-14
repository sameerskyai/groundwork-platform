import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryRateLimitStore } from '@/lib/rate-limit/store'
import { checkRateLimit, makeKey, RATE_LIMITS } from '@/lib/rate-limit/check'

describe('Rate limiting', () => {
  let store: InMemoryRateLimitStore

  beforeEach(() => {
    store = new InMemoryRateLimitStore()
  })

  describe('Rate limit store', () => {
    it('should increment request count', async () => {
      const count = await store.increment('test-key', 60)
      expect(count).toBe(1)

      const count2 = await store.increment('test-key', 60)
      expect(count2).toBe(2)
    })

    it('should reset window after expiration', async () => {
      const key = 'test-key'
      await store.increment(key, 1) // 1 second window
      const count1 = await store.increment(key, 1)
      expect(count1).toBe(2)

      // Wait for window to reset (1 second)
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Should be new window
      const count2 = await store.increment(key, 1)
      expect(count2).toBe(1)
    })

    it('should get current count', async () => {
      const key = 'test-key'
      await store.increment(key, 60)
      await store.increment(key, 60)

      const count = await store.getCount(key)
      expect(count).toBe(2)
    })

    it('should return 0 for expired keys', async () => {
      const key = 'test-key'
      await store.increment(key, 1)

      await new Promise(resolve => setTimeout(resolve, 1100))

      const count = await store.getCount(key)
      expect(count).toBe(0)
    })

    it('should reset a key', async () => {
      const key = 'test-key'
      await store.increment(key, 60)
      await store.reset(key)

      const count = await store.getCount(key)
      expect(count).toBe(0)
    })
  })

  describe('Rate limit check', () => {
    it('should allow request under limit', async () => {
      const key = makeKey('estimate', 'user-123')
      const result = await checkRateLimit(key, RATE_LIMITS.estimate)

      expect(result.allowed).toBe(true)
      expect(result.retryAfterSeconds).toBeUndefined()
    })

    it('should allow multiple requests under limit', async () => {
      const key = makeKey('estimate', 'user-123')

      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(key, RATE_LIMITS.estimate)
        expect(result.allowed).toBe(true)
      }
    })

    it('should deny request at limit', async () => {
      const key = makeKey('estimate', 'user-123')

      // Max 5 requests per hour
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(key, RATE_LIMITS.estimate)
      }

      // 6th request should be denied
      const result = await checkRateLimit(key, RATE_LIMITS.estimate)
      expect(result.allowed).toBe(false)
      expect(result.retryAfterSeconds).toBe(RATE_LIMITS.estimate.windowSeconds)
    })

    it('should track different users separately', async () => {
      const key1 = makeKey('estimate', 'user-1')
      const key2 = makeKey('estimate', 'user-2')

      await checkRateLimit(key1, RATE_LIMITS.estimate)
      await checkRateLimit(key1, RATE_LIMITS.estimate)

      // User 2 should have own limit
      const result = await checkRateLimit(key2, RATE_LIMITS.estimate)
      expect(result.allowed).toBe(true)
    })

    it('should track different endpoints separately', async () => {
      const key1 = makeKey('estimate', 'user-123')
      const key2 = makeKey('chat', 'user-123')

      await checkRateLimit(key1, RATE_LIMITS.estimate)
      await checkRateLimit(key2, RATE_LIMITS.chat)

      // Should have independent limits
      const result1 = await checkRateLimit(key1, RATE_LIMITS.estimate)
      const result2 = await checkRateLimit(key2, RATE_LIMITS.chat)

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
    })

    it('should enforce strict auth rate limit', () => {
      expect(RATE_LIMITS.auth.maxRequests).toBe(5)
      expect(RATE_LIMITS.auth.windowSeconds).toBe(60)
    })

    it('should enforce strict waitlist rate limit', () => {
      expect(RATE_LIMITS.waitlist.maxRequests).toBe(1)
      expect(RATE_LIMITS.waitlist.windowSeconds).toBe(3600)
    })

    it('should enforce strict estimate rate limit', () => {
      expect(RATE_LIMITS.estimate.maxRequests).toBe(5)
      expect(RATE_LIMITS.estimate.windowSeconds).toBe(3600)
    })
  })

  describe('Rate limit key generation', () => {
    it('should generate consistent keys', () => {
      const key1 = makeKey('estimate', 'user-123')
      const key2 = makeKey('estimate', 'user-123')
      expect(key1).toBe(key2)
    })

    it('should generate different keys for different endpoints', () => {
      const key1 = makeKey('estimate', 'user-123')
      const key2 = makeKey('chat', 'user-123')
      expect(key1).not.toBe(key2)
    })

    it('should generate different keys for different identifiers', () => {
      const key1 = makeKey('estimate', 'user-1')
      const key2 = makeKey('estimate', 'user-2')
      expect(key1).not.toBe(key2)
    })

    it('should include endpoint in key', () => {
      const key = makeKey('estimate', 'user-123')
      expect(key).toContain('estimate')
    })

    it('should include identifier in key', () => {
      const key = makeKey('estimate', 'user-123')
      expect(key).toContain('user-123')
    })
  })
})
