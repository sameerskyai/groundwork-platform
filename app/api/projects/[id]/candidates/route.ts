import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { haversineDistanceMiles, zipToLatLng } from '@/lib/geo'
import { runMatchRankerAgent, MATCH_THRESHOLD, type ContractorCandidate } from '@/lib/agents/match-ranker-agent'

/**
 * THE contractor matching implementation. There is exactly one.
 *
 * Two parallel implementations used to exist and both returned empty on every
 * call:
 *
 *   1. `POST /api/match` joined `profiles(zip_code, lat, lng)` for contractor
 *      location. `profiles` RLS is owner-only (`001_initial.sql:287`), so that
 *      embedded resource resolves to `null` for every contractor but the caller
 *      themselves, and the `!profile?.lat` guard then dropped 100% of the pool.
 *      Migration 006 had already moved location onto `contractor_profiles`
 *      (public-read) precisely to fix this; `/api/match` was never updated.
 *      That handler is deleted — `app/api/match/route.ts` now only serves the
 *      contractor's accept/decline PATCH.
 *
 *   2. This route, which read the right table but bailed whenever
 *      `project.lat` was null — and the live estimate flow inserted projects
 *      with no lat/lng at all. That is fixed at the source (the estimate page
 *      now geocodes before insert) and lazily backfilled here for the projects
 *      already in the database without coordinates.
 *
 * This route also persists the score. `matches.match_score` is the column the
 * 80% gate reads (`homeowner/matches/page.tsx`), and nothing wrote it outside
 * the seed data before now.
 */

interface ScoredCandidate {
  id: string
  business_name: string
  bio: string
  rating: number
  review_count: number
  years_in_business: number
  trust_score: number | null
  verified_job_count: number
  subscription_tier: string
  distance_miles: number
  zip_code: string
  match_score: number
  match_reasoning: string
}

