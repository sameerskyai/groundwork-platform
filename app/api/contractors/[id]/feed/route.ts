import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { haversineDistanceMiles } from '@/lib/geo'

const MONTHLY_CAP: Record<string, number> = { standard: 15, growth: 40 }

function isPriorMonth(dateStr: string | null): boolean {
  if (!dateStr) return true
  const d = new Date(dateStr)
  const now = new Date()
  return d.getUTCFullYear() < now.getUTCFullYear() ||
    (d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() < now.getUTCMonth())
}

// GET /api/contractors/:id/feed — projects the contractor can swipe on
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Load contractor profile (+ location + trades)
    const { data: contractor } = await supabase
      .from('contractor_profiles')
      .select(`
        id, user_id, subscription_tier, service_radius_miles,
        monthly_swipe_count, monthly_swipe_reset_at,
        profiles(lat, lng),
        contractor_trades(trade_id)
      `)
      .eq('id', id)
      .single()

    if (!contractor) return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })

    // 1. Auth: only the owning contractor may view their feed
    if (contractor.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tier = contractor.subscription_tier ?? 'standard'
    const limit = MONTHLY_CAP[tier] ?? MONTHLY_CAP.standard

    // 4. Reset monthly counter if the reset date is in a prior month
    let usedCount = contractor.monthly_swipe_count ?? 0
    if (isPriorMonth(contractor.monthly_swipe_reset_at)) {
      usedCount = 0
      await supabase
        .from('contractor_profiles')
        .update({ monthly_swipe_count: 0, monthly_swipe_reset_at: new Date().toISOString().split('T')[0] })
        .eq('id', contractor.id)
    }

    // 3. Cap check
    if (usedCount >= limit) {
      return NextResponse.json({ capped: true, limit, projects: [], swipes_remaining: 0 })
    }

    const prof = contractor.profiles as unknown as { lat: number | null; lng: number | null } | null
    const tradeIds = (contractor.contractor_trades as { trade_id: string }[] | null)?.map(t => t.trade_id) ?? []

    if (!tradeIds.length || !prof?.lat || !prof?.lng) {
      return NextResponse.json({ capped: false, projects: [], swipes_remaining: limit - usedCount })
    }

    // Already-swiped project ids for this contractor
    const { data: priorSwipes } = await supabase
      .from('swipes')
      .select('project_id')
      .eq('contractor_id', contractor.id)
      .eq('swiped_by', 'contractor')
    const swipedIds = new Set((priorSwipes ?? []).map(s => s.project_id))

    // 5. Active projects matching the contractor's trades
    const { data: projects } = await supabase
      .from('projects')
      .select('id, description, ai_project_type, ai_estimate_low, ai_estimate_high, zip_code, lat, lng, photo_urls, trade_id, created_at, budget_min, budget_max')
      .eq('status', 'active')
      .in('trade_id', tradeIds)
      .order('created_at', { ascending: false })

    const radius = contractor.service_radius_miles ?? 25
    const inRange = (projects ?? [])
      .filter(p => !swipedIds.has(p.id))
      .filter(p => {
        if (p.lat == null || p.lng == null) return false
        return haversineDistanceMiles(prof.lat!, prof.lng!, p.lat, p.lng) <= radius
      })
      .slice(0, 20)

    return NextResponse.json({
      projects: inRange,
      capped: false,
      swipes_remaining: limit - usedCount
    })
  } catch (err) {
    console.error('Contractor feed error:', err)
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 })
  }
}
