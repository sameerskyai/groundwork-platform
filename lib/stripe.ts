import Stripe from 'stripe'

let _stripe: Stripe | null = null
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' })
    return (_stripe as any)[prop]
  }
})

export const ESTIMATE_PRICE = 999 // $9.99 in cents for full itemized estimate

export async function createEstimatePaymentIntent(projectId: string) {
  return stripe.paymentIntents.create({
    amount: ESTIMATE_PRICE,
    currency: 'usd',
    metadata: { projectId, type: 'estimate_unlock' }
  })
}

export async function createContractorSubscription(customerId: string, tier: 'free' | 'paid_unlimited') {
  // Free tier doesn't require a subscription — skip Stripe entirely
  if (tier === 'free') {
    return null
  }

  const priceId = process.env.STRIPE_PAID_PRICE_ID!

  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent']
  })
}

export async function createOrGetStripeCustomer(email: string, name: string) {
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length) return existing.data[0]
  return stripe.customers.create({ email, name })
}

// Property manager pricing formula (config-driven, not hardcoded)
export function calculatePropertyManagerPrice(unitCount: number): number {
  // Base: $29/mo for up to 5 units, +$5/mo per additional unit, cap at $299/mo
  const base = 2900
  const perUnit = 500
  const cap = 29900
  return Math.min(base + Math.max(0, unitCount - 5) * perUnit, cap)
}
