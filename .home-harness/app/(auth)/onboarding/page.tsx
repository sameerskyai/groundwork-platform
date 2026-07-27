'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Home, HardHat, Building2, Briefcase, AlertTriangle } from 'lucide-react'

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

/**
 * Errors are never colour-alone (WCAG 1.4.1): the alert colour is always
 * paired with a glyph AND the word "Problem", so the state survives being
 * read by someone who cannot distinguish the red.
 */
function ErrorLine({ text }: { text: string }) {
  return (
    <p
      role="alert"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        fontSize: 'var(--type-2)',
        lineHeight: 'var(--leading-body)',
        color: 'var(--color-ink)',
        background: 'var(--color-base-alt)',
        border: '1px solid var(--color-line)',
        borderLeft: '3px solid var(--color-alert)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-2)',
        margin: 0
      }}
    >
      <AlertTriangle
        aria-hidden="true"
        style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: 'var(--color-alert)' }}
      />
      <span><strong>Problem:</strong> {text}</span>
    </p>
  )
}

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
      } catch {
        setError('We could not open contractor sign-up. Nothing was saved yet — tap your answer again.')
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
      } catch {
        setError('We could not save that. Nothing was lost — tap your answer again.')
      }
    }
  }

  const handleZipSubmit = async () => {
    if (!zip || !/^\d{5}$/.test(zip)) {
      setError('A US ZIP code is exactly five digits. Check the number and try again.')
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

      // Create a default property for this ZIP.
      //
      // FEATURE_INVENTORY.md Security Finding 2: `properties` has SELECT and
      // UPDATE policies but NO INSERT policy (020:30-38), so this write is
      // silently denied for every real user and the row never appears. The old
      // code did not check the error at all, which is why the failure surfaced
      // much later as "No ZIP code found. Complete onboarding first." on
      // /homeowner/communities. We cannot add the policy here (no migrations in
      // this pass -- the SQL is reported instead), so we do the two things we
      // can: check the error, and rely on profiles.zip_code, which DID save
      // above and which the downstream pages now read as their fallback.
      const { error: propertyError } = await supabase.from('properties').insert({
        owner_id: userId,
        zip_code: zip,
        label: 'Home',
        is_demo: false
      })
      if (propertyError) {
        console.warn('properties insert denied (see FEATURE_INVENTORY.md §2):', propertyError.code)
      }

      setHistory(prev => [...prev, 'preference'])
      setStep('preference')
    } catch {
      setError('We could not save your ZIP code. Nothing was lost — check your connection and press Continue again.')
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

      // BUG #5: this used to push a bare `/homeowner/matches`. That page
      // required ?project=<id> and bounced to /homeowner when it was missing,
      // so choosing "Find my contractor match" silently landed people on the
      // dashboard. A brand-new homeowner has no project yet, so the honest
      // destination is the estimate that creates one -- and /homeowner/matches
      // now resolves the project itself rather than bouncing, for anyone who
      // does have one.
      if (pref === 'estimate') {
        router.push('/homeowner/estimate')
      } else {
        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        router.push(existing?.id ? `/homeowner/matches?project=${existing.id}` : '/homeowner/estimate')
      }
    } catch {
      setError('We could not save that choice. Nothing was lost — tap the option again.')
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-base)' }}>
      <div className="w-full max-w-md">
        {/* Back button (only show if not first step) */}
        {history.length > 1 && (
          <button
            onClick={goBack}
            className="mb-8 flex items-center gap-2"
            style={{ color: 'var(--color-accent)', fontSize: 'var(--type-2)', minHeight: 44, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Back a step
          </button>
        )}

        {/* STEP 1: SEGMENT SELECTION */}
        {step === 'segment' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 'var(--space-1)', letterSpacing: 'var(--tracking-display)' }}>
                What brings you to Laywork?
              </h1>
              <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--type-3)' }}>
                We&apos;ll customise your experience based on what you do
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {SEGMENT_OPTIONS.map(opt => {
                const Icon = opt.icon
                const selected = segment === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSegmentSelect(opt.id)}
                    className="p-4 text-left"
                    style={{
                      borderRadius: 'var(--radius-card)',
                      border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-line)'}`,
                      backgroundColor: selected ? 'var(--color-accent-wash)' : 'var(--color-base)',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                        style={{ color: selected ? 'var(--color-accent)' : 'var(--color-ink-2)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: 'var(--type-3)' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 'var(--type-2)', color: 'var(--color-ink-2)', marginTop: '0.25rem' }}>
                          {opt.description}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {error && <ErrorLine text={error} />}

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
              <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 'var(--space-1)', letterSpacing: 'var(--tracking-display)' }}>
                What&apos;s your ZIP code?
              </h1>
              <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--type-3)' }}>
                We use it to find contractors near you and to put you in the right neighbourhood.
                We never show your street address to anyone.
              </p>
            </div>

            <div>
              <label htmlFor="zip" className="annotation" style={{ display: 'block', marginBottom: 6 }}>
                ZIP code
              </label>
              <input
                id="zip"
                type="text"
                inputMode="numeric"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="20155"
                maxLength={5}
                className="drawing-input tabular"
                style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.25rem' }}
                onKeyDown={(e) => e.key === 'Enter' && zip && handleZipSubmit()}
              />
              {zip && !/^\d{5}$/.test(zip) && (
                <p
                  className="annotation"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'var(--space-1)', color: 'var(--color-ink-2)' }}
                >
                  <AlertTriangle aria-hidden="true" style={{ width: 12, height: 12, color: 'var(--color-alert)' }} />
                  A US ZIP code is five digits &mdash; {5 - zip.length} to go
                </p>
              )}
            </div>

            {error && <ErrorLine text={error} />}

            <Button
              onClick={handleZipSubmit}
              disabled={!zip || !/^\d{5}$/.test(zip) || loading}
              className="w-full"
            >
              {loading ? 'Saving…' : 'Continue'}
            </Button>
          </div>
        )}

        {/* STEP 3: PREFERENCE (Estimate or Match) */}
        {step === 'preference' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 'var(--space-1)', letterSpacing: 'var(--tracking-display)' }}>
                What would you like to do first?
              </h1>
              <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--type-3)' }}>
                Both are always available — just tell us where to start
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {PREF_OPTIONS.map(opt => {
                const selected = preference === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => handlePreferenceSelect(opt.id)}
                    disabled={loading}
                    className="p-6 text-left"
                    style={{
                      borderRadius: 'var(--radius-card)',
                      border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-line)'}`,
                      backgroundColor: selected ? 'var(--color-accent-wash)' : 'var(--color-base)',
                      cursor: loading ? 'wait' : 'pointer',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 'var(--type-4)', color: 'var(--color-ink)', marginBottom: 'var(--space-1)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 'var(--type-3)', color: 'var(--color-ink-2)' }}>
                      {opt.description}
                    </div>
                  </button>
                )
              })}
            </div>

            {error && <ErrorLine text={error} />}
          </div>
        )}

        {/* STEP 4: EARLY ACCESS (for PM/Agent) */}
        {step === 'early_access' && (
          <div className="flex flex-col gap-8 text-center">
            <div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 'var(--space-1)', letterSpacing: 'var(--tracking-display)' }}>
                You&apos;re on the list
              </h1>
              <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--type-3)', lineHeight: 'var(--leading-body)' }}>
                We&apos;re starting with homeowners and contractors, so the tools built for{' '}
                {segment === 'property_manager' ? 'property managers' : 'real estate professionals'}{' '}
                are not live yet. You&apos;re our first call when they are — and in the meantime the
                homeowner side is fully open to you.
              </p>
            </div>

            <Button onClick={() => router.push('/homeowner')} className="w-full">
              Explore the marketplace
            </Button>

            <p className="annotation">
              We&apos;ll email you the moment your features are ready.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
