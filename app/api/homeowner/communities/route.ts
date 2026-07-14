import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserCommunities } from '@/lib/communities'

// GET /api/homeowner/communities
// Get all communities the logged-in homeowner is a member of
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's primary ZIP code from their first project
    const { data: firstProject } = await supabase
      .from('projects')
      .select('zip_code')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    const communities = await getUserCommunities(user.id, firstProject?.zip_code)

    return NextResponse.json({ communities })
  } catch (err) {
    console.error('Communities GET error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
