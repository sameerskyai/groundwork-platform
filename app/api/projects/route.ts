import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { zipToLatLng } from '@/lib/geo'

// POST /api/projects — create a new homeowner project
// Body: { description, zipCode, trade_slug?, budget_low?, budget_high?, photo_urls? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { description, zipCode, trade_slug, budget_low, budget_high, photo_urls } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!description || !zipCode || !/^\d{5}$/.test(String(zipCode))) {
      return NextResponse.json({ error: 'description and a valid 5-digit zipCode are required' }, { status: 400 })
    }

    // Resolve trade slug -> trade_id (optional)
    let trade_id: string | null = null
    if (trade_slug) {
      const { data: trade } = await supabase
        .from('trades')
        .select('id')
        .eq('slug', trade_slug)
        .single()
      trade_id = trade?.id ?? null
    }

    // Geocode ZIP for distance-based matching
    const coords = await zipToLatLng(String(zipCode))

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        description,
        zip_code: String(zipCode),
        trade_id,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        budget_min: budget_low ?? null,
        budget_max: budget_high ?? null,
        photo_urls: photo_urls ?? null,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Project create error:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (err) {
    console.error('Projects POST error:', err)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

// GET /api/projects — list the authed user's projects with estimate + match count
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: projects } = await supabase
      .from('projects')
      .select('*, estimates(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!projects?.length) return NextResponse.json({ projects: [] })

    // Match counts per project (matched status only)
    const ids = projects.map(p => p.id)
    const { data: matchRows } = await supabase
      .from('matches')
      .select('project_id')
      .in('project_id', ids)
      .eq('status', 'matched')

    const countMap: Record<string, number> = {}
    matchRows?.forEach(m => { countMap[m.project_id] = (countMap[m.project_id] ?? 0) + 1 })

    const enriched = projects.map(p => ({
      ...p,
      // supabase returns estimates as an array for the embedded relation
      estimate: Array.isArray(p.estimates) ? (p.estimates[0] ?? null) : (p.estimates ?? null),
      match_count: countMap[p.id] ?? 0
    }))

    return NextResponse.json({ projects: enriched })
  } catch (err) {
    console.error('Projects GET error:', err)
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 })
  }
}
