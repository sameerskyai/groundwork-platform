'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Wrench, ChevronRight, Check } from 'lucide-react'

interface Trade {
  id: string
  name: string
  slug: string
  icon: string
}

interface TradeQuestion {
  id: string
  trade_id: string
  question: string
  field_key: string
  unit: string
  input_type: string
  display_order: number
}

export default function OnboardingPage() {
  const [role, setRole] = useState<string>('')
  const [step, setStep] = useState(0)
  const [trades, setTrades] = useState<Trade[]>([])
  const [selectedTrades, setSelectedTrades] = useState<string[]>([])
  const [questions, setQuestions] = useState<TradeQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [businessName, setBusinessName] = useState('')
  const [yearsInBusiness, setYearsInBusiness] = useState('')
  const [contractorId, setContractorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [timedOut, setTimedOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Set 5-second timeout for profile fetch
      const timeoutId = setTimeout(() => {
        setTimedOut(true)
        setError('Profile load timeout. Try refreshing the page.')
      }, 5000)

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, onboarding_complete')
          .eq('id', user.id)
          .single()

        clearTimeout(timeoutId)

        if (profileError) {
          setError(`Failed to load profile: ${profileError.message}`)
          return
        }

        if (!profile) {
          setError('Profile not found. Please contact support.')
          return
        }

        // If already onboarded, redirect to dashboard
        if (profile.onboarding_complete) {
          router.push(profile.role === 'contractor' ? '/contractor' : '/homeowner')
          return
        }

        setRole(profile.role ?? '')

        if (profile.role === 'contractor') {
          const { data: cp } = await supabase.from('contractor_profiles').select('id').eq('user_id', user.id).single()
          setContractorId(cp?.id ?? '')
        }

        const { data: tradeData } = await supabase.from('trades').select('*').eq('active', true).order('name')
        setTrades(tradeData ?? [])
      } catch (err: any) {
        clearTimeout(timeoutId)
        setError(`Error: ${err.message}`)
      }
    }
    load()
  }, [router])

  async function loadQuestionsForTrades(tradeIds: string[]) {
    const supabase = createClient()
    const { data } = await supabase
      .from('trade_questions')
      .select('*')
      .in('trade_id', tradeIds)
      .eq('active', true)
      .order('display_order')
    setQuestions(data ?? [])
  }

  function toggleTrade(tradeId: string) {
    setSelectedTrades(prev =>
      prev.includes(tradeId) ? prev.filter(t => t !== tradeId) : [...prev, tradeId]
    )
  }

  async function handleNext() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (role === 'homeowner' || role === 'property_manager') {
      await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id)
      router.push(role === 'homeowner' ? '/homeowner' : '/homeowner')
      return
    }

    // Contractor flow
    if (step === 0) {
      // Save business info
      await supabase.from('contractor_profiles').update({
        business_name: businessName,
        years_in_business: parseInt(yearsInBusiness) || 1
      }).eq('user_id', user.id)
      setStep(1)
      setLoading(false)
      return
    }

    if (step === 1) {
      // Save trade selections
      await supabase.from('contractor_trades').delete().eq('contractor_id', contractorId)
      if (selectedTrades.length) {
        await supabase.from('contractor_trades').insert(
          selectedTrades.map(tradeId => ({ contractor_id: contractorId, trade_id: tradeId }))
        )
      }
      await loadQuestionsForTrades(selectedTrades)
      setStep(2)
      setLoading(false)
      return
    }

    if (step === 2) {
      // Submit answers to interview API
      const tradeMap = Object.fromEntries(trades.map(t => [t.id, t.name]))
      const answerPayload = questions.map(q => ({
        question: q.question,
        field_key: q.field_key,
        unit: q.unit,
        raw_input: answers[q.field_key] ?? '',
        trade_id: q.trade_id,
        trade_name: tradeMap[q.trade_id] ?? ''
      })).filter(a => a.raw_input)

      await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerPayload, contractorId })
      })

      await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id)
      router.push('/contractor')
    }
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Load Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  )

  if (!role) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800"></div>
        </div>
        <p className="text-gray-600 mb-2">Loading...</p>
        {timedOut && (
          <p className="text-sm text-gray-500">
            Still loading? Check your connection or <button onClick={() => window.location.reload()} className="text-blue-600 underline">refresh</button>
          </p>
        )}
      </div>
    </div>
  )

  // Homeowner/PM: just redirect
  if (role === 'homeowner' || role === 'property_manager') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-3">You&apos;re all set!</h1>
          <p className="text-gray-500 mb-8">Ready to get your first estimate?</p>
          <Button size="lg" onClick={handleNext} disabled={loading} className="w-full">
            {loading ? 'Setting up...' : 'Start my first project'}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-12">
      <div className="max-w-lg mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {['Business info', 'Your trades', 'Set your rates'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'gradient-brand text-white' : i === step ? 'bg-[#FF6B35] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
              {i < 2 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-[#FF6B35]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-1">Tell us about your business</h2>
            <p className="text-gray-500 text-sm mb-6">This shows on your public profile.</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  placeholder="Baz Construction LLC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years in business</label>
                <input
                  type="number"
                  value={yearsInBusiness}
                  onChange={e => setYearsInBusiness(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  placeholder="5"
                />
              </div>
            </div>
            <Button size="lg" onClick={handleNext} disabled={!businessName || loading} className="w-full mt-6">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-1">What trades do you offer?</h2>
            <p className="text-gray-500 text-sm mb-6">Select all that apply.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {trades.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTrade(t.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedTrades.includes(t.id)
                      ? 'border-[#FF6B35] bg-orange-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                </button>
              ))}
            </div>
            <Button
              size="lg"
              onClick={handleNext}
              disabled={!selectedTrades.length || loading}
              className="w-full"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-1">Set your rates</h2>
            <p className="text-gray-500 text-sm mb-6">
              Answer honestly — this builds your AI profile and helps homeowners find you faster.
            </p>
            <div className="flex flex-col gap-5">
              {questions.map(q => (
                <div key={q.id}>
                  <label className="block text-sm font-medium text-gray-800 mb-1">{q.question}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">$</span>
                    <input
                      type="text"
                      value={answers[q.field_key] ?? ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.field_key]: e.target.value }))}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                      placeholder={`e.g. 50-75 ${q.unit}`}
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">{q.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button size="lg" onClick={handleNext} disabled={loading} className="w-full mt-6">
              {loading ? 'Building your profile...' : 'Complete setup'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
