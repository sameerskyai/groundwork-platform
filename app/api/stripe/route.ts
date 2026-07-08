import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, createOrGetStripeCustomer, createContractorSubscription, createEstimatePaymentIntent } from '@/lib/stripe'

// Create payment intent for estimate unlock
export async function POST(req: NextRequest) {
  try {
    const { type, projectId, tier } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (type === 'estimate_unlock') {
      const pi = await createEstimatePaymentIntent(projectId)
      return NextResponse.json({ clientSecret: pi.client_secret })
    }

    if (type === 'contractor_subscription') {
      const customer = await createOrGetStripeCustomer(
        profile?.email ?? user.email ?? '',
        profile?.full_name ?? ''
      )

      // Save Stripe customer ID
      await supabase.from('contractor_profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('user_id', user.id)

      const subscription = await createContractorSubscription(customer.id, tier)
      const invoice = subscription.latest_invoice as any
      const pi = invoice?.payment_intent

      return NextResponse.json({
        subscriptionId: subscription.id,
        clientSecret: pi?.client_secret
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('Stripe route error:', err)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
