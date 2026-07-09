import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/waitlist — contractor pre-launch waitlist signup
// Body: { businessName, trade, zipCode, email, phone? }
// Duplicate emails update the existing row rather than erroring,
// so re-submitting is always safe for the prospect.
export async function POST(req: NextRequest) {
  try {
    const { businessName, trade, zipCode, email, phone } = await req.json()

    if (!businessName?.trim() || !trade?.trim()) {
      return NextResponse.json({ error: 'Business name and trade are required' }, { status: 400 })
    }
    if (!zipCode || !/^\d{5}$/.test(String(zipCode))) {
      return NextResponse.json({ error: 'A valid 5-digit ZIP code is required' }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('contractor_waitlist')
      .upsert(
        {
          business_name: String(businessName).trim(),
          trade: String(trade).trim(),
          zip_code: String(zipCode),
          email: String(email).trim().toLowerCase(),
          phone: phone ? String(phone).trim() : null
        },
        { onConflict: 'email' }
      )

    if (error) {
      console.error('Waitlist insert error:', error)
      return NextResponse.json({ error: 'Could not join the waitlist right now — try again shortly' }, { status: 500 })
    }

    return NextResponse.json({ joined: true }, { status: 201 })
  } catch (err) {
    console.error('Waitlist POST error:', err)
    return NextResponse.json({ error: 'Could not join the waitlist right now — try again shortly' }, { status: 500 })
  }
}
