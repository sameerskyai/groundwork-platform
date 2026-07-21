import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

  try {
    const body = await request.json()
    const { name, email, phone, sms_consent, referral_code: referrer_code, utm_source, utm_medium, utm_campaign, utm_content, website } = body

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
    if (!name || !email || typeof sms_consent !== 'boolean') {
      return Response.json({ error: 'Missing required fields: name, email, sms_consent' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Normalize phone to digits-only so "(555) 123-4567" and "5551234567"
    // are recognized as the same number for dedupe. Stored normalized too.
    const normalizedPhone: string | null = phone ? String(phone).replace(/\D/g, '') : null
    if (normalizedPhone && (normalizedPhone.length < 10 || normalizedPhone.length > 15)) {
      return Response.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // Anti-abuse: Check for duplicate email
    const { data: existingEmail } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingEmail) {
      return Response.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Anti-abuse: Check for duplicate phone (if provided)
    if (normalizedPhone) {
      const { data: existingPhone } = await supabase
        .from('waitlist')
        .select('id')
        .eq('phone', normalizedPhone)
        .single()

      if (existingPhone) {
        return Response.json({ error: 'Phone already registered' }, { status: 409 })
      }
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
        phone: normalizedPhone,
        sms_consent,
        sms_consent_language: sms_consent ? 'I agree to receive SMS and email updates from Groundwork. Message and data rates may apply. See Privacy Policy.' : null,
        sms_consent_timestamp: sms_consent ? new Date().toISOString() : null,
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
    // tiers at 3/5/10 verified referrals per DECISIONS.md.
    if (referrerId) {
      const { data: referrer } = await supabase
        .from('waitlist')
        .select('position_number, verified_referral_count')
        .eq('id', referrerId)
        .single()

      if (referrer) {
        const newCount = referrer.verified_referral_count + 1
        const newPosition = Math.max(1, referrer.position_number - 100)

        await supabase
          .from('waitlist')
          .update({
            verified_referral_count: newCount,
            position_number: newPosition,
            founding_member: newCount >= 3,
            backstory_eligible: newCount >= 5,
            homeowner_plus_eligible: newCount >= 10,
            updated_at: new Date().toISOString()
          })
          .eq('id', referrerId)
      }
    }

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
