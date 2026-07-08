import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { haversineDistanceMiles } from '@/lib/geo'

// GET /api/projects/:id/candidates — top 10 contractor candidates for a project
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
      .select('id, user_id, trade_id, lat, lng')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // 3c. Contractors already swiped on by the homeowner for this project
    const { data: priorSwipes } = await supabase
      .from('swipes')
      .select('contractor_id')
      .eq('project_id', id)
      .eq('swiped_by', 'homeowner')
    const swipedIds = new Set((priorSwipes ?? []).map(s => s.contractor_id))

    // 2. Active contractors with location + trades
    const { data: contractors } = await supabase
      .from('contractor_profiles')
      .select(`
        id, business_name, bio, rating, review_count, years_in_business,
        trust_score, verified_job_count, subscription_tier, service_radius_miles,
        profiles(zip_code, lat, lng),
        contractor_trades(trade_id)
      `)
      .eq('subscription_active', true)
      .eq('active', true)

    if (!contractors?.length) return NextResponse.json({ candidates: [] })

    // 3. Filter: trade match + within radius + not already swiped
    const filtered = contractors
      .filter(c => !swipedIds.has(c.id))
      .map(c => {
        const prof = c.profiles as unknown as { zip_code: string | null; lat: number | null; lng: number | null } | null
        const hasTrade = (c.contractor_trades as { trade_id: string }[] | null)?.some(
          ct => ct.trade_id === project.trade_id
        )
        if (!hasTrade) return null
        if (!prof?.lat || !prof?.lng || project.lat == null || project.lng == null) return null

        const distance = haversineDistanceMiles(project.lat, project.lng, prof.lat, prof.lng)
        if (distance > (c.service_radius_miles ?? 25)) return null

        return {
          id: c.id,
          business_name: c.business_name ?? 'Contractor',
          bio: c.bio ?? '',
          rating: c.rating ?? 0,
          review_count: c.review_count ?? 0,
          years_in_business: c.years_in_business ?? 0,
          trust_score: c.trust_score ?? null,
          verified_job_count: c.verified_job_count ?? 0,
          subscription_tier: c.subscription_tier ?? 'standard',
          distance_miles: Math.round(distance * 10) / 10,
          zip_code: prof.zip_code ?? ''
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)

    // 4. Sort by trust_score desc (nulls last), then rating desc
    filtered.sort((a, b) => {
      const ta = a.trust_score ?? -1
      const tb = b.trust_score ?? -1
      if (tb !== ta) return tb - ta
      return b.rating - a.rating
    })

    // 5. Top 10
    return NextResponse.json({ candidates: filtered.slice(0, 10) })
  } catch (err) {
    console.error('Candidates error:', err)
    return NextResponse.json({ error: 'Failed to load candidates' }, { status: 500 })
  }
}
