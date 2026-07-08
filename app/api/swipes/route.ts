import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MONTHLY_CAP: Record<string, number> = { standard: 15, growth: 40 }

function isPriorMonth(dateStr: string | null): boolean {
  if (!dateStr) return true
  const d = new Date(dateStr)
  const now = new Date()
  return d.getUTCFullYear() < now.getUTCFullYear() ||
    (d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() < now.getUTCMonth())
}

// POST /api/swipes — record a swipe, detect mutual match
export async function POST(req: NextRequest) {
  try {
    const { project_id, contractor_id, direction, swiped_by } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Validate
    if (!project_id || !contractor_id) {
      return NextResponse.json({ error: 'project_id and contractor_id are required' }, { status: 400 })
    }
    if (direction !== 'yes' && direction !== 'pass') {
      return NextResponse.json({ error: "direction must be 'yes' or 'pass'" }, { status: 400 })
    }
    if (swiped_by !== 'homeowner' && swiped_by !== 'contractor') {
      return NextResponse.json({ error: "swiped_by must be 'homeowner' or 'contractor'" }, { status: 400 })
    }

    const now = new Date().toISOString()

    // 3 + 4. Contractor "yes" — enforce & increment monthly cap
    if (swiped_by === 'contractor' && direction === 'yes') {
      const { data: contractor } = await supabase
        .from('contractor_profiles')
        .select('id, subscription_tier, monthly_swipe_count, monthly_swipe_reset_at')
        .eq('id', contractor_id)
        .single()

      if (contractor) {
        const tier = contractor.subscription_tier ?? 'standard'
        const limit = MONTHLY_CAP[tier] ?? MONTHLY_CAP.standard
        const reset = isPriorMonth(contractor.monthly_swipe_reset_at)
        const used = reset ? 0 : (contractor.monthly_swipe_count ?? 0)

        if (used >= limit) {
          return NextResponse.json({ error: 'Monthly match limit reached for your plan' }, { status: 429 })
        }

        await supabase
          .from('contractor_profiles')
          .update({
            monthly_swipe_count: used + 1,
            monthly_swipe_reset_at: reset ? now.split('T')[0] : contractor.monthly_swipe_reset_at
          })
          .eq('id', contractor_id)
      }
    }

    // 5. Insert swipe — handle UNIQUE (project_id, contractor_id, swiped_by) conflict
    let swipe: Record<string, unknown> | null = null
    const { data: inserted, error: insertErr } = await supabase
      .from('swipes')
      .insert({ project_id, contractor_id, direction, swiped_by })
      .select()
      .single()

    if (insertErr) {
      // Likely a duplicate — return the existing swipe rather than erroring
      const { data: existing } = await supabase
        .from('swipes')
        .select('*')
        .eq('project_id', project_id)
        .eq('contractor_id', contractor_id)
        .eq('swiped_by', swiped_by)
        .single()
      if (!existing) {
        console.error('Swipe insert error:', insertErr)
        return NextResponse.json({ error: 'Failed to record swipe' }, { status: 500 })
      }
      swipe = existing
    } else {
      swipe = inserted
    }

    // 6. Mutual match: a 'yes' from BOTH sides for this pair
    const { data: yesSwipes } = await supabase
      .from('swipes')
      .select('swiped_by')
      .eq('project_id', project_id)
      .eq('contractor_id', contractor_id)
      .eq('direction', 'yes')

    const sides = new Set((yesSwipes ?? []).map(s => s.swiped_by))
    const matched = sides.has('homeowner') && sides.has('contractor')

    let match_id: string | undefined
    if (matched) {
      // 7. Reuse an existing match row if present, otherwise create one
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .eq('project_id', project_id)
        .eq('contractor_id', contractor_id)
        .maybeSingle()

      if (existingMatch) {
        match_id = existingMatch.id
      } else {
        const { data: newMatch } = await supabase
          .from('matches')
          .insert({
            project_id,
            contractor_id,
            status: 'pending',
            homeowner_swiped_at: now,
            contractor_swiped_at: now,
            matched_at: now
          })
          .select('id')
          .single()
        match_id = newMatch?.id
      }
    }

    return NextResponse.json({ swipe, matched, match_id })
  } catch (err) {
    console.error('Swipe POST error:', err)
    return NextResponse.json({ error: 'Failed to record swipe' }, { status: 500 })
  }
}
