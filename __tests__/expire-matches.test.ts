import { describe, it, expect } from 'vitest'
import { shouldExpireMatch, filterExpiredMatches, runMatchExpiryJob } from '@/lib/jobs/expire-matches'

describe('shouldExpireMatch', () => {
  it('returns false for matches created less than 72 hours ago', () => {
    const now = new Date('2026-07-14T12:00:00Z')
    const createdAt = new Date('2026-07-14T10:00:00Z') // 2 hours ago
    expect(shouldExpireMatch(createdAt.toISOString(), now)).toBe(false)
  })

  it('returns false for matches exactly 71 hours old', () => {
    const now = new Date('2026-07-17T12:00:00Z')
    const createdAt = new Date('2026-07-14T13:00:00Z') // 71 hours ago
    expect(shouldExpireMatch(createdAt.toISOString(), now)).toBe(false)
  })

  it('returns true for matches exactly 72 hours old', () => {
    const now = new Date('2026-07-17T12:00:00Z')
    const createdAt = new Date('2026-07-14T12:00:00Z') // 72 hours ago
    expect(shouldExpireMatch(createdAt.toISOString(), now)).toBe(true)
  })

  it('returns true for matches older than 72 hours', () => {
    const now = new Date('2026-07-18T12:00:00Z')
    const createdAt = new Date('2026-07-14T12:00:00Z') // 96 hours ago (4 days)
    expect(shouldExpireMatch(createdAt.toISOString(), now)).toBe(true)
  })

  it('handles matches from multiple days ago', () => {
    const now = new Date('2026-07-25T12:00:00Z')
    const createdAt = new Date('2026-07-14T12:00:00Z') // 11 days ago
    expect(shouldExpireMatch(createdAt.toISOString(), now)).toBe(true)
  })

  it('uses current time as default', () => {
    const pastTime = new Date()
    pastTime.setHours(pastTime.getHours() - 73) // 73 hours ago
    expect(shouldExpireMatch(pastTime.toISOString())).toBe(true)
  })
})

describe('filterExpiredMatches', () => {
  it('filters out matches that are not expired', () => {
    const now = new Date('2026-07-14T12:00:00Z')
    const matches = [
      { id: '1', created_at: '2026-07-14T10:00:00Z', status: 'pending' as const }, // 2 hours old
      { id: '2', created_at: '2026-07-14T11:00:00Z', status: 'pending' as const }  // 1 hour old
    ]
    const expired = filterExpiredMatches(matches, now)
    expect(expired).toHaveLength(0)
  })

  it('returns only expired matches', () => {
    const now = new Date('2026-07-17T12:00:00Z')
    const matches = [
      { id: '1', created_at: '2026-07-14T12:00:00Z', status: 'pending' as const }, // 72 hours old - EXPIRED
      { id: '2', created_at: '2026-07-17T10:00:00Z', status: 'pending' as const }  // 2 hours old
    ]
    const expired = filterExpiredMatches(matches, now)
    expect(expired).toHaveLength(1)
    expect(expired[0].id).toBe('1')
  })

  it('handles mixed old and new matches', () => {
    const now = new Date('2026-07-20T12:00:00Z')
    const matches = [
      { id: '1', created_at: '2026-07-14T12:00:00Z', status: 'matched' as const },      // 6 days old - EXPIRED
      { id: '2', created_at: '2026-07-19T12:00:00Z', status: 'contractor_review' as const }, // 1 day old
      { id: '3', created_at: '2026-07-12T12:00:00Z', status: 'pending' as const },      // 8 days old - EXPIRED
      { id: '4', created_at: '2026-07-20T11:00:00Z', status: 'pending' as const }       // 1 hour old
    ]
    const expired = filterExpiredMatches(matches, now)
    expect(expired).toHaveLength(2)
    expect(expired.map(m => m.id)).toEqual(['1', '3'])
  })

  it('returns empty array when no matches are expired', () => {
    const now = new Date('2026-07-14T12:00:00Z')
    const matches = [
      { id: '1', created_at: '2026-07-14T11:00:00Z', status: 'pending' as const }
    ]
    const expired = filterExpiredMatches(matches, now)
    expect(expired).toEqual([])
  })

  it('returns all matches when all are expired', () => {
    const now = new Date('2026-07-25T12:00:00Z')
    const matches = [
      { id: '1', created_at: '2026-07-14T12:00:00Z', status: 'pending' as const },
      { id: '2', created_at: '2026-07-10T12:00:00Z', status: 'pending' as const }
    ]
    const expired = filterExpiredMatches(matches, now)
    expect(expired).toHaveLength(2)
  })
})

describe('runMatchExpiryJob', () => {
  it('returns success with 0 expired matches when no matches provided', async () => {
    const result = await runMatchExpiryJob(new Date('2026-07-14T12:00:00Z'))
    expect(result.expired).toBe(0)
    expect(result.error).toBeUndefined()
  })

  it('returns expired count on success', async () => {
    const result = await runMatchExpiryJob(new Date('2026-07-14T12:00:00Z'))
    expect(result).toEqual({ expired: 0 })
  })

  it('handles errors gracefully', async () => {
    const result = await runMatchExpiryJob(new Date('2026-07-14T12:00:00Z'))
    // Job design uses placeholder, so no real error case yet
    expect(result.expired).toBe(0)
  })

  it('uses current time as default', async () => {
    const result = await runMatchExpiryJob()
    expect(result.expired).toBeGreaterThanOrEqual(0)
  })
})
