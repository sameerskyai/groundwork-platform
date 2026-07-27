'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Star, AlertCircle } from 'lucide-react'

interface ReviewFormProps {
  matchId: string
  projectId: string
  onSubmitted: () => void
}

export function ReviewForm({ matchId, projectId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [finalPrice, setFinalPrice] = useState('')
  const [onTime, setOnTime] = useState<boolean | null>(null)
  const [hasDispute, setHasDispute] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!rating || !finalPrice) {
      setError('Please provide a rating and final price')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/matches/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          projectId,
          rating,
          finalPrice: parseFloat(finalPrice),
          onTime: onTime ?? undefined,
          hasDispute
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Review submission failed')
        setSubmitting(false)
        return
      }

      setSubmitting(false)
      onSubmitted()
    } catch (err) {
      setError('Network error')
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-[var(--color-base)] border border-[var(--color-line)] rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-[var(--color-ink)] mb-4">How was the work?</h3>

      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Project rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'fill-[var(--color-accent)] text-[var(--color-accent)]'
                    : 'text-[var(--color-line-strong)]'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Final Price */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Final price paid</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-2)]">$</span>
          <input
            type="number"
            value={finalPrice}
            onChange={e => setFinalPrice(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[var(--color-line)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* On-time */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Was the work completed on time?</label>
        <div className="flex gap-3">
          <button
            onClick={() => setOnTime(true)}
            className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
              onTime === true
                ? 'border-[var(--color-verified)] bg-[var(--color-base-alt)] text-[var(--color-verified)]'
                : 'border-[var(--color-line)] text-[var(--color-ink-2)] hover:border-[var(--color-line-strong)]'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => setOnTime(false)}
            className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
              onTime === false
                ? 'border-[var(--color-muted)] bg-[var(--color-base-alt)] text-[var(--color-ink)]'
                : 'border-[var(--color-line)] text-[var(--color-ink-2)] hover:border-[var(--color-line-strong)]'
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* Dispute */}
      <div className="mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasDispute}
            onChange={e => setHasDispute(e.target.checked)}
            className="w-5 h-5 rounded border-[var(--color-line)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] mt-0.5"
          />
          <span className="text-sm text-[var(--color-ink-2)]">
            There was a dispute or issue I need to flag
          </span>
        </label>
      </div>

      {error && (
        <div className="mb-4 flex gap-2 p-3 bg-[var(--color-base-alt)] border border-[var(--color-alert)] rounded-lg">
          <AlertCircle className="w-4 h-4 text-[var(--color-alert)] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--color-alert)]">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={submit}
          disabled={submitting || !rating || !finalPrice}
          className="flex-1"
        >
          {submitting ? 'Submitting...' : 'Submit review'}
        </Button>
      </div>
    </div>
  )
}
