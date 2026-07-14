import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    // Validation
    if (!email || !name) {
      return Response.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if already on waitlist
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return Response.json(
        { error: 'Email already on waitlist', referralLink: `/waitlist?ref=${existing.id}` },
        { status: 409 }
      )
    }

    // Add to waitlist
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase(),
        name: name.trim(),
        joined_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('Waitlist insert error:', error)
      return Response.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      userId: data.id,
      referralLink: `/waitlist?ref=${data.id}`
    })
  } catch (err) {
    console.error('Waitlist endpoint error:', err)
    return Response.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
