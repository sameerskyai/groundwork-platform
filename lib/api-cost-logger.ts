/**
 * AI API COST LOGGER & FREE TIER ENFORCER
 * Tracks API spend and prevents free tier overages
 */

import { createClient } from '@/lib/supabase/server'

export interface APICallMetrics {
  inputTokens: number
  outputTokens: number
  costCents: number
}

/**
 * Log an API call and enforce free tier limits
 * Returns { success: boolean, error?: string, callsRemaining?: number }
 */
export async function logAPICall(
  userId: string,
  callType: 'estimate' | 'match_scoring' | 'other',
  model: string,
  metrics: APICallMetrics
): Promise<{
  success: boolean
  error?: string
  message?: string
  callsRemaining?: number
  callsLimit?: number
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .rpc('log_api_call', {
        p_user_id: userId,
        p_call_type: callType,
        p_model: model,
        p_input_tokens: metrics.inputTokens,
        p_output_tokens: metrics.outputTokens,
        p_cost_cents: metrics.costCents
      })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return data as any
  } catch (err: any) {
    console.error('[COST LOGGER] Error logging API call:', err)
    return {
      success: false,
      error: 'Failed to log API usage'
    }
  }
}

/**
 * Get current month's API usage for a user
 */
export async function getUserMonthlyUsage(userId: string) {
  const supabase = await createClient()
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

  const { data, error } = await supabase
    .from('user_monthly_api_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data || {
    estimate_calls_count: 0,
    total_cost_cents: 0,
    total_tokens_used: 0
  }
}

/**
 * Calculate cost from token count (Claude Haiku pricing)
 * Haiku: $0.80 / 1M input tokens, $4.00 / 1M output tokens
 */
export function calculateEstimateCost(
  inputTokens: number,
  outputTokens: number
): number {
  const INPUT_COST_PER_1M = 80 // cents
  const OUTPUT_COST_PER_1M = 400 // cents

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M

  return Math.ceil(inputCost + outputCost) // Round up to nearest cent
}

/**
 * Get dashboard query to show total spend across all users
 * Usage: const spend = await getWeeklySpend()
 */
export async function getWeeklySpendDashboard() {
  const supabase = await createClient()

  // Get spend from last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: byType } = await supabase
    .from('ai_api_calls')
    .select('call_type, total_cost_cents')
    .gte('created_at', sevenDaysAgo)
    .eq('is_demo', false) // Exclude demo

  const { data: byUser } = await supabase
    .from('ai_api_calls')
    .select('user_id, total_cost_cents')
    .gte('created_at', sevenDaysAgo)
    .eq('is_demo', false)

  // Aggregate by type
  const costByType: Record<string, number> = {}
  byType?.forEach(row => {
    costByType[row.call_type] = (costByType[row.call_type] || 0) + row.total_cost_cents
  })

  // Sort users by spend
  const costByUser: Array<[string, number]> = []
  byUser?.forEach(row => {
    const existing = costByUser.findIndex(([uid]) => uid === row.user_id)
    if (existing >= 0) {
      costByUser[existing][1] += row.total_cost_cents
    } else {
      costByUser.push([row.user_id, row.total_cost_cents])
    }
  })
  costByUser.sort((a, b) => b[1] - a[1])

  const totalCents = Object.values(costByType).reduce((a, b) => a + b, 0)

  return {
    totalSpendCents: totalCents,
    totalSpendDollars: (totalCents / 100).toFixed(2),
    costByType,
    topUsersByCost: costByUser.slice(0, 10),
    period: '7_days'
  }
}
