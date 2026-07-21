import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  // Anon key deliberately used here — this route only ever returns the
  // aggregate stats exposed by get_waitlist_public_stats(), never raw rows.
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase.rpc('get_waitlist_public_stats').single()

  if (error) {
    console.error('Waitlist stats error:', error)
    return Response.json({ error: 'Failed to load stats' }, { status: 500 })
  }

  const stats = data as { total_signups: number; founding_500_count: number; spots_remaining: number }

  return Response.json({
    total_signups: stats.total_signups,
    founding_500_count: stats.founding_500_count,
    spots_remaining: stats.spots_remaining
  })
}
