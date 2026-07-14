'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, X } from 'lucide-react'

interface PreferenceQuizProps {
  onComplete?: (preferences: {
    preferred_budget: number | null
    preferred_timeline: string | null
    preferred_style: string | null
    experience_level_preference: string | null
  }) => void
  onSkip?: () => void
}

export function HomeownerPreferenceQuiz({ onComplete, onSkip }: PreferenceQuizProps) {
  const [step, setStep] = useState(0)
  const [preferences, setPreferences] = useState({
    preferred_budget: null as number | null,
    preferred_timeline: null as string | null,
    preferred_style: null as string | null,
    experience_level_preference: null as string | null
  })

  const steps = [
    {
      title: "What's your typical project budget?",
      subtitle: 'This helps us match you with contractors at your price point',
      field: 'preferred_budget',
      type: 'budget',
      options: [
        { label: 'Under $5k', value: 2500 },
        { label: '$5k-$15k', value: 10000 },
        { label: '$15k-$50k', value: 32500 },
        { label: '$50k+', value: 75000 }
      ]
    },
    {
      title: 'How fast do you need work completed?',
      subtitle: 'Contractors can see your timeline preferences',
      field: 'preferred_timeline',
      type: 'timeline',
      options: [
        { label: 'ASAP (emergency)', value: 'emergency' },
        { label: 'Within 1-2 weeks', value: 'urgent' },
        { label: 'Within 1-2 months', value: 'flexible' },
        { label: 'No rush', value: 'anytime' }
      ]
    },
    {
      title: "What's your preferred work style?",
      subtitle: 'Helps contractors understand your expectations',
      field: 'preferred_style',
      type: 'style',
      options: [
        { label: 'Quality over speed', value: 'quality-focused' },
        { label: 'Fast and efficient', value: 'speed-focused' },
        { label: 'Budget-conscious', value: 'budget-focused' },
        { label: 'Minimal disruption', value: 'minimal-disruption' }
      ]
    },
    {
      title: 'How experienced are you with contractor work?',
      subtitle: 'This helps contractors explain their process',
      field: 'experience_level_preference',
      type: 'experience',
      options: [
        { label: 'First time', value: 'first-time' },
        { label: 'Some experience', value: 'experienced' },
        { label: 'Very experienced', value: 'very-experienced' }
      ]
    }
  ]

  const currentStep = steps[step]
  if (!currentStep) return null

  const isLastStep = step === steps.length - 1
  const isAnswered = preferences[currentStep.field as keyof typeof preferences] !== null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{currentStep.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{currentStep.subtitle}</p>
          </div>
          <button
            onClick={() => onSkip?.()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Skip quiz"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1 mb-6">
          <div
            className="bg-[#FF6B35] h-1 rounded-full transition-all"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {currentStep.options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                setPreferences(prev => ({
                  ...prev,
                  [currentStep.field]: option.value
                }))
              }}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                preferences[currentStep.field as keyof typeof preferences] === option.value
                  ? 'border-[#FF6B35] bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{option.label}</div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            onClick={() => {
              if (isLastStep) {
                onComplete?.(preferences)
              } else {
                setStep(step + 1)
              }
            }}
            disabled={!isAnswered}
            className="flex-1"
          >
            {isLastStep ? 'Done' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        {/* Skip option (only show if not on last step) */}
        {!isLastStep && (
          <button
            onClick={() => onSkip?.()}
            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
