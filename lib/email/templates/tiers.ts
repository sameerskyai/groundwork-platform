/**
 * The referral ladder. One definition, used by the welcome email, the three
 * milestone emails, and the plain-text bodies of all four.
 *
 * Source of truth: DECISIONS.md "FOUNDER DECISION — The Founders Program is
 * canon (2026-07-24)" and WAR_PLAN.md DELTA 2. These thresholds also exist
 * in SQL in credit_referral() (migration 035), which is what actually flips
 * founding_member / backstory_eligible / homeowner_plus_eligible. If either
 * side changes, both change together.
 */

export const MILESTONE_THRESHOLDS = [3, 5, 10] as const
export type MilestoneThreshold = (typeof MILESTONE_THRESHOLDS)[number]

export interface Tier {
  count: MilestoneThreshold
  /** Short form for the tier table. */
  reward: string
  /** Long form for the milestone email headline and body. */
  headline: string
  detail: string
}

export const TIERS: Record<MilestoneThreshold, Tier> = {
  3: {
    count: 3,
    reward: 'Founding Member status',
    headline: "You're a Founding Member.",
    detail:
      'Founding Members get access first, in waves, ahead of everyone who joined after you. That status is now yours regardless of your position number.'
  },
  5: {
    count: 5,
    reward: 'Free Home Backstory report at launch',
    headline: 'Your Home Backstory report is free at launch.',
    detail:
      'When the Backstory report opens, yours is free. It pulls together what has been done to your house, what it cost, and what is coming due, so you are not guessing about your own property.'
  },
  10: {
    count: 10,
    reward: 'Laywork+ locked at $49/yr for life',
    headline: 'Laywork+ is locked at $49 a year, for life.',
    detail:
      'Laywork+ will be $99 a year. Yours is $49 a year for as long as you keep it. That price does not expire and it does not reset.'
  }
}

export function isMilestone(count: number): count is MilestoneThreshold {
  return (MILESTONE_THRESHOLDS as readonly number[]).includes(count)
}

/** Ordered rows for the tier table, marking everything already earned. */
export function tierRowsFor(verifiedReferrals: number) {
  return MILESTONE_THRESHOLDS.map(threshold => ({
    count: String(threshold).padStart(2, '0'),
    reward: TIERS[threshold].reward,
    reached: verifiedReferrals >= threshold
  }))
}
