import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Demo Matches API (ADMIN-ONLY)
 * Returns all matches including demo data for founder viewing
 * Requires authenticated admin user
 */

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Not authenticated' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Admin verified — use service-role client to fetch demo data
    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      )
    }

    // Fetch matches including demo data
    const { data: matches, error } = await adminClient
      .from('matches')
      .select(`*, contractor_profiles(*, profiles(zip_code))`)
      .eq('project_id', projectId)
      .order('match_score', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      matches,
      demo_mode: true,
      message: 'Viewing demo matches (admin-only endpoint)'
    })
  } catch (err) {
    console.error('Demo matches error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch demo matches' },
      { status: 500 }
    )
  }
}
