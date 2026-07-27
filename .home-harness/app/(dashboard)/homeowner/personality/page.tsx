'use client'

/**
 * Five-question compatibility quiz (J2, step 2 of 2).
 *
 * Two dead ends removed: "Back" on question 1 called router.back(), which is
 * wherever the browser happened to come from rather than the budget step it
 * follows; and finishing pushed `/homeowner/matches?project=${projectId}` with
 * projectId possibly null, producing the literal `?project=null`. The project
 * is now resolved here, and every exit names its destination.
 */

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { HOMEOWNER_QUESTIONS, getRandomizedQuestion, calculateTraitVector } from '@/lib/config/personality-questions'
import { ChevronRight } from 'lucide-react'
import { Notice, Loading, PageHeader } from '../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../_lib/errors'

function PersonalityContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawProject = searchParams.get('project')
  const [projectId, setProjectId] = useState<string | null>(
    rawProject && rawProject !== 'null' && rawProject !== 'undefined' ? rawProject : null
  )

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [randomizedQuestions, setRandomizedQuestions] = useState(HOMEOWNER_QUESTIONS)
  const [booting, setBooting] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<FriendlyError | null>(null)

  // Load user, resolve the project, and randomise question order once on mount.
  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setRandomizedQuestions(HOMEOWNER_QUESTIONS.map(q => getRandomizedQuestion(q, user.id)))

      if (!projectId) {
        const { data: latest } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (latest?.id) setProjectId(latest.id)
      }
      setBooting(false)
    }
    loadUser()
    // projectId is intentionally not a dependency: this runs once to bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

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
      setSaving(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const traitVector = calculateTraitVector(responses)

        const { error: insertError } = await supabase.from('personality_responses').insert({
          project_id: projectId,
          user_id: user.id,
          responses,
          trait_vector: traitVector
        })
        if (insertError) throw insertError

        // Never interpolate a null id into the URL -- that is what produced
        // `?project=null` and bounced people off the matches page.
        router.push(projectId ? `/homeowner/matches?project=${projectId}` : '/homeowner/matches')
      } catch (err) {
        setError(
          friendlyError(err, {
            title: 'We could not save your answers',
            detail: 'Your answers are still on screen, so nothing was lost. Press "See matches" again in a moment.'
          })
        )
        setSaving(false)
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  if (booting) return <Loading what="Getting your questions ready" />

  // Question 1's back link goes to the step that precedes it, not to whatever
  // the browser's history happens to hold.
  const back =
    currentQuestionIndex > 0
      ? null
      : { href: projectId ? `/homeowner/budget?project=${projectId}` : '/homeowner', label: projectId ? 'Budget' : 'Dashboard' }

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      {back ? (
        <PageHeader
          back={back}
          title="A few quick questions"
          trailing={<span className="annotation tabular">{currentQuestionIndex + 1}/{randomizedQuestions.length}</span>}
        />
      ) : (
        <header
          style={{
            background: 'var(--color-base)',
            borderBottom: '1px solid var(--color-line)',
            padding: 'var(--space-2) var(--space-3)'
          }}
        >
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                minHeight: 44,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--type-2)',
                color: 'var(--color-accent)'
              }}
            >
              <span aria-hidden="true">&larr;</span> Previous question
            </button>
            <h1
              style={{
                flex: 1,
                margin: 0,
                textAlign: 'center',
                fontSize: 'var(--type-4)',
                fontWeight: 600,
                color: 'var(--color-ink)',
                letterSpacing: 'var(--tracking-display)'
              }}
            >
              A few quick questions
            </h1>
            <span className="annotation tabular" style={{ minWidth: 64, textAlign: 'right' }}>
              {currentQuestionIndex + 1}/{randomizedQuestions.length}
            </span>
          </div>
        </header>
      )}

      <div style={{ maxWidth: 620, margin: '0 auto', padding: 'var(--space-6) var(--space-3)' }}>
        <h2
          style={{
            margin: '0 0 var(--space-3) 0',
            fontSize: 'var(--type-5)',
            lineHeight: 'var(--leading-display)',
            letterSpacing: 'var(--tracking-display)',
            fontWeight: 700,
            color: 'var(--color-ink)'
          }}
        >
          {currentQuestion.question}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {currentQuestion.answers.map(answer => {
            const selected = responses[`q${currentQuestionIndex + 1}`] === answer.value
            return (
              <button
                key={answer.value}
                onClick={() => handleAnswer(answer.value)}
                aria-pressed={selected}
                style={{
                  textAlign: 'left',
                  padding: 'var(--space-2)',
                  minHeight: 44,
                  fontSize: 'var(--type-3)',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-card)',
                  background: selected ? 'var(--color-accent-wash)' : 'var(--color-base)',
                  color: 'var(--color-ink)',
                  border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-line)'}`,
                  boxShadow: selected ? 'inset 0 0 0 1px var(--color-accent)' : 'none'
                }}
              >
                {selected && <span aria-hidden="true" style={{ color: 'var(--color-accent)', marginRight: 8 }}>✓</span>}
                {answer.text}
              </button>
            )
          })}
        </div>

        {error && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Notice error={error} />
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!hasAnsweredCurrent || saving}
          className="btn-primary"
          style={{
            width: '100%',
            marginTop: 'var(--space-4)',
            border: 'none',
            cursor: 'pointer',
            opacity: !hasAnsweredCurrent || saving ? 0.5 : 1
          }}
        >
          {saving ? 'Saving…' : isLastQuestion ? 'See my matches' : 'Next question'}
          {!saving && <ChevronRight style={{ width: 15, height: 15, marginLeft: 6 }} aria-hidden="true" />}
        </button>

        {!hasAnsweredCurrent && (
          <p className="annotation" style={{ textAlign: 'center', marginTop: 'var(--space-1)' }}>
            Pick an answer to continue
          </p>
        )}
      </div>
    </div>
  )
}

export default function PersonalityPage() {
  return (
    <Suspense fallback={<Loading what="Getting your questions ready" />}>
      <PersonalityContent />
    </Suspense>
  )
}

