import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runMatchRankerAgent } from '@/lib/agents'
import { haversineDistanceMiles } from '@/lib/geo'

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Load project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Hard filter: trade + active subscription + has lat/lng
    const { data: contractors } = await supabase
      .from('contractor_profiles')
      .select(`
        *,
        profiles(zip_code, lat, lng),
        contractor_trades(trade_id),
        contractor_pricing(field_key, value_low, value_high, unit)
      `)
      .eq('subscription_active', true)
      .eq('active', true)

    if (!contractors?.length) return NextResponse.json({ matches: [] })

    // Filter by trade and distance
    const filtered = contractors.filter(c => {
      const profile = c.profiles as any
      if (!profile?.lat || !profile?.lng || !project.lat || !project.lng) return false

      const hasTrade = c.contractor_trades?.some((ct: any) => ct.trade_id === project.trade_id)
      if (!hasTrade) return false

      const dist = haversineDistanceMiles(project.lat, project.lng, profile.lat, profile.lng)
      return dist <= (c.service_radius_miles ?? 25)
    })

    if (!filtered.length) return NextResponse.json({ matches: [] })

    // Check daily lead cap — don't show contractors who've hit their cap
    const today = new Date().toISOString().split('T')[0]
    const { data: tierConfig } = await supabase.from('subscription_tiers').select('*')
    const tierMap = Object.fromEntries((tierConfig ?? []).map((t: any) => [t.slug, t]))

    const withinCap = filtered.filter(c => {
      const cap = tierMap[c.subscription_tier]?.daily_lead_cap ?? 5
      const used = c.daily_leads_reset_at === today ? (c.daily_leads_used ?? 0) : 0
      return used < cap
    })

    // Build candidates for AI ranker
    const candidates = withinCap.map(c => {
      const profile = c.profiles as any
      const pricing = c.contractor_pricing as any[]
      const pricingVals = pricing?.map((p: any) => p.value_high).filter(Boolean)
      const dist = haversineDistanceMiles(project.lat!, project.lng!, profile.lat, profile.lng)

      return {
        id: c.id,
        businessName: c.business_name ?? 'Contractor',
        trades: c.contractor_trades?.map((t: any) => t.trade_id) ?? [],
        rating: c.rating ?? 0,
        reviewCount: c.review_count ?? 0,
        yearsInBusiness: c.years_in_business ?? 1,
        responseRate: c.response_rate ?? 100,
        subscriptionTier: c.subscription_tier ?? 'free',
        pricingRange: pricingVals?.length
          ? { low: Math.min(...pricingVals), high: Math.max(...pricingVals) }
          : undefined,
        distanceMiles: Math.round(dist)
      }
    })

    // AI ranker scores and orders candidates
    const ranked = await runMatchRankerAgent(
      {
        description: project.description,
        trade: project.ai_project_type ?? '',
        budgetMin: project.budget_min ?? undefined,
        budgetMax: project.budget_max ?? undefined,
        estimateLow: project.ai_estimate_low ?? undefined,
        estimateHigh: project.ai_estimate_high ?? undefined,
        zipCode: project.zip_code
      },
      candidates
    )

    // Upsert matches in DB (top 10)
    const topMatches = ranked.slice(0, 10)
    await supabase.from('matches').upsert(
      topMatches.map(m => ({
        project_id: projectId,
        contractor_id: m.contractorId,
        match_score: m.score,
        match_reasoning: m.reasoning,
        status: 'pending'
      })),
      { onConflict: 'project_id,contractor_id' }
    )

    return NextResponse.json({ matches: topMatches, total: ranked.length })
  } catch (err) {
    console.error('Match agent error:', err)
    return NextResponse.json({ error: 'Matching failed' }, { status: 500 })
  }
}

// Contractor accepts or declines a match
export async function PATCH(req: NextRequest) {
  try {
    const { matchId, action } = await req.json() // action: 'accept' | 'decline'
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: contractor } = await supabase
      .from('contractor_profiles')
      .select('id, daily_leads_used, daily_leads_reset_at, subscription_tier')
      .eq('user_id', user.id)
      .single()

    if (!contractor) return NextResponse.json({ error: 'Not a contractor' }, { status: 403 })

    if (action === 'accept') {
      const { data: match } = await supabase
        .from('matches')
        .select('*, projects(user_id, lat, lng, zip_code)')
        .eq('id', matchId)
        .eq('contractor_id', contractor.id)
        .single()

      if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

      const now = new Date().toISOString()
      const isMatched = match.homeowner_swiped_at != null

      await supabase.from('matches').update({
        contractor_swiped_at: now,
        status: isMatched ? 'matched' : 'contractor_review',
        matched_at: isMatched ? now : null
      }).eq('id', matchId)

      // Increment daily lead count
      const today = new Date().toISOString().split('T')[0]
      const resetCount = match.daily_leads_reset_at !== today
      await supabase.from('contractor_profiles').update({
        daily_leads_used: resetCount ? 1 : (contractor.daily_leads_used ?? 0) + 1,
        daily_leads_reset_at: today
      }).eq('id', contractor.id)

      return NextResponse.json({ status: isMatched ? 'matched' : 'pending_homeowner' })
    }

    if (action === 'decline') {
      await supabase.from('matches').update({ status: 'declined' }).eq('id', matchId)
      return NextResponse.json({ status: 'declined' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Match action error:', err)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}
