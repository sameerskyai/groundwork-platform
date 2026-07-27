import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { deliverWelcomeEmail, deliverMilestoneEmail } from '@/lib/email/delivery'
import { isMilestone } from '@/lib/email/templates/tiers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

  try {
    const body = await request.json()
    // Per DECISIONS.md 2026-07-23: name + email only. phone/sms_* columns
    // remain in the table (nullable) but are never written to.
    const { name, email, referral_code: referrer_code, utm_source, utm_medium, utm_campaign, utm_content, website } = body

    // Honeypot: real users never see or fill this field (hidden via CSS on the
    // form). Any value here means a bot. Return a fake success so the bot
    // doesn't learn its submission was rejected, but never write to the DB.
    if (typeof website === 'string' && website.trim().length > 0) {
      return Response.json({
        success: true,
        message: "You're on the waitlist!"
      }, { status: 201 })
    }

    // Validation
    if (!name || !email) {
      return Response.json({ error: 'Missing required fields: name, email' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Anti-abuse: Check for duplicate email (dedupe is email-only)
    const { data: existingEmail } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingEmail) {
      return Response.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Anti-abuse: Rate limit by IP (check last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentSignups } = await supabase
      .from('waitlist')
      .select('id')
      .eq('ip_address', ip)
      .gte('created_at', fiveMinutesAgo)

    if (recentSignups && recentSignups.length >= 5) {
      return Response.json({ error: 'Too many signups from this IP. Try again later.' }, { status: 429 })
    }

    // Generate referral code (short hex string)
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Find referrer if referral code provided
    let referrerId = null
    if (referrer_code) {
      const { data: referrer } = await supabase
        .from('waitlist')
        .select('id')
        .eq('referral_code', referrer_code)
        .single()

      if (referrer) {
        referrerId = referrer.id
      }
    }

    // Self-referral check
    if (referrerId) {
      const { data: referrerData } = await supabase
        .from('waitlist')
        .select('email')
        .eq('id', referrerId)
        .single()

      if (referrerData?.email === email.toLowerCase()) {
        return Response.json({ error: 'Cannot refer yourself' }, { status: 400 })
      }
    }

    // Get current count for position number
    const { count: totalCount } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })

    const positionNumber = (totalCount || 0) + 1
    const isFounding500 = positionNumber <= 500

    // Insert into waitlist
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        name: name.trim(),
        email: email.toLowerCase(),
        position_number: positionNumber,
        referral_code: referralCode,
        referrer_id: referrerId,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        ip_address: ip,
        founding_500: isFounding500,
        is_demo: false
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return Response.json({ error: 'Failed to join waitlist' }, { status: 500 })
    }

    // Referral credit: a referral counts as "verified" the moment the
    // referred person completes signup (this request succeeding IS the
    // verification — there's no separate confirmation step in this product).
    // Move the referrer up ~100 spots (floored at 1) and flip milestone
    // tiers at 3/5/10 verified referrals per DECISIONS.md. Done via a
    // single atomic UPDATE in credit_referral() (migration 035) rather than
    // a JS read-then-write, which would race under concurrent referrals
    // for the same referrer and silently lose credits.
    if (referrerId) {
      const { data: credit, error: creditError } = await supabase.rpc('credit_referral', { p_referrer_id: referrerId })
      if (creditError) {
        // The referred person's own signup already succeeded and is the
        // primary outcome of this request -- a failed bonus-credit update
        // for the referrer is logged, not treated as a signup failure.
        console.error('Referral credit failed:', creditError)
      } else {
        // credit_referral() RETURNS TABLE, so PostgREST hands back an array.
        // Reading the count from the RPC's own return value rather than a
        // follow-up SELECT is what keeps the milestone check race-free: the
        // atomic UPDATE decides which caller saw the count land on 3/5/10,
        // so exactly one concurrent referral can trigger a given tier.
        const row = Array.isArray(credit) ? credit[0] : credit
        const newCount = row?.new_verified_referral_count
        if (typeof newCount === 'number' && isMilestone(newCount)) {
          // Same rule as the credit above: the referrer's congratulations
          // email is not this request's job to guarantee. Awaited so it is
          // not a dangling promise the serverless runtime can kill mid-send,
          // but its failure is recorded, never propagated.
          await deliverMilestoneEmail(supabase, referrerId, newCount).catch(err => {
            console.error('Milestone email failed:', err)
          })
        }
      }
    }

    // Welcome email. The signup is already committed and the response below
    // is already determined -- this send cannot fail it. A provider outage,
    // a missing API key, or an unverified sending domain records
    // welcome_email_status = 'failed' with a reason on the row (migration
    // 040) and the person still gets their position number. This is the
    // whole reason delivery status is stored: the modal has been saying
    // "check your email" and nobody could tell whether that was true.
    await deliverWelcomeEmail(supabase, {
      id: data.id,
      name: data.name,
      email: data.email,
      position_number: data.position_number,
      referral_code: data.referral_code,
      founding_500: data.founding_500
    }).catch(err => {
      console.error('Welcome email failed:', err)
    })

    return Response.json({
      success: true,
      userId: data.id,
      referralCode: data.referral_code,
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/waitlist?ref=${data.referral_code}`,
      position_number: data.position_number,
      message: `You're #${data.position_number} on the waitlist!`
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
