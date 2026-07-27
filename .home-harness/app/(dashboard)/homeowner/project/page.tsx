'use client'

/**
 * Project checklist (J7).
 *
 * FEATURE_INVENTORY.md, "Other blocking defects": this page selected
 * `budget_low, budget_high, steps(...)`. The real columns are `budget_min` /
 * `budget_max` and the real table is `project_steps`, so every load threw and
 * the checklist was unreachable. Fixed against the live schema (verified
 * against `projects` and `project_steps` directly).
 *
 * Two secondary fixes: the page now resolves the project itself when `?project=`
 * is missing (same class of dead end as BUG #5), and DEFAULT_STEPS — which was
 * declared and never used — is now what the empty state actually creates.
 * `project_steps_insert_owner` (028:74) permits that write from the browser.
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Check, ListChecks, Zap } from 'lucide-react'
import { Notice, EmptyState, Loading, PageHeader } from '../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../_lib/errors'

interface ProjectStep {
  id: string
  step_number: number
  title: string
  description: string | null
  completed: boolean
}

interface Project {
  id: string
  title: string | null
  description: string | null
  status: string
  budget_min: number | null
  budget_max: number | null
  created_at: string
}

const DEFAULT_STEPS = [
  { title: 'Planning & assessment', description: 'Define scope and requirements' },
  { title: 'Permits & approvals', description: 'Obtain necessary permits' },
  { title: 'Design phase', description: 'Finalise design and materials' },
  { title: 'Contractor selection', description: 'Hire and contract your pro' },
  { title: 'Budget approval', description: 'Agree the final budget and timeline' },
  { title: 'Materials ordering', description: 'Order everything with a lead time' },
  { title: 'Prep & demolition', description: 'Clear the space and strip out' },
  { title: 'Installation', description: 'The main construction work' },
  { title: 'Inspections', description: 'Pass the required inspections' },
  { title: 'Finishing & paint', description: 'Final surfaces and touch-ups' },
  { title: 'Testing & walkthrough', description: 'Test every system, then walk it together' },
  { title: 'Closeout', description: 'Final payment, warranties, receipts' }
]

function money(n: number | null) {
  return n == null ? null : `$${n.toLocaleString('en-US')}`
}

function ProjectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramProject = searchParams.get('project')

  const [project, setProject] = useState<Project | null>(null)
  const [steps, setSteps] = useState<ProjectStep[]>([])
  const [noProject, setNoProject] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const loadProject = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      let id = paramProject
      if (!id) {
        const { data: latest } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!latest?.id) {
          setNoProject(true)
          setLoading(false)
          return
        }
        id = latest.id
        router.replace(`/homeowner/project?project=${id}`)
      }

      // REAL columns. budget_low/budget_high never existed.
      const { data: projectData, error: projError } = await supabase
        .from('projects')
        .select('id, title, description, status, budget_min, budget_max, created_at')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (projError) throw projError
      if (!projectData) {
        setError({
          title: 'We could not find that project',
          detail: 'It may belong to a different account, or it may have been closed. Open it from your dashboard instead.'
        })
        setLoading(false)
        return
      }

      // REAL table. `steps` was never a relation on projects.
      const { data: stepRows, error: stepsError } = await supabase
        .from('project_steps')
        .select('id, step_number, title, description, completed')
        .eq('project_id', id)
        .order('step_number', { ascending: true })

      if (stepsError) throw stepsError

      setProject(projectData)
      setSteps(stepRows ?? [])
      setError(null)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not load this project',
          detail: 'Nothing has been changed or lost. Reload the page — your estimate and matches are unaffected.'
        })
      )
    } finally {
      setLoading(false)
    }
  }, [paramProject, router])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const handleCreateChecklist = async () => {
    if (!project) return
    setCreating(true)
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase.from('project_steps').insert(
        DEFAULT_STEPS.map((s, i) => ({
          project_id: project.id,
          step_number: i + 1,
          title: s.title,
          description: s.description,
          completed: false
        }))
      )
      if (insertError) throw insertError
      await loadProject()
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not build your checklist',
          detail: 'Nothing was half-created — try the button again. If it keeps failing the rest of your project is unaffected.'
        })
      )
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStep = async (stepId: string, currentCompleted: boolean) => {
    setUpdating(stepId)
    try {
      const supabase = createClient()
      const { error: updError } = await supabase
        .from('project_steps')
        .update({ completed: !currentCompleted })
        .eq('id', stepId)

      if (updError) throw updError
      setSteps(prev => prev.map(s => (s.id === stepId ? { ...s, completed: !currentCompleted } : s)))
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'That tick did not save',
          detail: 'The step is still showing its old state, which is the true one. Tap it again to retry.'
        })
      )
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <Loading what="Loading your project" />

  const shell = (title: string, children: React.ReactNode) => (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <PageHeader back={{ href: '/homeowner', label: 'Dashboard' }} title={title} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>{children}</div>
    </div>
  )

  if (noProject) {
    return shell(
      'Your project',
      <EmptyState
        glyph={<Zap style={{ width: 22, height: 22 }} />}
        title="There is no project to track yet"
        why="This page follows one renovation from planning to closeout. It stays empty until you have a project, and a project starts with an estimate."
        action={{ label: 'Start a free estimate', href: '/homeowner/estimate' }}
        secondary={{ label: 'Back to dashboard', href: '/homeowner' }}
      />
    )
  }

  if (!project) {
    return shell(
      'Your project',
      <>
        {error && <Notice error={error} />}
        <div style={{ marginTop: 'var(--space-3)' }}>
          <Link href="/homeowner" className="btn-primary" style={{ textDecoration: 'none' }}>
            Back to dashboard
          </Link>
        </div>
      </>
    )
  }

  const completedSteps = steps.filter(s => s.completed).length
  const progressPercent = steps.length ? Math.round((completedSteps / steps.length) * 100) : 0
  const budget =
    project.budget_min != null && project.budget_max != null
      ? project.budget_min === project.budget_max
        ? money(project.budget_min)
        : `${money(project.budget_min)}–${money(project.budget_max)}`
      : null

  return shell(
    project.title ?? 'Your project',
    <>
      {error && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Notice error={error} />
        </div>
      )}

      <section
        style={{
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-3)',
          marginBottom: 'var(--space-3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-1)' }}>
          <h2 className="annotation" style={{ margin: 0 }}>Progress</h2>
          <span
            className="tabular"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-4)', fontWeight: 600, color: 'var(--color-accent)' }}
          >
            {progressPercent}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            height: 8,
            background: 'var(--color-base-alt)',
            border: '1px solid var(--color-line)',
            borderRadius: 'var(--radius-control)',
            overflow: 'hidden'
          }}
        >
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--color-accent)', transition: 'width var(--dur-base) var(--ease-precise)' }} />
        </div>
        <p className="annotation" style={{ marginTop: 'var(--space-1)' }}>
          {completedSteps} of {steps.length} steps done{budget ? ` · Budget ${budget}` : ''}
        </p>
      </section>

      {steps.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {steps.map(step => (
            <li key={step.id}>
              <button
                onClick={() => handleToggleStep(step.id, step.completed)}
                disabled={updating === step.id}
                aria-pressed={step.completed}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-2)',
                  textAlign: 'left',
                  padding: 'var(--space-2)',
                  background: 'var(--color-base)',
                  border: '1px solid var(--color-line)',
                  borderRadius: 'var(--radius-card)',
                  cursor: updating === step.id ? 'wait' : 'pointer'
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    marginTop: 2,
                    borderRadius: 'var(--radius-control)',
                    background: step.completed ? 'var(--color-verified)' : 'var(--color-base-alt)',
                    border: `1px solid ${step.completed ? 'var(--color-verified)' : 'var(--color-line-strong)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {step.completed && <Check style={{ width: 14, height: 14, color: 'var(--color-base)' }} />}
                </span>
                <span style={{ flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--type-3)',
                      fontWeight: 600,
                      color: step.completed ? 'var(--color-muted)' : 'var(--color-ink)',
                      textDecoration: step.completed ? 'line-through' : 'none'
                    }}
                  >
                    {step.step_number}. {step.title}
                  </span>
                  {step.description && (
                    <span style={{ display: 'block', fontSize: 'var(--type-2)', color: 'var(--color-ink-2)' }}>
                      {step.description}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          glyph={<ListChecks style={{ width: 22, height: 22 }} />}
          title="No checklist on this project yet"
          why="A renovation has twelve predictable stages, from permits to closeout. We have not created yours because a checklist you did not ask for is just noise — say the word and it appears, and you can tick items off as they happen."
          action={{ label: creating ? 'Building…' : 'Build my checklist', onClick: handleCreateChecklist }}
          secondary={{ label: 'Back to dashboard', href: '/homeowner' }}
        />
      )}
    </>
  )
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<Loading what="Loading your project" />}>
      <ProjectContent />
    </Suspense>
  )
}
