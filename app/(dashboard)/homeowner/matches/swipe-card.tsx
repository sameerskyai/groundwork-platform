'use client'

import { useState } from 'react'
import { Heart, X, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'

export interface Match {
  id: string
  match_score: number
  match_reasoning: string
  contractor: {
    id: string
    business_name: string
    rating: number
    review_count: number
    verified_job_count: number
    years_in_business: number
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

  // Gate: only show if >= 80% match
  if (matchPercentage < 80) {
    return null
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <Card className="w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div style={{
          backgroundColor: 'var(--color-surface-secondary)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-md)'
        }}>
          <h2 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-primary)'
          }}>
            Match found
          </h2>
        </div>

        {/* Profile Section */}
        <div className="flex-1 flex flex-col gap-4 p-6">
          {/* Avatar + Name + Match Score */}
          <div className="flex gap-4">
            {match.contractor.profiles?.avatar_url && (
              <img
                src={match.contractor.profiles.avatar_url}
                alt={match.contractor.business_name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <h3 style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-xs)'
              }}>
                {match.contractor.business_name}
              </h3>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-sm)'
              }}>
                {match.contractor.years_in_business} years · {match.contractor.review_count} reviews
              </p>
              <div style={{
                display: 'inline-block',
                backgroundColor: 'var(--color-brand-lighter)',
                color: 'var(--color-brand)',
                padding: 'var(--space-xs) var(--space-sm)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)'
              }}>
                {matchPercentage}% match
              </div>
            </div>
          </div>

          {/* Rating */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            backgroundColor: 'var(--color-surface-secondary)',
            borderRadius: 'var(--radius-md)'
          }}>
            <span style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)'
            }}>
              ⭐ {match.contractor.rating.toFixed(1)}
            </span>
            <span style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)'
            }}>
              • {match.contractor.verified_job_count} verified jobs
            </span>
          </div>

          {/* Match Reasoning */}
          <div style={{
            padding: 'var(--space-md)',
            backgroundColor: 'var(--color-surface-secondary)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '3px solid var(--color-brand)'
          }}>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--leading-relaxed)',
              margin: 0
            }}>
              {match.match_reasoning}
            </p>
          </div>

          {/* Call to Action */}
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-tertiary)',
            textAlign: 'center',
            margin: 'var(--space-md) 0 0 0'
          }}>
            Heart to match · Pass to skip · Save for later
          </p>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          padding: 'var(--space-lg)',
          borderTop: '1px solid var(--color-border)'
        }}>
          <button
            onClick={() => onPass(match.id)}
            disabled={passing}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-md)',
              backgroundColor: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              cursor: 'pointer',
              transition: 'all 200ms'
            }}
            className="hover:opacity-80"
          >
            <X className="w-4 h-4" />
            Pass
          </button>

          <button
            onClick={() => {
              setIsSaved(!isSaved)
              onSave(match.id)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-md)',
              backgroundColor: isSaved ? 'var(--color-brand-lighter)' : 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              color: isSaved ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              cursor: 'pointer',
              transition: 'all 200ms'
            }}
            className="hover:opacity-80"
          >
            <Bookmark className="w-4 h-4" style={{ fill: isSaved ? 'var(--color-brand)' : 'none' }} />
          </button>

          <Button
            onClick={() => onHeart(match.id)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4" style={{ fill: 'white' }} />
            Heart
          </Button>
        </div>
      </Card>
    </div>
  )
}
