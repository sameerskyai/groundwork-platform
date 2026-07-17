'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Check } from 'lucide-react'

interface ProjectStep {
  id: string
  step_number: number
  title: string
  description: string
  completed: boolean
}

interface Project {
  id: string
  property_id: string
  title: string
  description: string
  status: string
  budget_low: number
  budget_high: number
  created_at: string
  steps: ProjectStep[]
}

const DEFAULT_STEPS = [
  { title: 'Planning & Assessment', description: 'Define scope and requirements' },
  { title: 'Permits & Approvals', description: 'Obtain necessary permits' },
  { title: 'Design Phase', description: 'Finalize design and materials' },
  { title: 'Contractor Selection', description: 'Hire and contract contractor' },
  { title: 'Budget Approval', description: 'Approve final budget and timeline' },
  { title: 'Materials Ordering', description: 'Order all required materials' },
  { title: 'Prep & Demolition', description: 'Prepare space and remove old elements' },
  { title: 'Installation', description: 'Main construction work' },
  { title: 'Inspections', description: 'Pass required inspections' },
  { title: 'Finishing & Paint', description: 'Final touches and finishes' },
  { title: 'Testing & Walkthrough', description: 'Test all systems and review work' },
  { title: 'Project Closeout', description: 'Final payment and warranty setup' }
]

function ProjectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const loadProject = useCallback(async () => {
    try {
      if (!projectId) {
        throw new Error('No project specified')
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: projectData, error: projError } = await supabase
        .from('projects')
        .select('id, property_id, title, description, status, budget_low, budget_high, created_at, steps(id, step_number, title, description, completed)')
        .eq('id', projectId)
        .single()

      if (projError) throw projError
      if (!projectData) throw new Error('Project not found')

      setProject(projectData as any)
    } catch (err: any) {
      setError(err.message || 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const handleToggleStep = async (stepId: string, currentCompleted: boolean) => {
    setUpdating(stepId)
    try {
      const supabase = createClient()
      await supabase
        .from('project_steps')
        .update({ completed: !currentCompleted })
        .eq('id', stepId)

      // Update local state
      setProject(prev => prev ? {
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? { ...s, completed: !currentCompleted } : s)
      } : null)
    } catch (err: any) {
      setError(err.message || 'Failed to update step')
    } finally {
      setUpdating(null)
    }
  }

  const completedSteps = project?.steps?.filter(s => s.completed).length || 0
  const totalSteps = project?.steps?.length || 0
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <Card className="max-w-sm p-8 text-center">
          <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-lg)' }}>{error || 'Project not found'}</p>
          <Link href="/homeowner">
            <Button className="w-full">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--color-surface-primary)', minHeight: '100vh' }}>
      <header style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 1.5rem'
      }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/homeowner" style={{ color: 'var(--color-text-secondary)' }} className="hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 style={{
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-primary)',
            flex: 1
          }}>
            {project.title}
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <Card className="p-4 mb-6" style={{ borderColor: 'var(--color-error)', borderWidth: '1px' }}>
            <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
              {error}
            </p>
          </Card>
        )}

        {/* Progress Section */}
        <Card variant="interactive" className="p-6 mb-6">
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-sm)'
            }}>
              <h2 style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-text-primary)'
              }}>
                Project Progress
              </h2>
              <span style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-brand)'
              }}>
                {progressPercent}%
              </span>
            </div>

            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--color-surface-secondary)',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: 'var(--color-brand)',
                transition: 'width 300ms ease'
              }} />
            </div>
          </div>

          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            {completedSteps} of {totalSteps} steps completed
          </p>
        </Card>

        {/* Checklist */}
        <div className="flex flex-col gap-3">
          {project.steps && project.steps.length > 0 ? (
            project.steps
              .sort((a, b) => a.step_number - b.step_number)
              .map((step) => (
                <Card
                  key={step.id}
                  variant="interactive"
                  className="p-4"
                  style={{
                    opacity: step.completed ? 0.7 : 1,
                    transition: 'opacity 200ms'
                  }}
                >
                  <button
                    onClick={() => handleToggleStep(step.id, step.completed)}
                    disabled={updating === step.id}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-md)',
                      cursor: updating === step.id ? 'not-allowed' : 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      textAlign: 'left'
                    }}
                  >
                    <div style={{
                      flexShrink: 0,
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: step.completed ? 'var(--color-brand)' : 'var(--color-surface-secondary)',
                      border: step.completed ? 'none' : '2px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 200ms',
                      marginTop: '2px'
                    }}>
                      {step.completed && (
                        <Check className="w-4 h-4" style={{ color: 'white' }} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--weight-semibold)',
                        color: 'var(--color-text-primary)',
                        marginBottom: 'var(--space-xs)',
                        textDecoration: step.completed ? 'line-through' : 'none',
                        opacity: step.completed ? 0.6 : 1
                      }}>
                        {step.title}
                      </h3>
                      <p style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-secondary)',
                        opacity: step.completed ? 0.6 : 1
                      }}>
                        {step.description}
                      </p>
                    </div>
                  </button>
                </Card>
              ))
          ) : (
            <Card className="p-8 text-center">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                No steps yet. Start by completing the first step!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <ProjectContent />
    </Suspense>
  )
}