// GET /api/projects/:id/candidates — contractors at or above the 80% gate.
//
// Scoring is a write: the first call for a project ranks the pool and persists
// each score to `matches`. Later calls reuse the persisted scores and make no
// model call. The side effect on a GET is deliberate and idempotent — it is
// what makes the deck on the dashboard and the gate on /homeowner/matches read
// the same numbers.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Load project and verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id, trade_id, lat, lng, zip_code, description, budget_min, budget_max, ai_project_type, ai_estimate_low, ai_estimate_high')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // 1b. Backfill coordinates for projects created before the estimate flow
    // geocoded. Without this every project already in the database matches
    // nothing forever, because distance is the hard filter.
    let projectLat = project.lat as number | null
    let projectLng = project.lng as number | null
    if ((projectLat == null || projectLng == null) && project.zip_code) {
      const coords = await zipToLatLng(String(project.zip_code))
      if (coords) {
        projectLat = coords.lat
        projectLng = coords.lng
        await supabase
          .from('projects')
          .update({ lat: coords.lat, lng: coords.lng })
          .eq('id', id)
          .eq('user_id', user.id)
      }
    }

    if (projectLat == null || projectLng == null) {
      return NextResponse.json({
        candidates: [],
        threshold: MATCH_THRESHOLD,
        total_candidates: 0,
        below_threshold: 0,
        reason: 'project_location_unknown'
      })
    }

    // 2. Contractors already swiped on by the homeowner for this project
    const { data: priorSwipes } = await supabase
      .from('swipes')
      .select('contractor_id')
      .eq('project_id', id)
      .eq('swiped_by', 'homeowner')
    const swipedIds = new Set((priorSwipes ?? []).map(s => s.contractor_id))

    // 3. Active contractors with location + trades.
    // Location lives on contractor_profiles (public-read) — not profiles,
    // which RLS locks to the owning user and would silently return null here.
    // `contractor_pricing` is deliberately NOT joined: RLS is enabled on it
    // with zero policies (001_initial.sql), so the join can only ever return
    // an empty array, which would read as "no pricing on file" rather than as
    // the permission failure it is.
    const { data: contractors } = await supabase
      .from('contractor_profiles')
      .select(`
        id, business_name, bio, rating, review_count, years_in_business,
        response_rate, trust_score, verified_job_count, subscription_tier,
        service_radius_miles, zip_code, lat, lng,
        contractor_trades(trade_id)
      `)
      .eq('subscription_active', true)
      .eq('active', true)

    if (!contractors?.length) {
      return NextResponse.json({
        candidates: [], threshold: MATCH_THRESHOLD, total_candidates: 0, below_threshold: 0
      })
    }

    // 4. Hard filters: trade match + inside the contractor's service radius +
    // not already swiped. These are facts, not judgement — the model never
    // sees a contractor who fails them.
    const inRange = contractors
      .filter(c => !swipedIds.has(c.id))
      .map(c => {
        const hasTrade = (c.contractor_trades as { trade_id: string }[] | null)?.some(
          ct => ct.trade_id === project.trade_id
        )
        if (!hasTrade) return null
        if (c.lat == null || c.lng == null) return null

        const distance = haversineDistanceMiles(projectLat, projectLng, c.lat, c.lng)
        if (distance > (c.service_radius_miles ?? 25)) return null

        return { c, distance }
      })
      .filter((x): x is { c: (typeof contractors)[number]; distance: number } => x !== null)

    if (!inRange.length) {
      return NextResponse.json({
        candidates: [], threshold: MATCH_THRESHOLD, total_candidates: 0, below_threshold: 0
      })
    }

    // 5. Reuse scores already persisted for this project.
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('contractor_id, match_score, match_reasoning')
      .eq('project_id', id)

    const scored = new Map<string, { score: number; reasoning: string }>()
    for (const m of existingMatches ?? []) {
      if (m.match_score != null) {
        scored.set(m.contractor_id as string, {
          score: Number(m.match_score),
          reasoning: (m.match_reasoning as string) ?? ''
        })
      }
    }

    // 6. Score whatever is not scored yet — one model call for the whole batch.
    const unscored = inRange.filter(({ c }) => !scored.has(c.id))
    if (unscored.length) {
      // homeowner_preferences does not exist in the live database yet
      // (migration 042, pending founder apply). PostgREST returns an error
      // rather than throwing, so this degrades to `null` until it is applied.
      const { data: preferences } = await supabase
        .from('homeowner_preferences')
        .select('preferred_budget, preferred_timeline, preferred_style, experience_level_preference')
        .eq('user_id', user.id)
        .maybeSingle()

      const forRanker: ContractorCandidate[] = unscored.map(({ c, distance }) => ({
        id: c.id,
        businessName: c.business_name ?? 'Contractor',
        trades: (c.contractor_trades as { trade_id: string }[] | null)?.map(t => t.trade_id) ?? [],
        rating: Number(c.rating ?? 0),
        reviewCount: c.review_count ?? 0,
        yearsInBusiness: c.years_in_business ?? 1,
        responseRate: c.response_rate ?? 100,
        subscriptionTier: c.subscription_tier ?? 'free',
        distanceMiles: Math.round(distance)
      }))

      // Service radius is what the deterministic fallback measures proximity
      // against, so it travels with the batch rather than being re-derived.
      const radiusByCandidate = new Map(
        unscored.map(({ c }) => [c.id, c.service_radius_miles ?? 25])
      )

      const ranked = await runMatchRankerAgent(
        {
          description: project.description ?? '',
          trade: project.ai_project_type ?? '',
          budgetMin: project.budget_min ?? undefined,
          budgetMax: project.budget_max ?? undefined,
          estimateLow: project.ai_estimate_low ?? undefined,
          estimateHigh: project.ai_estimate_high ?? undefined,
          zipCode: project.zip_code ?? '',
          preferences: preferences ?? null
        },
        forRanker,
        radiusByCandidate
      )

      for (const r of ranked) scored.set(r.contractorId, { score: r.score, reasoning: r.reasoning })

      // Persist every score, including the ones below the gate. The gate is a
      // read-time filter, not a reason to lose the number — a homeowner who
      // later adds a budget gets rescored against a record that exists.
      if (ranked.length) {
        const { error: upsertError } = await supabase.from('matches').upsert(
          ranked.map(r => ({
            project_id: id,
            contractor_id: r.contractorId,
            match_score: r.score,
            match_reasoning: r.reasoning,
            status: 'pending'
          })),
          { onConflict: 'project_id,contractor_id' }
        )
        if (upsertError) console.error('Match score persist failed:', upsertError)
      }
    }

    // 7. THE 80% gate, enforced server-side. Sub-threshold contractors are
    // never returned, whatever the client asks for.
    const all: ScoredCandidate[] = inRange.map(({ c, distance }) => {
      const s = scored.get(c.id)
      return {
        id: c.id,
        business_name: c.business_name ?? 'Contractor',
        bio: c.bio ?? '',
        rating: Number(c.rating ?? 0),
        review_count: c.review_count ?? 0,
        years_in_business: c.years_in_business ?? 0,
        trust_score: c.trust_score ?? null,
        verified_job_count: c.verified_job_count ?? 0,
        subscription_tier: c.subscription_tier ?? 'free',
        distance_miles: Math.round(distance * 10) / 10,
        zip_code: c.zip_code ?? '',
        match_score: s?.score ?? 0,
        match_reasoning: s?.reasoning ?? ''
      }
    })

    const above = all
      .filter(c => c.match_score >= MATCH_THRESHOLD)
      .sort((a, b) => {
        if (b.match_score !== a.match_score) return b.match_score - a.match_score
        const ta = a.trust_score ?? -1
        const tb = b.trust_score ?? -1
        if (tb !== ta) return tb - ta
        return b.rating - a.rating
      })

    return NextResponse.json({
      candidates: above.slice(0, 10),
      threshold: MATCH_THRESHOLD,
      total_candidates: all.length,
      below_threshold: all.length - above.length
    })
  } catch (err) {
    console.error('Candidates error:', err)
    return NextResponse.json({ error: 'Failed to load candidates' }, { status: 500 })
  }
}
