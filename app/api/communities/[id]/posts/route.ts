import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/communities/[id]/posts
// List posts in a community
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch posts with comments count
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles(full_name, avatar_url),
        community_comments(count)
      `)
      .eq('community_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Posts fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json({ posts })
  } catch (err) {
    console.error('Posts GET error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/communities/[id]/posts
// Create a post in a community
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { title, description, photoUrls, projectType, budgetMin, budgetMax } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 })
    }

    // Create post
    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        community_id: id,
        user_id: user.id,
        title,
        description,
        photo_urls: photoUrls || [],
        project_type: projectType,
        budget_min: budgetMin ?? null,
        budget_max: budgetMax ?? null
      })
      .select()
      .single()

    if (error) {
      console.error('Post creation error:', error)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    console.error('Posts POST error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
