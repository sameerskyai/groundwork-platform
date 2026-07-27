'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'

export default function ContractorOnboardingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('')
  const [step, setStep] = useState(0)
  const [businessName, setBusinessName] = useState('')
  const [yearsInBusiness, setYearsInBusiness] = useState('')
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get existing profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('zip_code')
        .eq('id', user.id)
        .single()

      setUserId(user.id)
      if (profile?.zip_code) {
        setZip(profile.zip_code)
      }
    }
    load()
  }, [router])

  const handleBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName || !yearsInBusiness || !zip) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Create contractor profile
      const { data: existingContractor } = await supabase
        .from('contractor_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!existingContractor) {
        const { data: contractor, error: contractorError } = await supabase
          .from('contractor_profiles')
          .insert({
            user_id: userId,
            business_name: businessName,
            years_in_business: parseInt(yearsInBusiness)
          })
          .select()
          .single()

        if (contractorError) throw contractorError
      }

      // Update profile
      await supabase.from('profiles').update({
        zip_code: zip,
        onboarding_complete: true
      }).eq('id', userId)

      router.push('/contractor')
    } catch (err: any) {
      setError(err.message || 'Failed to save contractor info')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8">
          <div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
              Welcome, contractor
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Tell us about your business so homeowners can find you
            </p>
          </div>

          <form onSubmit={handleBusinessInfo} className="flex flex-col gap-4">
            <Input
              label="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Smith Plumbing"
              required
            />

            <Input
              label="Years in business"
              type="number"
              value={yearsInBusiness}
              onChange={(e) => setYearsInBusiness(e.target.value)}
              placeholder="5"
              min="0"
              required
            />

            <Input
              label="ZIP code"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="20155"
              maxLength={5}
              pattern="[0-9]{5}"
              required
            />

            {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{error}</p>}

            <Button type="submit" disabled={loading} className="w-full mt-4">
              {loading ? 'Saving...' : 'Get started'}
            </Button>
          </form>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
            You can update your profile anytime
          </p>
        </div>
      </div>
    </div>
  )
}
