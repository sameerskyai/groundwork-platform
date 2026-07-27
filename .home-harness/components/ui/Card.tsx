import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'accent'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className = '', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-[var(--color-surface-primary)] border border-[var(--color-border)]',
      interactive:
        'bg-[var(--color-surface-primary)] border border-[var(--color-border)] hover:shadow-md transition-shadow duration-[var(--duration-normal)] hover:border-[var(--color-brand-lighter)]',
      accent: 'bg-[var(--color-brand-lighter)] border border-[var(--color-brand)]',
    }

    return (
      <div
        ref={ref}
        className={`rounded-lg p-4 sm:p-6 ${variantClasses[variant]} ${className}`}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'
