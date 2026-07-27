import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon: Icon, title, description, action }, ref) => {
    return (
      <div
        ref={ref}
        className="flex flex-col items-center justify-center py-12 px-6"
        style={{
          backgroundColor: 'var(--color-surface-secondary)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div className="mb-4">
          <Icon className="w-12 h-12" style={{ color: 'var(--color-text-tertiary)' }} />
        </div>

        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h3>

        <p className="text-sm mb-6 max-w-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>

        {action && (
          <Button size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    )
  }
)

EmptyState.displayName = 'EmptyState'
