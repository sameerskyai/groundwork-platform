import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreProjectContractorMatch } from '@/lib/agents/match-scorer'

// POST /api/projects/[id]/score
// Score a project against contractors in the matching pool
// Returns matches that score 85%+
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load project
    const { data: project } = await supabase
      .from('projects')
      .select('*, trades(slug)')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Load homeowner preferences (if available)
    const { data: preferences } = await supabase
      .from('homeowner_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Find all contractor profiles within reasonable distance
    // (service_radius_miles, not exceeding project bounds + padding)
    const { data: candidates } = await supabase
      .from('contractor_profiles')
      .select(`
        id,
        user_id,
        business_name,
        rating,
        trust_score,
        service_radius_miles,
        zip_code,
        lat,
        lng,
        verified_job_count,
        subscription_tier
      `)
      .eq('subscription_active', true)

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        project_id: projectId,
        matches: [],
        message: 'No active contractors found'
      })
    }

    // Score each candidate
    const scores = await Promise.all(
      candidates.map(contractor =>
        scoreProjectContractorMatch(
          {
            budget_min: project.budget_min,
            budget_max: project.budget_max,
            zip_code: project.zip_code,
            lat: project.lat,
            lng: project.lng,
            trade_id: project.trade_id,
            description: project.description,
            homeowner_preferences: preferences
          },
          contractor as any
        ).then(score => ({
          contractor_id: contractor.id,
          contractor_name: contractor.business_name,
          ...score
        }))
      )
    )

    // Filter to 80%+ (HARD GATE: server-side enforcement)
    // Sub-80% matches never returned to client, even if they exist in DB
    const COMPATIBILITY_THRESHOLD = 80
    const strongMatches = scores
      .filter(s => s.match_percentage >= COMPATIBILITY_THRESHOLD)
      .sort((a, b) => b.match_percentage - a.match_percentage)

    const subThresholdCount = scores.length - strongMatches.length

    return NextResponse.json({
      project_id: projectId,
      total_candidates: candidates.length,
      matches_found: strongMatches.length,
      matches_sub_threshold: subThresholdCount,
      threshold: COMPATIBILITY_THRESHOLD,
      matches: strongMatches
    })
  } catch (err) {
    console.error('Scoring error:', err)
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }
}
