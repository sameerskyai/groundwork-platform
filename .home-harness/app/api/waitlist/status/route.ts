import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Referral codes are stored uppercase alphanumeric (see the generator in
// app/api/waitlist/route.ts). Anything longer than 12 chars or outside
// [A-Z0-9] can never match a real code, so it's rejected before the DB.
const CODE_PATTERN = /^[A-Z0-9]{1,12}$/

/**
 * GET /api/waitlist/status?code=<referral_code>
 *
 * Read-only status lookup for the /status page.
 *
 * PII rule (plan Global Constraints): this endpoint returns EXACTLY four
 * fields — firstName (first word of `name` only), position_number,
 * verified_referral_count, founding_500. Never email, full name, phone,
 * ip_address, or any other column.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawCode = searchParams.get('code')

  if (!rawCode || rawCode.trim().length === 0) {
    return Response.json({ error: 'Missing code' }, { status: 400 })
  }

  // Codes are stored uppercase — normalize before validating and looking up.
  const code = rawCode.trim().toUpperCase()

  if (!CODE_PATTERN.test(code)) {
    return Response.json({ error: 'Invalid code' }, { status: 400 })
  }

  // Service role is required to read waitlist rows (RLS), but the select
  // list below is the only data that ever leaves this handler.
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('name, position_number, verified_referral_count, founding_500')
      .eq('referral_code', code)
      .eq('is_demo', false)
      .maybeSingle()

    if (error) {
      console.error('Status lookup error:', error)
      return Response.json({ error: 'Failed to load status' }, { status: 500 })
    }

    if (!data) {
      return Response.json({ error: 'Code not found' }, { status: 404 })
    }

    // First word of `name` only — never the full name.
    const firstName = (data.name ?? '').trim().split(/\s+/)[0] ?? ''

    return Response.json({
      firstName,
      position_number: data.position_number,
      verified_referral_count: data.verified_referral_count ?? 0,
      founding_500: Boolean(data.founding_500)
    })
  } catch (err) {
    console.error('Status lookup error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
