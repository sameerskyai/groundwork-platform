/**
 * A/B Experiment utilities
 * Random assignment on first match creation
 * No verdict logic — pure instrumentation
 */

export type ExperimentArm = 'compatibility_ranked' | 'random'

/**
 * Assign user to experiment arm (50/50 random split)
 * Deterministic per user_id for consistency
 */
export function assignExperimentArm(userId: string): ExperimentArm {
  // Use hash of user_id for deterministic assignment
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  // 50/50 split
  return (Math.abs(hash) % 2) === 0 ? 'compatibility_ranked' : 'random'
}

/**
 * Record satisfaction for a match
 * Called after project completion
 */
export async function recordSatisfaction(
  supabase: any,
  matchId: string,
  score: number
): Promise<void> {
  if (score < 1 || score > 5) {
    throw new Error('Satisfaction score must be 1-5')
  }

  await supabase
    .from('matches')
    .update({
      satisfaction_score: score,
      satisfaction_recorded_at: new Date().toISOString()
    })
    .eq('id', matchId)
}

/**
 * Flag match as disputed
 * Called when homeowner reports issue
 */
export async function flagDispute(
  supabase: any,
  matchId: string
): Promise<void> {
  await supabase
    .from('matches')
    .update({
      dispute_flag: true,
      dispute_recorded_at: new Date().toISOString()
    })
    .eq('id', matchId)
}

/**
 * Get experiment statistics (read-only view)
 */
export async function getExperimentStats(supabase: any) {
  const { data } = await supabase.from('experiment_arm_stats').select('*')
  return data
}
