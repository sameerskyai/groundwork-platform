import React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rect'
  height?: string
  width?: string
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', height, width, className = '', ...props }, ref) => {
    const variantClasses = {
      text: 'h-4 w-full rounded',
      circle: 'rounded-full',
      rect: 'rounded-lg',
    }

    const baseStyles = `bg-gradient-to-r from-[var(--color-surface-secondary)] via-[var(--color-surface-tertiary)] to-[var(--color-surface-secondary)] animate-pulse`

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantClasses[variant]} ${className}`}
        style={{
          height: height || (variant === 'text' ? 'auto' : '40px'),
          width: width || '100%',
        }}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'
