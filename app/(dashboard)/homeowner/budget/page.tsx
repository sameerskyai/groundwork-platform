'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Wallet } from 'lucide-react'
import { formatRange } from '@/lib/utils'

function BudgetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')

  const [budget, setBudget] = useState('')
  const [estimateMidpoint, setEstimateMidpoint] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        if (!projectId) {
          setError('No project selected. Go back to estimate.')
          setLoading(false)
          return
        }

        const supabase = createClient()
        const { data: project } = await supabase
          .from('projects')
          .select('ai_estimate_low, ai_estimate_high, budget_min, budget_max')
          .eq('id', projectId)
          .single()

        if (!project) {
          setError('Project not found.')
          setLoading(false)
          return
        }

        // Pre-fill with estimate midpoint
        const low = project.ai_estimate_low || 0
        const high = project.ai_estimate_high || 0
        const midpoint = (low + high) / 2
        setEstimateMidpoint(midpoint)
        setBudget(Math.round(midpoint).toString())
        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'Failed to load project')
        setLoading(false)
      }
    }

    load()
  }, [projectId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!budget || !projectId) {
      setError('Please enter a budget')
      return
    }

    setSaving(true)
    setError('')

    try {
      const supabase = createClient()
      const budgetAmount = parseInt(budget)

      await supabase
        .from('projects')
        .update({
          budget_min: budgetAmount,
          budget_max: budgetAmount
        })
        .eq('id', projectId)

      // Next: personality questions (J2)
      router.push(`/homeowner/personality?project=${projectId}`) // Route to 5-question flow
    } catch (err: any) {
      setError(err.message || 'Failed to save budget')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <div className="w-full max-w-md">
        <button
          onClick={() => window.history.back()}
          className="mb-8 flex items-center gap-2 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <form onSubmit={handleSave} className="flex flex-col gap-8">
          <div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
              What's your budget?
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              All-in: materials, labor, and contractor's margin
            </p>
          </div>

          <Card variant="default" className="p-6">
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                Budget amount
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                  $
                </span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  min="0"
                  className="flex-1 px-3 py-2 rounded-lg border-2 border-[color:var(--color-border)] text-lg"
                  style={{
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'var(--color-surface-secondary)',
                    fontFamily: 'monospace'
                  }}
                  placeholder="25000"
                />
              </div>
              {estimateMidpoint > 0 && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)' }}>
                  Estimate range was {formatRange(estimateMidpoint * 0.8, estimateMidpoint * 1.2)} (adjust as needed)
                </p>
              )}
            </div>

            {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-lg)' }}>{error}</p>}

            <Button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" />
              {saving ? 'Saving...' : 'Continue to personality'}
            </Button>
          </Card>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
            You can update this anytime
          </p>
        </form>
      </div>
    </div>
  )
}

export default function BudgetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading project...</p>
        </div>
      </div>
    }>
      <BudgetContent />
    </Suspense>
  )
}
