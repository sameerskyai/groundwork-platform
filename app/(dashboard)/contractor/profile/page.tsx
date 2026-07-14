'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/logo'
import { loadStripe } from '@stripe/stripe-js'
import { Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: cp } = await supabase.from('contractor_profiles').select('*').eq('user_id', user.id).single()
      setProfile(cp)
      setLoading(false)
    }
    load()
  }, [router])

  async function saveProfile() {
    if (!profile) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('contractor_profiles').update({
      business_name: profile.business_name,
      license_number: profile.license_number,
      insured: profile.insured,
      bonded: profile.bonded,
      years_in_business: profile.years_in_business,
      service_radius_miles: profile.service_radius_miles
    }).eq('user_id', user.id)

    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  async function subscribe(tier: 'free' | 'paid_unlimited') {
    setSubscribing(true)
    const res = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'contractor_subscription', tier })
    })
    const data = await res.json()
    const stripe = await stripePromise
    if (!stripe || !data.clientSecret) { setSubscribing(false); return }
    await stripe.confirmPayment({
      clientSecret: data.clientSecret,
      confirmParams: { return_url: `${window.location.origin}/contractor` }
    })
    setSubscribing(false)
  }

  if (loading || !profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F0E8' }}>
      <span style={{ color: '#7A756E' }}>Loading...</span>
    </div>
  )

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF7A3A]"
  const inputStyle = (editable: boolean) => ({
    background: editable ? '#FAFAF7' : '#F4F0E8',
    border: '1px solid #DDD8CE',
    color: '#0A0908',
    opacity: editable ? 1 : 0.7
  })

  return (
    <div className="min-h-screen" style={{ background: '#F4F0E8' }}>
      <header style={{ background: '#0A0908', borderBottom: '1px solid #1A1713' }} className="px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/contractor" style={{ color: '#7A756E' }} className="hover:opacity-70">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Wordmark size="sm" />
          {saved && <span className="text-sm font-medium ml-auto" style={{ color: '#BF7A3A' }}>Saved</span>}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-5">

        {/* Business info */}
        <div className="rounded-2xl p-6" style={{ background: '#FAFAF7', border: '1px solid #DDD8CE' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold" style={{ color: '#0A0908' }}>Business info</h2>
            {!editing
              ? <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
              : <Button variant="primary" size="sm" onClick={saveProfile}>Save</Button>
            }
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#7A756E' }}>Business name</label>
              <input type="text" disabled={!editing}
                value={profile.business_name ?? ''}
                onChange={e => setProfile({ ...profile, business_name: e.target.value })}
                className={inputClass} style={inputStyle(editing)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                  <div key={t.tier} className="rounded-xl p-5"
                    style={{ background: t.dark ? '#0A0908' : '#F4F0E8', border: t.dark ? 'none' : '1px solid #DDD8CE' }}>
                    <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#BF7A3A' }}>
                      {t.tier}
                    </div>
                    <div className="text-3xl font-bold mb-0.5" style={{ color: t.dark ? '#EDE8DF' : '#0A0908' }}>{t.price}</div>
                    <div className="text-xs mb-4 font-medium" style={{ color: '#BF7A3A' }}>{t.cap}</div>
                    {t.features.map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs mb-1.5"
                        style={{ color: t.dark ? '#C4BDB3' : '#2A2825' }}>
                        <Check className="w-3.5 h-3.5" style={{ color: '#BF7A3A' }} /> {f}
                      </div>
                    ))}
                    <Button variant={t.dark ? 'primary' : 'secondary'} size="sm" className="w-full mt-4"
                      onClick={() => subscribe(t.tier)} disabled={subscribing}>
                      {subscribing ? 'Processing...' : `Choose ${t.tier}`}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
