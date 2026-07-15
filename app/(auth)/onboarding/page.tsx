'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Home, HardHat, Building2, Briefcase } from 'lucide-react'

type UserSegment = 'homeowner' | 'contractor' | 'property_manager' | 'agent'
type OnboardingStep = 'segment' | 'zip' | 'preference' | 'early_access'

const SEGMENT_OPTIONS = [
  {
    id: 'homeowner' as UserSegment,
    label: "I'm a homeowner",
    icon: Home,
    description: 'Looking to renovate or repair my home'
  },
  {
    id: 'contractor' as UserSegment,
    label: "I'm a contractor",
    icon: HardHat,
    description: 'I offer home services and want to find work'
  },
  {
    id: 'property_manager' as UserSegment,
    label: 'I manage properties',
    icon: Building2,
    description: 'I oversee residential properties for owners'
  },
  {
    id: 'agent' as UserSegment,
    label: "I'm a real estate agent",
    icon: Briefcase,
    description: 'I buy and sell homes'
  }
]

const PREF_OPTIONS = [
  { id: 'estimate', label: 'Get a free AI estimate', description: 'Describe your project and get an instant estimate' },
  { id: 'match', label: 'Find my contractor match', description: 'See vetted contractors available in my area' }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('')
  const [step, setStep] = useState<OnboardingStep>('segment')
  const [segment, setSegment] = useState<UserSegment | null>(null)
  const [zip, setZip] = useState('')
  const [preference, setPreference] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<OnboardingStep[]>(['segment'])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
    }
    load()
  }, [router])

  const handleSegmentSelect = async (selectedSegment: UserSegment) => {
    setSegment(selectedSegment)
    setError('')

    if (selectedSegment === 'homeowner') {
      // Homeowners: move to ZIP
      setHistory(prev => [...prev, 'zip'])
      setStep('zip')
    } else if (selectedSegment === 'contractor') {
      // Contractors: go to contractor onboarding
      try {
        const supabase = createClient()
        await supabase.from('profiles').update({
          user_segment: 'contractor',
          onboarding_complete: false
        }).eq('id', userId)
        router.push('/onboarding/contractor')
      } catch (err) {
        setError('Failed to proceed. Try again.')
      }
    } else {
      // PM or Agent: show early-access state
      try {
        const supabase = createClient()
        const segmentMetadata = selectedSegment === 'property_manager'
          ? { door_count: null }
          : { agent_type: null }

        await supabase.from('profiles').update({
          user_segment: selectedSegment,
          segment_metadata: segmentMetadata,
          onboarding_complete: true
        }).eq('id', userId)

        setHistory(prev => [...prev, 'early_access'])
        setStep('early_access')
      } catch (err) {
        setError('Failed to save. Try again.')
      }
    }
  }

  const handleZipSubmit = async () => {
    if (!zip || !/^\d{5}$/.test(zip)) {
      setError('Please enter a valid 5-digit ZIP code')
      return
    }
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      // Save ZIP to profile, never ask again
      await supabase.from('profiles').update({
        zip_code: zip,
        user_segment: 'homeowner'
      }).eq('id', userId)

      // Create default property for this ZIP
      await supabase.from('properties').insert({
        owner_id: userId,
        zip_code: zip,
        label: 'Home',
        is_demo: false
      })

      setHistory(prev => [...prev, 'preference'])
      setStep('preference')
    } catch (err: any) {
      setError(err.message || 'Failed to save ZIP code')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceSelect = async (pref: string) => {
    setPreference(pref)
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      await supabase.from('profiles').update({
        onboarding_complete: true
      }).eq('id', userId)

      // Route based on preference
      if (pref === 'estimate') {
        router.push('/homeowner/estimate')
      } else {
        router.push('/homeowner/matches')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to proceed')
      setLoading(false)
    }
  }

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      const prevStep = newHistory[newHistory.length - 1]
      setHistory(newHistory)
      setStep(prevStep)

      // Reset state for previous step
      if (prevStep === 'segment') {
        setSegment(null)
        setZip('')
        setPreference(null)
      } else if (prevStep === 'zip') {
        setPreference(null)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <div className="w-full max-w-md">
        {/* Back button (only show if not first step) */}
        {history.length > 1 && (
          <button
            onClick={goBack}
            className="mb-8 flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* STEP 1: SEGMENT SELECTION */}
        {step === 'segment' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                What brings you to Groundwork?
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                We'll customize your experience based on what you do
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {SEGMENT_OPTIONS.map(opt => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSegmentSelect(opt.id)}
                    className="p-4 rounded-lg border-2 transition-all duration-200 text-left hover:border-[color:var(--color-brand)]"
                    style={{
                      borderColor: segment === opt.id ? 'var(--color-brand)' : 'var(--color-border)',
                      backgroundColor: segment === opt.id ? 'var(--color-brand-lighter)' : 'var(--color-surface-secondary)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: segment === opt.id ? 'var(--color-brand)' : 'var(--color-text-secondary)' }} />
                      <div>
                        <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                          {opt.description}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{error}</p>}

            <Button
              onClick={() => segment && handleSegmentSelect(segment)}
              disabled={!segment || loading}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {/* STEP 2: ZIP CODE */}
        {step === 'zip' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                What's your ZIP code?
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                We'll use this to find contractors near you and remember it everywhere
              </p>
            </div>

            <div>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="20155"
                maxLength={5}
                className="w-full px-4 py-3 text-lg text-center rounded-lg border-2 border-[color:var(--color-border)]"
                style={{
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  fontFamily: 'monospace'
                }}
                onKeyDown={(e) => e.key === 'Enter' && zip && handleZipSubmit()}
              />
              {zip && !/^\d{5}$/.test(zip) && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', marginTop: 'var(--space-sm)' }}>
                  Enter a 5-digit ZIP code
                </p>
              )}
            </div>

            {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{error}</p>}

            <Button
              onClick={handleZipSubmit}
              disabled={!zip || !/^\d{5}$/.test(zip) || loading}
              className="w-full"
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        )}

        {/* STEP 3: PREFERENCE (Estimate or Match) */}
        {step === 'preference' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                What would you like to do first?
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                Both are always available — just tell us where to start
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {PREF_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handlePreferenceSelect(opt.id)}
                  disabled={loading}
                  className="p-6 rounded-lg border-2 transition-all duration-200 text-left hover:border-[color:var(--color-brand)] disabled:opacity-50"
                  style={{
                    borderColor: preference === opt.id ? 'var(--color-brand)' : 'var(--color-border)',
                    backgroundColor: preference === opt.id ? 'var(--color-brand-lighter)' : 'var(--color-surface-secondary)'
                  }}
                >
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {opt.description}
                  </div>
                </button>
              ))}
            </div>

            {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{error}</p>}
          </div>
        )}

        {/* STEP 4: EARLY ACCESS (for PM/Agent) */}
        {step === 'early_access' && (
          <div className="flex flex-col gap-8 text-center">
            <div>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>🚀</div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                You're on the list
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                We're starting with homeowners and contractors. You're our first call when we launch for {segment === 'property_manager' ? 'property managers' : 'real estate professionals'}.
              </p>
            </div>

            <Button onClick={() => router.push('/homeowner')} className="w-full">
              Explore the marketplace
            </Button>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              We'll email you the moment your features are ready.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
