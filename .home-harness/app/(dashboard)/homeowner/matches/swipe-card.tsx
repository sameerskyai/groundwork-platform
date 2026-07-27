'use client'

/**
 * One match card.
 *
 * Was `fixed inset-0`, which painted over the page header and took the "back to
 * dashboard" link with it — part of why Bug #5 felt like a dead end. It now
 * sits in normal flow beneath the header. `rating` and `years_in_business` are
 * nullable in `contractor_profiles` and were being dereferenced blindly, so a
 * seeded contractor with no tenure crashed the render.
 */

import { useState } from 'react'
import { Heart, X, Bookmark, Star } from 'lucide-react'
import { Avatar } from '../../_components/Feedback'

export interface Match {
  id: string
  match_score: number
  match_reasoning: string | null
  contractor: {
    id: string
    business_name: string
    rating: number | null
    review_count: number | null
    verified_job_count: number | null
    years_in_business: number | null
    profiles: {
      avatar_url: string | null
    } | null
  }
}

interface SwipeCardProps {
  match: Match
  onHeart: (matchId: string) => void
  onPass: (matchId: string) => void
  onSave: (matchId: string) => void
  saving?: boolean
  passing?: boolean
}

export default function SwipeCard({
  match,
  onHeart,
  onPass,
  onSave,
  saving = false,
  passing = false
}: SwipeCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const matchPercentage = Math.round(match.match_score * 100)

  // The 80% gate is enforced by the query; this is the belt-and-braces copy.
  if (matchPercentage < 80) return null

  const c = match.contractor
  const facts = [
    c.years_in_business != null ? `${c.years_in_business} years in business` : null,
    c.review_count != null ? `${c.review_count} reviews` : null,
    c.verified_job_count != null ? `${c.verified_job_count} verified jobs` : null
  ].filter(Boolean)

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>
      <div
        style={{
          background: 'var(--color-base)',
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
          <Avatar name={c.business_name} src={c.profiles?.avatar_url} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: '0 0 4px 0',
                fontSize: 'var(--type-5)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-display)',
                color: 'var(--color-ink)'
              }}
            >
              {c.business_name}
            </h2>
            <p className="annotation" style={{ margin: 0 }}>
              {facts.length ? facts.join(' · ') : 'New to Laywork'}
            </p>
          </div>
          <span
            className="tabular"
            style={{
              flexShrink: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--type-2)',
              fontWeight: 600,
              color: 'var(--color-accent)',
              background: 'var(--color-accent-wash)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-control)',
              padding: '4px 8px'
            }}
          >
            {matchPercentage}% match
          </span>
        </div>

        {c.rating != null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: 'var(--space-1) var(--space-3)',
              borderTop: '1px solid var(--color-line)',
              borderBottom: '1px solid var(--color-line)',
              background: 'var(--color-base-alt)'
            }}
          >
            <Star
              style={{ width: 14, height: 14, fill: 'var(--color-accent)', color: 'var(--color-accent)' }}
              aria-hidden="true"
            />
            <span className="annotation tabular" style={{ color: 'var(--color-ink)' }}>
              {c.rating.toFixed(1)} average rating
            </span>
          </div>
        )}

        <div style={{ padding: 'var(--space-3)' }}>
          <p className="annotation" style={{ marginBottom: 6 }}>Why we matched you</p>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--type-3)',
              lineHeight: 'var(--leading-body)',
              color: 'var(--color-ink-2)'
            }}
          >
            {match.match_reasoning ??
              'This contractor clears the 80% compatibility line on scope, budget and service area.'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-1)',
            padding: 'var(--space-3)',
            borderTop: '1px solid var(--color-line)'
          }}
        >
          <button
            onClick={() => onPass(match.id)}
            disabled={passing}
            className="btn-secondary"
            style={{ flex: 1, gap: 8, cursor: 'pointer' }}
          >
            <X style={{ width: 15, height: 15 }} aria-hidden="true" />
            Pass
          </button>

          <button
            onClick={() => { setIsSaved(v => !v); onSave(match.id) }}
            className="btn-secondary"
            aria-pressed={isSaved}
            aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
            style={{
              cursor: 'pointer',
              borderColor: isSaved ? 'var(--color-accent)' : undefined,
              color: isSaved ? 'var(--color-accent)' : undefined
            }}
          >
            <Bookmark
              style={{ width: 15, height: 15, fill: isSaved ? 'var(--color-accent)' : 'none' }}
              aria-hidden="true"
            />
          </button>

          <button
            onClick={() => onHeart(match.id)}
            disabled={saving}
            className="btn-primary"
            style={{ flex: 1, gap: 8, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            <Heart style={{ width: 15, height: 15 }} aria-hidden="true" />
            Interested
          </button>
        </div>
      </div>

      <p
        className="annotation"
        style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}
      >
        Interested opens a private thread · Pass hides them · Bookmark saves for later
      </p>
    </div>
  )
}
