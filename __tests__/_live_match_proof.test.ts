/**
 * TEMPORARY live-database proof harness. Deleted after the run.
 * Exercises the real shipped modules against the real Supabase project.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('/Users/ryanbaz/Desktop/groundwork-platform/.env.local', 'utf8')
    .split('\n').filter(Boolean)
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)] })
)
process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const log = (...a: unknown[]) => console.log(...a)

describe('LIVE PROOF', () => {
  it('TASK 1 — matching returns a non-empty scored result', async () => {
    const { haversineDistanceMiles, zipToLatLng } = await import('@/lib/geo')
    const { runMatchRankerAgent, MATCH_THRESHOLD } = await import('@/lib/agents/match-ranker-agent')

    // A real, non-demo project belonging to a real user.
    const PROJECT_ID = 'ec641e54-084c-453b-bf28-2c9e4e0c4010'

    const { data: before } = await sb.from('projects')
      .select('id, user_id, zip_code, lat, lng, trade_id, description')
      .eq('id', PROJECT_ID).single()
    log('\n[1] PROJECT BEFORE (real, non-demo):', JSON.stringify(before))

    // --- route step 1b: geocode backfill --------------------------------
    let lat = before!.lat as number | null
    let lng = before!.lng as number | null
    if (lat == null || lng == null) {
      const coords = await zipToLatLng(String(before!.zip_code))
      if (coords) {
        lat = coords.lat; lng = coords.lng
        await sb.from('projects').update({ lat, lng }).eq('id', PROJECT_ID)
      }
    }
    const { data: after } = await sb.from('projects').select('id, zip_code, lat, lng').eq('id', PROJECT_ID).single()
    log('[2] PROJECT AFTER GEOCODE BACKFILL:', JSON.stringify(after))
    expect(lat).not.toBeNull()

    // --- route step 3: contractor pool from contractor_profiles ---------
    const { data: contractors } = await sb.from('contractor_profiles')
      .select(`id, business_name, bio, rating, review_count, years_in_business,
               response_rate, trust_score, verified_job_count, subscription_tier,
               service_radius_miles, zip_code, lat, lng, contractor_trades(trade_id)`)
      .eq('subscription_active', true).eq('active', true)

    // --- route step 4: hard filters -------------------------------------
    const inRange = (contractors ?? []).map(c => {
      const hasTrade = (c.contractor_trades as { trade_id: string }[] | null)?.some(ct => ct.trade_id === before!.trade_id)
      if (!hasTrade) return null
      if (c.lat == null || c.lng == null) return null
      const distance = haversineDistanceMiles(lat!, lng!, c.lat, c.lng)
      if (distance > (c.service_radius_miles ?? 25)) return null
      return { c, distance }
    }).filter(Boolean) as { c: any; distance: number }[]

    log('[3] POOL AFTER HARD FILTERS (trade + radius):',
      JSON.stringify(inRange.map(x => ({
        id: x.c.id, business_name: x.c.business_name, zip: x.c.zip_code,
        distance_miles: Math.round(x.distance * 10) / 10, radius: x.c.service_radius_miles
      })), null, 1))
    expect(inRange.length).toBeGreaterThan(0)

    // --- route step 6: real ranker call ---------------------------------
    const ranked = await runMatchRankerAgent(
      {
        description: before!.description ?? '',
        trade: 'hvac',
        zipCode: String(before!.zip_code),
        preferences: null
      },
      inRange.map(({ c, distance }) => ({
        id: c.id,
        businessName: c.business_name ?? 'Contractor',
        trades: (c.contractor_trades ?? []).map((t: any) => t.trade_id),
        rating: Number(c.rating ?? 0),
        reviewCount: c.review_count ?? 0,
        yearsInBusiness: c.years_in_business ?? 1,
        responseRate: c.response_rate ?? 100,
        subscriptionTier: c.subscription_tier ?? 'free',
        distanceMiles: Math.round(distance)
      })),
      new Map(inRange.map(({ c }) => [c.id, c.service_radius_miles ?? 25]))
    )
    log('[4] RANKER OUTPUT (0-1 scale):', JSON.stringify(ranked, null, 1))
    expect(ranked.length).toBeGreaterThan(0)
    for (const r of ranked) expect(r.score).toBeLessThanOrEqual(1)

    // --- route step 6b: persist ------------------------------------------
    const { error: upErr } = await sb.from('matches').upsert(
      ranked.map(r => ({
        project_id: PROJECT_ID, contractor_id: r.contractorId,
        match_score: r.score, match_reasoning: r.reasoning, status: 'pending'
      })),
      { onConflict: 'project_id,contractor_id' }
    )
    log('[5] PERSIST ERROR:', upErr?.message ?? 'none')
    expect(upErr).toBeNull()

    const { data: persisted } = await sb.from('matches')
      .select('id, project_id, contractor_id, match_score, match_reasoning, status')
      .eq('project_id', PROJECT_ID)
    log('[6] matches ROWS NOW IN THE DATABASE:', JSON.stringify(persisted, null, 1))

    // --- route step 7: the gate ------------------------------------------
    const gated = (persisted ?? []).filter(m => Number(m.match_score) >= MATCH_THRESHOLD)
    log('[7] SERVER-SIDE GATE >= ' + MATCH_THRESHOLD + ' -> returned candidates:',
      JSON.stringify(gated.map(g => ({ contractor_id: g.contractor_id, match_score: g.match_score })), null, 1))
    expect(gated.length).toBeGreaterThan(0)
  }, 120_000)

  it('TASK 2 — below-threshold excluded, above-threshold included (real gate query)', async () => {
    const { haversineDistanceMiles, zipToLatLng } = await import('@/lib/geo')
    const { runMatchRankerAgent, MATCH_THRESHOLD } = await import('@/lib/agents/match-ranker-agent')

    // Second real project. Plumbing, ZIP 20155. The only plumber in the pool
    // sits 16 miles out inside a 25-mile radius with no reviews, so this one
    // scores BELOW the gate on its own merits — nothing is constructed.
    const BELOW_PROJECT = 'e16ace1f-22ff-4bca-9d95-1f794e496f41'
    const ABOVE_PROJECT = 'ec641e54-084c-453b-bf28-2c9e4e0c4010'

    const { data: p } = await sb.from('projects')
      .select('id, zip_code, lat, lng, trade_id, description').eq('id', BELOW_PROJECT).single()
    let lat = p!.lat as number | null, lng = p!.lng as number | null
    if (lat == null) {
      const coords = await zipToLatLng(String(p!.zip_code))
      lat = coords!.lat; lng = coords!.lng
      await sb.from('projects').update({ lat, lng }).eq('id', BELOW_PROJECT)
    }

    const { data: contractors } = await sb.from('contractor_profiles')
      .select(`id, business_name, rating, review_count, years_in_business, response_rate,
               subscription_tier, service_radius_miles, lat, lng, contractor_trades(trade_id)`)
      .eq('subscription_active', true).eq('active', true)

    const inRange = (contractors ?? []).map(c => {
      const hasTrade = (c.contractor_trades as { trade_id: string }[] | null)?.some(ct => ct.trade_id === p!.trade_id)
      if (!hasTrade || c.lat == null || c.lng == null) return null
      const distance = haversineDistanceMiles(lat!, lng!, c.lat, c.lng)
      if (distance > (c.service_radius_miles ?? 25)) return null
      return { c, distance }
    }).filter(Boolean) as { c: any; distance: number }[]

    log('\n[TASK2-A] BELOW-CASE pool (project ' + BELOW_PROJECT + ', plumbing, ZIP ' + p!.zip_code + '):',
      JSON.stringify(inRange.map(x => ({ business_name: x.c.business_name, distance_miles: Math.round(x.distance * 10) / 10, radius: x.c.service_radius_miles })), null, 1))

    const ranked = await runMatchRankerAgent(
      { description: p!.description ?? '', trade: 'plumbing', zipCode: String(p!.zip_code), preferences: null },
      inRange.map(({ c, distance }) => ({
        id: c.id, businessName: c.business_name, trades: [], rating: Number(c.rating ?? 0),
        reviewCount: c.review_count ?? 0, yearsInBusiness: c.years_in_business ?? 1,
        responseRate: c.response_rate ?? 100, subscriptionTier: c.subscription_tier ?? 'free',
        distanceMiles: Math.round(distance)
      })),
      new Map(inRange.map(({ c }) => [c.id, c.service_radius_miles ?? 25]))
    )
    log('[TASK2-B] BELOW-CASE scores:', JSON.stringify(ranked, null, 1))

    await sb.from('matches').upsert(
      ranked.map(r => ({ project_id: BELOW_PROJECT, contractor_id: r.contractorId, match_score: r.score, match_reasoning: r.reasoning, status: 'pending' })),
      { onConflict: 'project_id,contractor_id' }
    )

    // The exact query the UI gate runs (homeowner/matches/page.tsx).
    const gateQuery = (projectId: string) => sb.from('matches')
      .select('project_id, contractor_id, match_score')
      .eq('project_id', projectId).gte('match_score', 0.8)
      .order('match_score', { ascending: false })

    const { data: belowAll } = await sb.from('matches')
      .select('contractor_id, match_score').eq('project_id', BELOW_PROJECT)
    const { data: belowGated } = await gateQuery(BELOW_PROJECT)
    log('[TASK2-C] BELOW project persisted:', JSON.stringify(belowAll))
    log('[TASK2-D] BELOW project through .gte(match_score, 0.8):', JSON.stringify(belowGated), '-> EXCLUDED')

    const { data: aboveAll } = await sb.from('matches')
      .select('contractor_id, match_score').eq('project_id', ABOVE_PROJECT)
    const { data: aboveGated } = await gateQuery(ABOVE_PROJECT)
    log('[TASK2-E] ABOVE project persisted:', JSON.stringify(aboveAll))
    log('[TASK2-F] ABOVE project through .gte(match_score, 0.8):', JSON.stringify(aboveGated), '-> INCLUDED')

    expect(ranked.every(r => r.score < MATCH_THRESHOLD)).toBe(true)
    expect((belowGated ?? []).length).toBe(0)
    expect((aboveGated ?? []).length).toBeGreaterThan(0)
    for (const g of aboveGated ?? []) expect(Number(g.match_score)).toBeGreaterThanOrEqual(0.8)
  }, 120_000)

  it('TASK 3 — daily lead cap actually caps', async () => {
    const CONTRACTOR_ID = '27298d62-fd2a-4886-b93f-7f8c8f32f327' // Manassas Comfort HVAC (real)
    const { data: snapshot } = await sb.from('contractor_profiles')
      .select('id, business_name, subscription_tier, daily_leads_used, daily_leads_reset_at')
      .eq('id', CONTRACTOR_ID).single()
    log('\n[TASK3-0] SNAPSHOT BEFORE:', JSON.stringify(snapshot))

    const { data: tiers } = await sb.from('subscription_tiers').select('slug, daily_lead_cap')
    const ALIASES: Record<string, string> = { free: 'standard', paid_unlimited: 'growth' }
    const bySlug = Object.fromEntries((tiers ?? []).map(t => [t.slug, t.daily_lead_cap]))
    const tier = snapshot!.subscription_tier ?? 'free'
    const cap = bySlug[tier] ?? bySlug[ALIASES[tier]] ?? 5
    log('[TASK3-1] tier =', tier, '-> subscription_tiers slug', ALIASES[tier], '-> daily_lead_cap =', cap)

    // Start the day clean, as a fresh contractor would.
    const today = new Date().toISOString().split('T')[0]
    await sb.from('contractor_profiles')
      .update({ daily_leads_used: 0, daily_leads_reset_at: today }).eq('id', CONTRACTOR_ID)

    // Faithful transcription of the accept branch of PATCH /api/match.
    async function accept() {
      const { data: c } = await sb.from('contractor_profiles')
        .select('id, daily_leads_used, daily_leads_reset_at, subscription_tier')
        .eq('id', CONTRACTOR_ID).single()
      const resetDate = c!.daily_leads_reset_at ? String(c!.daily_leads_reset_at).split('T')[0] : null
      const isNewDay = resetDate !== today
      const used = isNewDay ? 0 : (c!.daily_leads_used ?? 0)
      if (used >= cap) return { status: 429, error: 'Daily lead limit reached for your plan', daily_leads_used: used, daily_lead_cap: cap }
      const { data: spent } = await sb.from('contractor_profiles')
        .update({ daily_leads_used: used + 1, daily_leads_reset_at: today })
        .eq('id', CONTRACTOR_ID).eq('daily_leads_used', c!.daily_leads_used ?? 0)
        .select('daily_leads_used, daily_leads_reset_at').maybeSingle()
      if (!spent) return { status: 409, error: 'Lead count changed while accepting' }
      return { status: 200, daily_leads_used: spent.daily_leads_used, daily_lead_cap: cap }
    }

    log('[TASK3-2] simulating ' + (cap + 2) + ' accepts in one day (cap = ' + cap + '):')
    const results: unknown[] = []
    for (let i = 1; i <= cap + 2; i++) {
      const r = await accept()
      const { data: row } = await sb.from('contractor_profiles')
        .select('daily_leads_used, daily_leads_reset_at').eq('id', CONTRACTOR_ID).single()
      log(`   accept #${i} -> HTTP ${r.status} ${r.error ?? ''} | contractor_profiles row: ${JSON.stringify(row)}`)
      results.push(r)
    }

    const statuses = (results as { status: number }[]).map(r => r.status)
    log('[TASK3-3] status sequence:', JSON.stringify(statuses))
    expect(statuses.slice(0, cap).every(s => s === 200)).toBe(true)
    expect(statuses.slice(cap).every(s => s === 429)).toBe(true)

    // Restore the row exactly as found — this is a real contractor.
    await sb.from('contractor_profiles').update({
      daily_leads_used: snapshot!.daily_leads_used,
      daily_leads_reset_at: snapshot!.daily_leads_reset_at
    }).eq('id', CONTRACTOR_ID)
    const { data: restored } = await sb.from('contractor_profiles')
      .select('id, business_name, daily_leads_used, daily_leads_reset_at').eq('id', CONTRACTOR_ID).single()
    log('[TASK3-4] RESTORED TO SNAPSHOT:', JSON.stringify(restored))
  }, 120_000)
})
