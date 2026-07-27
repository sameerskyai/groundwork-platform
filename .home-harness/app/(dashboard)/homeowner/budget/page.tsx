'use client'

/**
 * Budget capture (J2, step 1 of 2 before matching).
 *
 * Was a dead end in two ways: a missing `?project=` produced the raw string
 * "No project selected. Go back to estimate." with no link to an estimate, and
 * "Back" called window.history.back(), which lands wherever the user happened
 * to come from rather than where the label implies. Both fixed: the project is
 * resolved here, and every exit is a named destination.
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Wallet, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRange } from '@/lib/utils'
import { Notice, EmptyState, Loading, PageHeader } from '../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../_lib/errors'

function BudgetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramProject = searchParams.get('project')

  const [projectId, setProjectId] = useState<string | null>(paramProject)
  const [noProject, setNoProject] = useState(false)
  const [budget, setBudget] = useState('')
  const [estimateMidpoint, setEstimateMidpoint] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<FriendlyError | null>(null)

  const load = useCallback(async () => {
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
        router.replace(`/homeowner/budget?project=${id}`)
      }
      setProjectId(id)

      const { data: project, error: projError } = await supabase
        .from('projects')
        .select('ai_estimate_low, ai_estimate_high, budget_min, budget_max')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (projError) throw projError
      if (!project) {
        setError({
          title: 'We could not find that project',
          detail: 'The link may point at a project on another account. Go back to your dashboard and open your own.'
        })
        setLoading(false)
        return
      }

      const low = project.ai_estimate_low || 0
      const high = project.ai_estimate_high || 0
      const midpoint = (low + high) / 2
      setEstimateMidpoint(midpoint)
      setBudget(project.budget_max ? String(project.budget_max) : midpoint ? String(Math.round(midpoint)) : '')
      setError(null)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not load your project',
          detail: 'Nothing was lost. Reload the page, or go back to your dashboard and open the project from there.'
        })
      )
    } finally {
      setLoading(false)
    }
  }, [paramProject, router])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseInt(budget, 10)
    if (!projectId || !Number.isFinite(amount) || amount <= 0) {
      setError({
        title: 'That budget does not look right',
        detail: 'Enter a whole number in dollars, with no symbols — for example 25000.'
      })
      return
    }

    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updError } = await supabase
        .from('projects')
        .update({ budget_min: amount, budget_max: amount })
        .eq('id', projectId)

      if (updError) throw updError

      router.push(`/homeowner/personality?project=${projectId}`)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not save your budget',
          detail: 'The figure is still in the box, so nothing was lost. Press continue again in a moment.'
        })
      )
      setSaving(false)
    }
  }

  if (loading) return <Loading what="Loading your project" />

  if (noProject) {
    return (
      <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
        <PageHeader back={{ href: '/homeowner', label: 'Dashboard' }} title="Your budget" />
        <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>
          <EmptyState
            glyph={<Zap style={{ width: 22, height: 22 }} />}
            title="No project to budget for yet"
            why="A budget is attached to one specific job, so we need the job first. The estimate takes about a minute and gives you a range to work from."
            action={{ label: 'Start a free estimate', href: '/homeowner/estimate' }}
            secondary={{ label: 'Back to dashboard', href: '/homeowner' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <PageHeader back={{ href: '/homeowner', label: 'Dashboard' }} title="Your budget" />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>
        <p className="annotation" style={{ marginBottom: 'var(--space-1)' }}>Step 1 of 2</p>
        <h2
          style={{
            margin: '0 0 var(--space-1) 0',
            fontSize: 'var(--type-6)',
            fontWeight: 700,
            letterSpacing: 'var(--tracking-display)',
            color: 'var(--color-ink)'
          }}
        >
          What is your budget?
        </h2>
        <p
          style={{
            margin: '0 0 var(--space-3) 0',
            fontSize: 'var(--type-3)',
            lineHeight: 'var(--leading-body)',
            color: 'var(--color-ink-2)'
          }}
        >
          All-in: materials, labour and the contractor&apos;s margin. Contractors never see this
          number on its own — it only filters who you get matched with.
        </p>

        <form onSubmit={handleSave}>
          <div
            style={{
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-card)',
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-2)'
            }}
          >
            <label htmlFor="budget" className="annotation" style={{ display: 'block', marginBottom: 6 }}>
              Budget amount (USD)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-5)', color: 'var(--color-ink)' }}>$</span>
              <input
                id="budget"
                type="number"
                inputMode="numeric"
                className="drawing-input tabular"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                required
                min="1"
                placeholder="25000"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
            {estimateMidpoint > 0 && (
              <p className="annotation" style={{ marginTop: 'var(--space-1)' }}>
                Your AI estimate came in around {formatRange(estimateMidpoint * 0.8, estimateMidpoint * 1.2)}
              </p>
            )}
          </div>

          {error && (
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <Notice error={error} />
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary" style={{ width: '100%', border: 'none', cursor: 'pointer' }}>
            <Wallet style={{ width: 15, height: 15, marginRight: 8 }} aria-hidden="true" />
            {saving ? 'Saving…' : 'Continue to the last few questions'}
          </button>
        </form>

        <p className="annotation" style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
          You can change this at any time
        </p>
      </div>
    </div>
  )
}

export default function BudgetPage() {
  return (
    <Suspense fallback={<Loading what="Loading your project" />}>
      <BudgetContent />
    </Suspense>
  )
}
