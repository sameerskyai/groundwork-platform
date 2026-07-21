import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  // Anon key deliberately used — get_waitlist_leaderboard() only ever
  // returns first-name + last-initial + referral count, never raw PII.
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase.rpc('get_waitlist_leaderboard', { limit_count: 25 })

  if (error) {
    console.error('Waitlist leaderboard error:', error)
    return Response.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }

  return Response.json({ leaderboard: data ?? [] })
}
