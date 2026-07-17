'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { HOMEOWNER_QUESTIONS, getRandomizedQuestion, calculateTraitVector } from '@/lib/config/personality-questions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, ChevronRight } from 'lucide-react'

function PersonalityContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [randomizedQuestions, setRandomizedQuestions] = useState(HOMEOWNER_QUESTIONS)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load user ID and randomize questions once on mount
  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        // Randomize question order for this user (deterministic per user)
        const randomized = HOMEOWNER_QUESTIONS.map(q => getRandomizedQuestion(q, user.id))
        setRandomizedQuestions(randomized)
      }
    }
    loadUser()
  }, [])

  const currentQuestion = randomizedQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === randomizedQuestions.length - 1
  const hasAnsweredCurrent = responses[`q${currentQuestionIndex + 1}`] !== undefined

  const handleAnswer = (answer: string) => {
    setResponses(prev => ({
      ...prev,
      [`q${currentQuestionIndex + 1}`]: answer
    }))
  }

  const handleNext = async () => {
    if (!hasAnsweredCurrent) return

    if (isLastQuestion) {
      // Save all responses
      setSaving(true)
      setError('')

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Calculate trait vector based on responses (server-side calculation)
        const traitVector = calculateTraitVector(responses)

        await supabase.from('personality_responses').insert({
          project_id: projectId,
          user_id: user.id,
          responses,
          trait_vector: traitVector
        })

        // Route to match pool
        router.push(`/homeowner/matches?project=${projectId}`)
      } catch (err: any) {
        setError(err.message || 'Failed to save responses')
        setSaving(false)
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else {
      router.back()
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--color-surface-primary)', minHeight: '100vh' }}>
      <header style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 1.5rem'
      }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={handleBack}
            style={{ color: 'var(--color-text-secondary)' }}
            className="hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
            Get to know you
          </h1>
          <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
            {currentQuestionIndex + 1} / {randomizedQuestions.length}
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col min-h-[calc(100vh-80px)]">
        <Card variant="default" className="flex-1 p-8 flex flex-col justify-between">
          {/* Question */}
          <div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
              lineHeight: '1.3',
              marginBottom: 'var(--space-lg)'
            }}>
              {currentQuestion.question}
            </h2>

            {/* Answers */}
            <div className="flex flex-col gap-3">
              {currentQuestion.answers.map(answer => (
                <button
                  key={answer.value}
                  onClick={() => handleAnswer(answer.value)}
                  style={{
                    backgroundColor: responses[`q${currentQuestionIndex + 1}`] === answer.value
                      ? 'var(--color-brand)'
                      : 'var(--color-surface-secondary)',
                    color: responses[`q${currentQuestionIndex + 1}`] === answer.value
                      ? 'white'
                      : 'var(--color-text-primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-md)',
                    border: `2px solid ${responses[`q${currentQuestionIndex + 1}`] === answer.value ? 'var(--color-brand)' : 'var(--color-border)'}`,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                    fontSize: 'var(--text-base)'
                  }}
                  className="hover:opacity-80"
                >
                  {answer.text}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-lg)' }}>
              {error}
            </p>
          )}

          {/* Next Button */}
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <Button
              onClick={handleNext}
              disabled={!hasAnsweredCurrent || saving}
              className="w-full flex items-center justify-center gap-2"
            >
              {saving ? 'Saving...' : isLastQuestion ? 'See matches' : 'Next'}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function PersonalityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <PersonalityContent />
    </Suspense>
  )
}

