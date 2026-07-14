import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/homeowner/preferences
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: prefs } = await supabase
      .from('homeowner_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({ preferences: prefs || null })
  } catch (err) {
    console.error('Preferences GET error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/homeowner/preferences
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      preferred_budget,
      preferred_timeline,
      preferred_style,
      experience_level_preference
    } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Upsert preferences
    const { data: prefs, error } = await supabase
      .from('homeowner_preferences')
      .upsert({
        user_id: user.id,
        preferred_budget: preferred_budget ?? null,
        preferred_timeline: preferred_timeline ?? null,
        preferred_style: preferred_style ?? null,
        experience_level_preference: experience_level_preference ?? null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Preferences save error:', error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: prefs })
  } catch (err) {
    console.error('Preferences POST error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
