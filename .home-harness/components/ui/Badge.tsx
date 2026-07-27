import React from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)]',
      success: 'bg-[var(--color-success)] bg-opacity-20 text-[var(--color-success)]',
      warning: 'bg-[var(--color-warning)] bg-opacity-20 text-[var(--color-warning)]',
      error: 'bg-[var(--color-error)] bg-opacity-20 text-[var(--color-error)]',
      info: 'bg-[var(--color-info)] bg-opacity-20 text-[var(--color-info)]',
    }

    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
