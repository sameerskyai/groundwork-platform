import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const ALLOWED = ['Kitchen', 'Bathroom', 'Roof', 'HVAC', 'Addition', 'Something else']

/**
 * Stores the one optional post-signup question for email segmentation.
 * Identified by referral_code, which the client already holds from its own
 * signup response -- no email in the request body, no PII in transit.
 * Never blocks the signup: the client fires this and ignores the result.
 */
export async function POST(request: Request) {
  try {
    const { referralCode, project } = await request.json()

    if (typeof referralCode !== 'string' || !/^[A-Z0-9]{1,12}$/.test(referralCode)) {
      return Response.json({ error: 'Invalid code' }, { status: 400 })
    }
    if (!ALLOWED.includes(project)) {
      return Response.json({ error: 'Unrecognized project' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { error } = await supabase
      .from('waitlist')
      .update({ project_interest: project })
      .eq('referral_code', referralCode)

    if (error) {
      // Column may not exist until migration 043 is applied. This answer is
      // optional metadata, never worth surfacing an error to the user over.
      console.error('project_interest update failed:', error.message)
      return Response.json({ ok: false }, { status: 200 })
    }
    return Response.json({ ok: true }, { status: 200 })
  } catch {
    return Response.json({ ok: false }, { status: 200 })
  }
}
