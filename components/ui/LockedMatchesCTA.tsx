import React from 'react'
import { Lock, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface LockedMatchesCTAProps {
  lockedCount: number
  onUpgradeClick?: () => void
}

export const LockedMatchesCTA = React.forwardRef<HTMLDivElement, LockedMatchesCTAProps>(
  ({ lockedCount, onUpgradeClick }, ref) => {
    if (lockedCount === 0) return null

    return (
      <div
        ref={ref}
        style={{
          backgroundColor: 'var(--color-surface-secondary)',
          borderRadius: 'var(--radius-lg)',
          borderLeft: `4px solid var(--color-brand)`,
          padding: 'var(--space-lg)',
          marginTop: 'var(--space-2xl)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-lg)' }}>
          <Lock
            style={{
              width: '20px',
              height: '20px',
              color: 'var(--color-brand)',
              flexShrink: 0,
              marginTop: '2px'
            }}
          />
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-sm)'
              }}
            >
              {lockedCount} more contractor{lockedCount !== 1 ? 's' : ''} matched above 80%
            </h3>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-lg)',
                lineHeight: 'var(--leading-normal)'
              }}
            >
              Unlock unlimited contractor matching with Homeowner+. See all matches, message any contractor, join the community.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={onUpgradeClick}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)' }}
            >
              Upgrade to Homeowner+
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </Button>
          </div>
        </div>
      </div>
    )
  }
)

LockedMatchesCTA.displayName = 'LockedMatchesCTA'
