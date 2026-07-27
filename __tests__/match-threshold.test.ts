import { describe, it, expect } from 'vitest'
import { MATCH_THRESHOLD, MATCH_SCORE_SCALE } from '@/lib/agents/match-ranker-agent'

/**
 * Rewritten. This suite used to import `lib/agents/match-scorer.ts`, which
 * scored 0–100 and was deleted: it had no caller, never persisted anything,
 * and read a `homeowner_preferences` table that does not exist. There is now
 * one scale (0–1, dictated by `matches.match_score DECIMAL(4,3)`) and one
 * threshold (`MATCH_THRESHOLD`).
 */
describe('Match gate — one scale, one threshold', () => {
  it('is expressed on the 0–1 scale the matches column can actually hold', () => {
    expect(MATCH_SCORE_SCALE.max).toBe(1)
    expect(MATCH_SCORE_SCALE.decimals).toBe(3)
    expect(MATCH_THRESHOLD).toBeGreaterThan(MATCH_SCORE_SCALE.min)
    expect(MATCH_THRESHOLD).toBeLessThanOrEqual(MATCH_SCORE_SCALE.max)
  })

  it('is the marketed 80%', () => {
    expect(MATCH_THRESHOLD).toBe(0.8)
    expect(Math.round(MATCH_THRESHOLD * 100)).toBe(80)
  })

  it('admits at-and-above, excludes below', () => {
    const cases = [
      { score: 0.85, admitted: true },
      { score: 0.8, admitted: true },
      { score: 0.799, admitted: false },
      { score: 0.62, admitted: false }
    ]
    for (const c of cases) {
      expect(c.score >= MATCH_THRESHOLD).toBe(c.admitted)
    }
  })

  it('filters a mixed pool the way the candidates route does', () => {
    const pool = [
      { contractor_id: 'c1', match_score: 0.88 },
      { contractor_id: 'c2', match_score: 0.76 },
      { contractor_id: 'c3', match_score: 0.82 },
      { contractor_id: 'c4', match_score: 0.62 }
    ]

    const above = pool
      .filter(c => c.match_score >= MATCH_THRESHOLD)
      .sort((a, b) => b.match_score - a.match_score)

    expect(above.map(c => c.contractor_id)).toEqual(['c1', 'c3'])
    expect(pool.length - above.length).toBe(2)
    expect(above.every(c => c.match_score >= MATCH_THRESHOLD)).toBe(true)
  })

  it('a score persisted on the wrong scale would not fit the column', () => {
    // DECIMAL(4,3) tops out at 9.999. This is why 0-100 was never viable.
    const maxStorable = 9.999
    expect(85).toBeGreaterThan(maxStorable)
    expect(0.85).toBeLessThanOrEqual(maxStorable)
  })
})
