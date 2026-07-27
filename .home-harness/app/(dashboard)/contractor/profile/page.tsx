'use client'

/**
 * Contractor profile + subscription.
 *
 * Was the single worst tokenisation offender in the authenticated app: 27 lines
 * of hardcoded hex from the retired Warm Copper palette. Every value now
 * comes from the eleven tokens.
 *
 * The dark plan card is the only dark surface here, so it follows the hazard
 * rule in design-tokens.css: on --color-ink, accent text uses
 * --color-accent-on-dark (5.27:1), never raw --color-accent (2.56:1, FAIL), and
 * never --color-muted or --color-ink-2.
 *
 * It also used to hang on "Loading..." forever for anyone without a contractor
 * profile, because `!profile` and `loading` shared one branch. Those are now
 * separate states and the no-profile case says what to do next.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { loadStripe } from '@stripe/stripe-js'
import { Check, HardHat } from 'lucide-react'
import { Notice, EmptyState, Loading, PageHeader } from '../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../_lib/errors'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface ContractorProfile {
  id: string
  business_name: string
  bio: string
  subscription_tier: string
  subscription_active: boolean
  license_number: string
  insured: boolean
  bonded: boolean
  years_in_business: number
  service_radius_miles: number
}

export default function ContractorProfilePage() {
  const [profile, setProfile] = useState<ContractorProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<FriendlyError | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const { data: cp, error: cpError } = await supabase
          .from('contractor_profiles').select('*').eq('user_id', user.id).maybeSingle()
        if (cpError) throw cpError
        setProfile(cp)
      } catch (err) {
        setError(
          friendlyError(err, {
            title: 'We could not load your profile',
            detail: 'Nothing has been changed. Reload the page to try again.'
          })
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function saveProfile() {
    if (!profile) return
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: updError } = await supabase.from('contractor_profiles').update({
        business_name: profile.business_name,
        license_number: profile.license_number,
        insured: profile.insured,
        bonded: profile.bonded,
        years_in_business: profile.years_in_business,
        service_radius_miles: profile.service_radius_miles
      }).eq('user_id', user.id)

      if (updError) throw updError

      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'Your changes did not save',
          detail: 'They are still on screen exactly as you typed them. Press Save again in a moment.'
        })
      )
    }
  }

  async function subscribe(tier: 'free' | 'paid_unlimited') {
    setSubscribing(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contractor_subscription', tier })
      })
      const data = await res.json()
      const stripe = await stripePromise
      if (!res.ok || !stripe || !data.clientSecret) {
        setError({
          title: 'We could not start checkout',
          detail: 'You have not been charged and your plan is unchanged. Try again in a minute.'
        })
        return
      }
      await stripe.confirmPayment({
        clientSecret: data.clientSecret,
        confirmParams: { return_url: `${window.location.origin}/contractor` }
      })
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not start checkout',
          detail: 'You have not been charged. Check your connection and try again.'
        })
      )
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) return <Loading what="Loading your profile" />

  const panel = {
    background: 'var(--color-base)',
    border: '1px solid var(--color-line)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--space-3)'
  } as const

  if (!profile) {
    return (
      <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
        <PageHeader back={{ href: '/contractor', label: 'Dashboard' }} title="Your profile" />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>
          {error && <div style={{ marginBottom: 'var(--space-3)' }}><Notice error={error} /></div>}
          <EmptyState
            glyph={<HardHat style={{ width: 22, height: 22 }} />}
            title="No contractor profile on this account"
            why="This page edits a contractor business — licence, radius, plan. Your account has not been set up as one yet, which is why there is nothing to edit."
            action={{ label: 'Set up your contractor profile', href: '/onboarding/contractor' }}
            secondary={{ label: 'Back to dashboard', href: '/contractor' }}
          />
        </div>
      </div>
    )
  }

  const labelStyle = {
    display: 'block',
    marginBottom: 6
  } as const

  const inputStyle = (editable: boolean) => ({
    width: '100%',
    minHeight: 44,
    padding: '0 var(--space-2)',
    fontSize: '16px',
    fontFamily: 'var(--font-display)',
    color: 'var(--color-ink)',
    background: editable ? 'var(--color-base)' : 'var(--color-base-alt)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-control)',
    opacity: editable ? 1 : 0.75
  })

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <PageHeader
        back={{ href: '/contractor', label: 'Dashboard' }}
        title="Your profile"
        trailing={
          saved ? (
            <span className="annotation" style={{ color: 'var(--color-verified)' }}>
              ✓ Saved
            </span>
          ) : null
        }
      />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {error && <Notice error={error} />}

        {/* Business info */}
        <section style={panel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <h2 className="annotation" style={{ margin: 0 }}>Business info</h2>
            {!editing
              ? <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
              : <Button variant="primary" size="sm" onClick={saveProfile}>Save</Button>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div>
              <label htmlFor="business_name" className="annotation" style={labelStyle}>Business name</label>
              <input
                id="business_name" type="text" disabled={!editing}
                value={profile.business_name ?? ''}
                onChange={e => setProfile({ ...profile, business_name: e.target.value })}
                style={inputStyle(editing)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              {[
                { label: 'Years in business', field: 'years_in_business' as const },
                { label: 'Service radius (mi)', field: 'service_radius_miles' as const }
              ].map(f => (
                <div key={f.field}>
                  <label htmlFor={f.field} className="annotation" style={labelStyle}>{f.label}</label>
                  <input
                    id={f.field} type="number" disabled={!editing}
                    value={profile[f.field] ?? ''}
                    onChange={e => setProfile({ ...profile, [f.field]: parseInt(e.target.value) })}
                    style={inputStyle(editing)}
                  />
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="license_number" className="annotation" style={labelStyle}>Licence number</label>
              <input
                id="license_number" type="text" disabled={!editing} placeholder="Optional"
                value={profile.license_number ?? ''}
                onChange={e => setProfile({ ...profile, license_number: e.target.value })}
                style={inputStyle(editing)}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              {(['insured', 'bonded'] as const).map(field => (
                <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: editing ? 'pointer' : 'default' }}>
                  <input
                    type="checkbox" disabled={!editing}
                    checked={profile[field] ?? false}
                    onChange={e => setProfile({ ...profile, [field]: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }}
                  />
                  <span style={{ fontSize: 'var(--type-3)', color: 'var(--color-ink)', textTransform: 'capitalize' }}>{field}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section id="subscription" style={panel}>
          <h2 className="annotation" style={{ marginBottom: 'var(--space-2)' }}>Subscription</h2>

          {profile.subscription_active ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-verified)' }}>
              <Check style={{ width: 18, height: 18 }} aria-hidden="true" />
              <span style={{ fontSize: 'var(--type-3)', fontWeight: 600, textTransform: 'capitalize' }}>
                {profile.subscription_tier} plan active
              </span>
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--type-3)', color: 'var(--color-ink-2)' }}>
                Pick a plan to start receiving job requests.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
                {[
                  {
                    tier: 'free' as const,
                    price: 'Free',
                    cap: '1 lead/week (~5/month)',
                    features: ['Public profile', 'Basic dashboard', 'View inquiries'],
                    dark: false
                  },
                  {
                    tier: 'paid_unlimited' as const,
                    price: '$49/mo',
                    cap: 'Unlimited leads',
                    features: ['Priority placement', 'Featured badge', 'Advanced analytics'],
                    dark: true
                  }
                ].map(t => (
                  <div
                    key={t.tier}
                    style={{
                      borderRadius: 'var(--radius-card)',
                      padding: 'var(--space-3)',
                      background: t.dark ? 'var(--color-ink)' : 'var(--color-base-alt)',
                      border: `1px solid ${t.dark ? 'var(--color-ink)' : 'var(--color-line)'}`
                    }}
                  >
                    {/* On the dark card, accent-on-dark is the ONLY legal accent. */}
                    <div
                      className="annotation"
                      style={{ color: t.dark ? 'var(--color-accent-on-dark)' : 'var(--color-accent)', marginBottom: 'var(--space-1)' }}
                    >
                      {t.tier.replace('_', ' ')}
                    </div>
                    <div
                      className="tabular"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--type-5)',
                        fontWeight: 600,
                        color: t.dark ? 'var(--color-base)' : 'var(--color-ink)'
                      }}
                    >
                      {t.price}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--type-2)',
                        marginBottom: 'var(--space-2)',
                        color: t.dark ? 'var(--color-accent-on-dark)' : 'var(--color-ink-2)'
                      }}
                    >
                      {t.cap}
                    </div>
                    {t.features.map(f => (
                      <div
                        key={f}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 'var(--type-2)',
                          marginBottom: 6,
                          color: t.dark ? 'var(--color-base)' : 'var(--color-ink-2)'
                        }}
                      >
                        <Check
                          style={{ width: 13, height: 13, color: t.dark ? 'var(--color-accent-on-dark)' : 'var(--color-accent)' }}
                          aria-hidden="true"
                        />
                        {f}
                      </div>
                    ))}
                    <Button
                      variant={t.dark ? 'primary' : 'secondary'} size="sm" className="w-full mt-4"
                      onClick={() => subscribe(t.tier)} disabled={subscribing}
                    >
                      {subscribing ? 'Processing…' : t.tier === 'free' ? 'Stay on Free' : 'Upgrade'}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
