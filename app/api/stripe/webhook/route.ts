import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const active = sub.status === 'active' || sub.status === 'trialing'
      const tier = sub.items.data[0]?.price.id === process.env.STRIPE_PAID_PRICE_ID
        ? 'paid_unlimited'
        : 'free'

      await supabase.from('contractor_profiles')
        .update({
          subscription_active: active,
          subscription_tier: tier,
          stripe_subscription_id: sub.id
        })
        .eq('stripe_customer_id', sub.customer as string)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('contractor_profiles')
        .update({ subscription_active: false })
        .eq('stripe_customer_id', sub.customer as string)
      break
    }
  }

  return NextResponse.json({ received: true })
}
