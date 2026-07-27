import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Contractor accept / decline. This file used to also export a POST handler
 * that ran a second, parallel contractor-matching implementation. It was
 * deleted, not repaired.
 *
 * Why deleted: it selected contractor location through
 * `profiles(zip_code, lat, lng)`, and `profiles` RLS is owner-only
 * (`001_initial.sql:287`), so the embedded row came back `null` for every
 * contractor except the caller and the `!profile?.lat` guard dropped the
 * entire pool on every request. Migration 006 had already moved location to
 * `contractor_profiles` for exactly this reason. Nothing in the app called
 * `POST /api/match`, whereas `GET /api/projects/[id]/candidates` is wired into
 * the homeowner dashboard, reads the correct table, and now also persists
 * `matches.match_score` — so that is the surviving implementation.
 *
 * What remains here is not matching. It is lead consumption: the point where a
 * contractor spends one of the daily leads their $79 / $149 plan pays for.
 */

// The `subscription_tiers` config table is keyed by the tier slugs from
// 001_initial.sql ('standard', 'growth'). Migration 016 renamed the values
// stored on contractor_profiles to 'free' / 'paid_unlimited' but left the
// config table untouched, so a direct lookup misses and every contractor
// silently fell back to the default cap. Map the renamed values back.
const TIER_SLUG_ALIASES: Record<string, string> = {
  free: 'standard',
  paid_unlimited: 'growth'
}
const DEFAULT_DAILY_LEAD_CAP = 5

function resolveDailyCap(
  tiers: { slug: string; daily_lead_cap: number }[] | null,
  contractorTier: string | null
): number {
  const tier = contractorTier ?? 'free'
  const bySlug = Object.fromEntries((tiers ?? []).map(t => [t.slug, t.daily_lead_cap]))
  return bySlug[tier] ?? bySlug[TIER_SLUG_ALIASES[tier]] ?? DEFAULT_DAILY_LEAD_CAP
}

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

      // ---- Daily lead cap -------------------------------------------------
      // The reset date was previously read off `match.daily_leads_reset_at`.
      // That column lives on contractor_profiles, not matches, so the value
      // was always `undefined`, `undefined !== today` was always true, and the
      // counter was reset to 1 on every single accept. Contractors were never
      // capped — a straight revenue leak against the metered tiers. The value
      // is right here on `contractor`, already fetched.
      const today = new Date().toISOString().split('T')[0]
      const resetDate = contractor.daily_leads_reset_at
        ? String(contractor.daily_leads_reset_at).split('T')[0]
        : null
      const isNewDay = resetDate !== today
      const used = isNewDay ? 0 : (contractor.daily_leads_used ?? 0)

      const { data: tierConfig } = await supabase
        .from('subscription_tiers')
        .select('slug, daily_lead_cap')
      const cap = resolveDailyCap(tierConfig, contractor.subscription_tier)

      if (used >= cap) {
        return NextResponse.json(
          {
            error: 'Daily lead limit reached for your plan',
            daily_leads_used: used,
            daily_lead_cap: cap
          },
          { status: 429 }
        )
      }

      // Spend the lead first, guarded on the counter we read. If a concurrent
      // accept moved it, the guarded update matches no row and we refuse
      // rather than let two requests share one slot.
      const { data: spent } = await supabase
        .from('contractor_profiles')
        .update({ daily_leads_used: used + 1, daily_leads_reset_at: today })
        .eq('id', contractor.id)
        .eq('daily_leads_used', contractor.daily_leads_used ?? 0)
        .select('daily_leads_used, daily_leads_reset_at')
        .maybeSingle()

      if (!spent) {
        return NextResponse.json(
          { error: 'Lead count changed while accepting — try again' },
          { status: 409 }
        )
      }

      const now = new Date().toISOString()
      const isMatched = match.homeowner_swiped_at != null

      await supabase.from('matches').update({
        contractor_swiped_at: now,
        status: isMatched ? 'matched' : 'contractor_review',
        matched_at: isMatched ? now : null
      }).eq('id', matchId)

      return NextResponse.json({
        status: isMatched ? 'matched' : 'pending_homeowner',
        daily_leads_used: spent.daily_leads_used,
        daily_lead_cap: cap
      })
    }

    if (action === 'decline') {
      // Declining does not consume a lead.
      await supabase
        .from('matches')
        .update({ status: 'declined' })
        .eq('id', matchId)
        .eq('contractor_id', contractor.id)
      return NextResponse.json({ status: 'declined' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Match action error:', err)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}
