'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, ChevronRight } from 'lucide-react'

// Personality questions config — load from here, not hardcoded
const PERSONALITY_QUESTIONS = [
  {
    id: 'q1',
    question: 'The last time a contractor discovered an issue mid-project (like hidden water damage) and wanted to add $5K to the scope, what actually happened?',
    answers: [
      { value: 'A', text: 'I asked for a second opinion / breakdown before I decided' },
      { value: 'B', text: 'I told them to go ahead if it was necessary to do it right' },
      { value: 'C', text: 'I pushed back hard on the price and negotiated' },
      { value: 'D', text: 'I didn\'t get to decide — I was just told what it would cost' }
    ],
    trait: 'autonomy'
  },
  {
    id: 'q2',
    question: 'When you hire someone for a job that\'ll take a few weeks, what do you actually prefer?',
    answers: [
      { value: 'A', text: 'They only call/text if something\'s wrong' },
      { value: 'B', text: 'Weekly check-in, I call them if I need something' },
      { value: 'C', text: 'Regular updates + photos, a couple times a week' },
      { value: 'D', text: 'Daily contact—I want to see what\'s happening' }
    ],
    trait: 'communication'
  },
  {
    id: 'q3',
    question: 'A neighbor\'s kitchen contractor showed up 2 hours late without calling. The neighbor left a 1-star review saying they don\'t respect people\'s time. You think that review is:',
    answers: [
      { value: 'A', text: 'Harsh—things happen, the work was good' },
      { value: 'B', text: 'Fair—no excuse for not calling ahead' },
      { value: 'C', text: 'Depends—was the final work worth the wait?' },
      { value: 'D', text: 'Too focused on one incident, contractor is still solid overall' }
    ],
    trait: 'delegation'
  },
  {
    id: 'q4',
    question: 'Your contractor finds hidden structural damage and shows you two paths: finish on your $30K budget by using lower-grade repairs, OR add $7K for materials that\'ll last 25 years instead of 8 years. What\'s your first instinct?',
    answers: [
      { value: 'A', text: 'Do the $30K version—budget was the deal' },
      { value: 'B', text: 'Do the $37K version—I didn\'t want to cheap out' },
      { value: 'C', text: 'I don\'t have a gut reaction—want to see the full breakdown' },
      { value: 'D', text: 'Something in between—maybe $33K if we cut somewhere else' }
    ],
    trait: 'flexibility'
  },
  {
    id: 'q5',
    question: 'When is it okay for a contractor to ignore your original plan and do something different because they think it\'s better?',
    answers: [
      { value: 'A', text: 'Never—I hired them to do what I asked' },
      { value: 'B', text: 'If they explain why first, then they can make the call' },
      { value: 'C', text: 'Always—they\'re the expert' },
      { value: 'D', text: 'Only if it saves money or time' }
    ],
    trait: 'conflict'
  }
]

interface PersonalityResponses {
  q1?: string
  q2?: string
  q3?: string
  q4?: string
  q5?: string
}

function PersonalityContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<PersonalityResponses>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const currentQuestion = PERSONALITY_QUESTIONS[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === PERSONALITY_QUESTIONS.length - 1
  const hasAnsweredCurrent = responses[`q${currentQuestionIndex + 1}` as keyof PersonalityResponses] !== undefined

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

        // Calculate trait vector based on responses
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
            {currentQuestionIndex + 1} / {PERSONALITY_QUESTIONS.length}
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
                    backgroundColor: responses[`q${currentQuestionIndex + 1}` as keyof PersonalityResponses] === answer.value
                      ? 'var(--color-brand)'
                      : 'var(--color-surface-secondary)',
                    color: responses[`q${currentQuestionIndex + 1}` as keyof PersonalityResponses] === answer.value
                      ? 'white'
                      : 'var(--color-text-primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-md)',
                    border: `2px solid ${responses[`q${currentQuestionIndex + 1}` as keyof PersonalityResponses] === answer.value ? 'var(--color-brand)' : 'var(--color-border)'}`,
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

// Trait vector calculation function
function calculateTraitVector(responses: PersonalityResponses): Record<string, number> {
  const questionResponses = [
    responses.q1,
    responses.q2,
    responses.q3,
    responses.q4,
    responses.q5
  ]

  // Simple scoring: A/B = low (0), C/D = high (1)
  // In production, use more nuanced mapping per question design
  const traits = {
    autonomy: scoreAnswer(responses.q1),      // Q1
    communication: scoreAnswer(responses.q2), // Q2
    delegation: scoreAnswer(responses.q3),    // Q3
    flexibility: scoreAnswer(responses.q4),   // Q4
    conflict: scoreAnswer(responses.q5)       // Q5
  }

  return traits
}

function scoreAnswer(answer?: string): number {
  if (!answer) return 0.5
  if (answer === 'A' || answer === 'B') return 0.3
  if (answer === 'C' || answer === 'D') return 0.7
  return 0.5
}
