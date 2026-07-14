import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/communities?zip=60302
// List communities for a ZIP code
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const zip = searchParams.get('zip')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!zip) {
      return NextResponse.json({ error: 'ZIP code required' }, { status: 400 })
    }

    // Get communities in this ZIP that the user is a member of
    const { data: communities, error } = await supabase
      .from('communities')
      .select(`
        *,
        community_members(count),
        community_posts(count)
      `)
      .eq('zip_code', zip)
      .or(
        `creator_id.eq.${user.id},community_members.user_id.eq.${user.id}`,
        { referencedTable: 'community_members' }
      )

    if (error) {
      console.error('Communities fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 })
    }

    return NextResponse.json({ communities })
  } catch (err) {
    console.error('Communities GET error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/communities
// Create a new community
export async function POST(req: NextRequest) {
  try {
    const { name, description, zipCode, type } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!name || !zipCode) {
      return NextResponse.json({ error: 'name and zipCode required' }, { status: 400 })
    }

    // Create community
    const { data: community, error: createError } = await supabase
      .from('communities')
      .insert({
        creator_id: user.id,
        name,
        description,
        zip_code: zipCode,
        type: type || 'homeowner',
        published: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Community creation error:', createError)
      return NextResponse.json({ error: 'Failed to create community' }, { status: 500 })
    }

    // Add creator as member
    await supabase
      .from('community_members')
      .insert({
        community_id: community.id,
        user_id: user.id,
        role: 'owner'
      })

    return NextResponse.json({ community }, { status: 201 })
  } catch (err) {
    console.error('Communities POST error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
